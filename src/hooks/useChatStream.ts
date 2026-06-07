import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { ModelId } from '../config/models';
import { EventItem } from '../types/schedule';
import { sendToGateway, readSSEStream } from '../services/chatService';
import { askPredictionExpert } from '../services/predictService';
import {
  scheduleStore,
  detectScheduleIntent,
  enrichMessageForSchedule,
} from '../stores/scheduleStore';

// Models that return application/json with {text, action, event} instead of SSE.
const STRUCTURED_MODELS = new Set<ModelId>(['gemini', 'ethan', 'fast'] as ModelId[]);

export type ScheduleActionType = 'create' | 'update' | 'delete' | 'query';

/** Build a ready-to-save EventItem from raw AI structured data. */
function buildEventItem(data: any): EventItem {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    id:       `ai-${Date.now()}`,
    title:    data.title,
    subtitle: data.subtitle  || '',
    time:     data.time      || '09:00',
    date:     data.date      || todayStr,
    endDate:  data.endDate   || data.date || todayStr,
    category: data.category  || 'strategy',
    location: data.location  || '',
    completed: false,
    status:   'todo',
  };
}

// 用户确认/否认短语
const CONFIRM_WORDS = ['是', '好', '建', '确认', '对', '要', '行', '加', 'yes', 'ok', 'sure', 'yeah', 'yep'];
const DENY_WORDS    = ['不', '算', '取消', '否', '不要', '不用', 'no', 'nope', 'cancel'];

function isConfirmation(text: string): boolean {
  const t = text.trim().toLowerCase();
  return CONFIRM_WORDS.some(w => t === w || (t.startsWith(w) && t.length <= 5));
}
function isDenial(text: string): boolean {
  const t = text.trim().toLowerCase();
  return DENY_WORDS.some(w => t.startsWith(w));
}

// Typewriter delays (ms)
const DELAY = {
  sentenceEnd: () => 300 + Math.random() * 250,
  comma:       () => 120 + Math.random() * 100,
  newline:     () => 200 + Math.random() * 200,
  rare:        () => 100 + Math.random() * 150,
  normal:      () => 30  + Math.random() * 25,
};

function charDelay(char: string): number {
  if ('。！？…'.includes(char)) return DELAY.sentenceEnd();
  if ('，、；：'.includes(char)) return DELAY.comma();
  if (char === '\n')             return DELAY.newline();
  if (Math.random() < 0.05)     return DELAY.rare();
  return DELAY.normal();
}

async function typewrite(text: string, onToken: (t: string) => void): Promise<void> {
  let displayed = '';
  for (const char of text) {
    displayed += char;
    onToken(displayed + '▍');
    await new Promise(r => setTimeout(r, charDelay(char)));
  }
}

interface UseChatStreamReturn {
  isLoading: boolean;
  send: (opts: {
    text: string;
    model: ModelId;
    history: ChatMessage[];
    lang: 'zh' | 'en';
    onToken:           (fullText: string) => void;
    onDone:            (fullText: string) => void;
    onError:           (errMsg: string)   => void;
    onScheduleAction?: (action: ScheduleActionType, title: string) => void;
  }) => Promise<void>;
}

