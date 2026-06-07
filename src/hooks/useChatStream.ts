import { useState, useCallback } from 'react';
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

      const isStructured = STRUCTURED_MODELS.has(model);

      // 2. SSE 模型走关键词检测+消息增强；结构化模型由神机百炼 schema 处理意图
      let enrichedText = text;
      if (!isStructured) {
        const intent = detectScheduleIntent(text);
        if (intent) enrichedText = enrichMessageForSchedule(text, intent, lang);
      }

      // 3. Build message history
      const userMsg: ChatMessage = {
        id:        `user-${Date.now()}`,
        role:      'user',
        content:   text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const apiMessages = [...history, { ...userMsg, content: enrichedText }];

      // 4. 结构化模型带上当前日程上下文（供 update/delete 匹配）
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
        // SSE 模型的日程创建（```schedule``` 块解析）
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
        // ── 神机百炼结构化路径（ethan / fast / gemini）──────────
        const data = await response.json();
        const reply  = data.text   ?? (lang === 'zh' ? '抱歉，未返回有效回复。' : 'Empty response.');
        const action = data.action ?? 'none';
        const ev     = data.event;

        // ── 执行 Chronos CRUD ────────────────────────────────────
        if (action === 'create' && ev?.title) {
          const item = buildEventItem(ev);
          scheduleStore.add(item);
          window.dispatchEvent(new CustomEvent('schedule-updated'));
          onScheduleAction?.('create', item.title);

        } else if (action === 'delete' && ev?.title) {
          const all    = scheduleStore.getAll();
          const target = all.find(e =>
            e.title.includes(ev.title) || ev.title.includes(e.title)
          );
          if (target) {
            scheduleStore.remove(target.id);
            window.dispatchEvent(new CustomEvent('schedule-updated'));
            onScheduleAction?.('delete', target.title);
          }

        } else if (action === 'update' && ev?.title) {
          const all    = scheduleStore.getAll();
          const target = all.find(e =>
            e.title.includes(ev.title) || ev.title.includes(e.title)
          );
          if (target) {
            scheduleStore.update(target.id, {
              ...(ev.date     && { date:     ev.date }),
              ...(ev.time     && { time:     ev.time }),
              ...(ev.location && { location: ev.location }),
              ...(ev.subtitle && { subtitle: ev.subtitle }),
            });
            window.dispatchEvent(new CustomEvent('schedule-updated'));
            onScheduleAction?.('update', target.title);
          }

        } else if (action === 'query') {
          onScheduleAction?.('query', '');
        }

        // ── Typewriter 效果 ──────────────────────────────────────
        let displayed = '';
        for (const char of reply) {
          displayed += char;
          onToken(displayed + '▍');
          await new Promise(r => setTimeout(r, charDelay(char)));
        }
        onDone(reply);
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