export function useChatStream(): UseChatStreamReturn {
  const [isLoading, setIsLoading] = useState(false);
  // 待确认的预填日程（confirm action 时暂存）
  const pendingEvent = useRef<any>(null);

  const send = useCallback(async ({
    text, model, history, lang,
    onToken, onDone, onError, onScheduleAction,
  }: Parameters<UseChatStreamReturn['send']>[0]) => {
    setIsLoading(true);

    try {
      // 1. Try local prediction expert first
      const localAnswer = await askPredictionExpert(text);
      if (localAnswer) {
        setIsLoading(false);
        onDone(localAnswer);
        return;
      }

      // 2. 检查是否在等待用户确认建立行程
      if (pendingEvent.current) {
        if (isConfirmation(text)) {
          // 用户确认 → 直接建立，不再请求 AI
          const item = buildEventItem(pendingEvent.current);
          scheduleStore.add(item);
          window.dispatchEvent(new CustomEvent('schedule-updated'));
          onScheduleAction?.('create', item.title);
          pendingEvent.current = null;
          const confirmReply = (lang === 'zh' ? '已建立。' : 'Done.')
            + `\n\n▎ **${item.title}**`
            + `\n▎ ${item.date}  ${item.time}`
            + (item.location ? `\n▎ ${item.location}` : '');
          await typewrite(confirmReply, onToken);
          setIsLoading(false);
          onDone(confirmReply);
          return;
        } else if (isDenial(text)) {
          // 用户否认 → 清除，正常对话
          pendingEvent.current = null;
        }
        // 其他情况：清除待确认，继续正常处理
        pendingEvent.current = null;
      }

      const isStructured = STRUCTURED_MODELS.has(model);

      // 3. SSE 模型走关键词检测+消息增强
      let enrichedText = text;
      if (!isStructured) {
        const intent = detectScheduleIntent(text);
        if (intent) enrichedText = enrichMessageForSchedule(text, intent, lang);
      }

      // 4. Build message history
      const userMsg: ChatMessage = {
        id:        `user-${Date.now()}`,
        role:      'user',
        content:   text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const apiMessages = [...history, { ...userMsg, content: enrichedText }];

      // 5. 结构化模型带上当前日程上下文
      const eventsCtx = isStructured
        ? scheduleStore.getAll().map(e => ({ id: e.id, title: e.title, date: e.date, time: e.time }))
        : undefined;

      const response = await sendToGateway(model, apiMessages, eventsCtx);
      setIsLoading(false);

      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('text/event-stream')) {
        // ── SSE 流式路径 ─────────────────────────────────────────
        let fullText = '';
        for await (const delta of readSSEStream(response)) {
          for (const char of delta) {
            fullText += char;
            onToken(fullText + '▍');
            await new Promise(r => setTimeout(r, charDelay(char)));
          }
        }
        const intent = detectScheduleIntent(text);
        if (intent === 'add') {
          const event = scheduleStore.parseFromAIResponse(fullText);
          if (event) {
            scheduleStore.add(event);
            window.dispatchEvent(new CustomEvent('schedule-updated'));
            onScheduleAction?.('create', event.title);
          }
        }
        onDone(fullText || '…');

      } else {
        // ── 神机百炼结构化路径 ───────────────────────────────────
        const data   = await response.json();
        const reply  = data.text   ?? (lang === 'zh' ? '抱歉，未返回有效回复。' : 'Empty response.');
        const action = data.action ?? 'none';
        const ev     = data.event;

        let finalReply = reply;

        if (action === 'create' && ev?.title) {
          // 意图明确 → 直接建立
          const item = buildEventItem(ev);
          scheduleStore.add(item);
          window.dispatchEvent(new CustomEvent('schedule-updated'));
          onScheduleAction?.('create', item.title);
          // 在聊天气泡里附上行程卡片
          finalReply = reply
            + `\n\n▎ **${item.title}**`
            + `\n▎ ${item.date}  ${item.time}`
            + (item.location ? `\n▎ ${item.location}` : '')
            + (item.subtitle ? `\n▎ ${item.subtitle}` : '');

        } else if (action === 'confirm' && ev?.title) {
          // 意图模糊 → 暂存，等待确认
          pendingEvent.current = ev;

        } else if (action === 'delete' && ev?.title) {
          const target = scheduleStore.getAll().find(e =>
            e.title.includes(ev.title) || ev.title.includes(e.title)
          );
          if (target) {
            scheduleStore.remove(target.id);
            window.dispatchEvent(new CustomEvent('schedule-updated'));
            onScheduleAction?.('delete', target.title);
            finalReply = reply + `\n\n▎ ~~${target.title}~~ 已删除`;
          }

        } else if (action === 'update' && ev?.title) {
          const target = scheduleStore.getAll().find(e =>
            e.title.includes(ev.title) || ev.title.includes(e.title)
          );
          if (target) {
            const changes = {
              ...(ev.date     && { date:     ev.date }),
              ...(ev.time     && { time:     ev.time }),
              ...(ev.location && { location: ev.location }),
              ...(ev.subtitle && { subtitle: ev.subtitle }),
            };
            scheduleStore.update(target.id, changes);
            window.dispatchEvent(new CustomEvent('schedule-updated'));
            onScheduleAction?.('update', target.title);
            const updated = { ...target, ...changes };
            finalReply = reply
              + `\n\n▎ **${updated.title}**`
              + `\n▎ ${updated.date}  ${updated.time}`
              + (updated.location ? `\n▎ ${updated.location}` : '');
          }

        } else if (action === 'query') {
          const todayEvents = scheduleStore.getToday();
          if (todayEvents.length > 0) {
            finalReply = reply + '\n\n'
              + todayEvents.map(e =>
                  `▎ **${e.title}**  ${e.time}` + (e.location ? `  · ${e.location}` : '')
                ).join('\n');
          }
          onScheduleAction?.('query', '');
        }

        await typewrite(finalReply, onToken);
        onDone(finalReply);
      }

    } catch (err) {
      setIsLoading(false);
      onError(
        lang === 'zh'
          ? '⚠️ **通讯失败**：模型响应超时或连接中断，请稍后重试。'
          : '⚠️ **Connection Failed**: Model timed out or was interrupted. Please retry.'
      );
    }
  }, []);

  return { isLoading, send };
}
