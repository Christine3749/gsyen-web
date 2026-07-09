import { EventItem } from '../types/schedule';
import { ActionCard } from '../types/chat';
import { scheduleStore } from '../stores/scheduleStore';
import { detectScheduleIntent, enrichMessageForSchedule } from '../stores/scheduleIntent';
import { DomainHandler, DomainActionResult } from './types';
import { ChronosEventDraft, parseChronosAIBlock, parseChronosNatural } from './chronosParser';

/** Build a ready-to-save EventItem from raw AI structured data. */
function buildEventItem(data: ChronosEventDraft | any): EventItem {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    id:       `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

function buildCard(
  action: ActionCard['action'],
  item: EventItem | { title: string; date?: string; time?: string; category?: string; location?: string }
): ActionCard {
  const meta: string[] = [];
  if ('date' in item && item.date) {
    meta.push(`${item.date}${('time' in item && item.time) ? '  ·  ' + item.time : ''}`);
  }
  if ('category' in item && item.category) meta.push(item.category);
  if ('location' in item && item.location) meta.push(item.location);
  // 带上真实记录的 id——这样卡片就不再只是文字快照，而是能点开看详情、
  // 且与"日程日历"看板里那条真实记录联动（同一个 scheduleStore 数据源）。
  // 只有 create/update（背后是真正的 EventItem）才有稳定 id；delete 之后记录已不存在，
  // 仍带上 id 方便用户点开看"这条记录曾经的样子"，但操作按钮会被禁用。
  const id = 'id' in item ? item.id : undefined;
  return { module: 'CHRONOS', action, title: item.title, meta: meta.filter(Boolean), id };
}

function commit(item: EventItem): void {
  scheduleStore.add(item);
  window.dispatchEvent(new CustomEvent('schedule-updated'));
}

function createResult(data: ChronosEventDraft | any): DomainActionResult {
  const item = buildEventItem(data);
  commit(item);
  return { card: buildCard('create', item), notify: { action: 'create', title: item.title } };
}

export const chronosHandler: DomainHandler = {
  module: 'CHRONOS',

  detectIntent(text) {
    return detectScheduleIntent(text);
  },

  enrichMessage(text, intent, lang) {
    if (intent === 'add' && parseChronosNatural(text)) {
      return lang === 'zh'
        ? `${text}\n\n[系统指令] 对应日程卡片已由本地系统创建。不要输出 JSON、schedule 代码块或重复结构化数据；只用一句自然语言确认即可。`
        : `${text}\n\n[System] The calendar card has already been created locally. Do not output JSON, schedule code blocks, or duplicate structured data; only confirm naturally in one sentence.`;
    }
    return enrichMessageForSchedule(text, intent as any, lang);
  },

  eagerCard(text): ActionCard | null {
    const draft = parseChronosNatural(text);
    if (!draft) return null;
    const item = buildEventItem(draft);
    commit(item);
    return buildCard('create', item);
  },

  buildContext() {
    return scheduleStore.getAll().map(e => ({ id: e.id, title: e.title, date: e.date, time: e.time }));
  },

  handleAction(action, ev, lang): DomainActionResult | null {
    if (!ev?.title && action !== 'query') return null;

    switch (action) {
      case 'create': {
        return createResult(ev);
      }
      case 'confirm':
        return { pending: ev };

      case 'delete': {
        const target = scheduleStore.getAll().find(e =>
          e.title.includes(ev.title) || ev.title.includes(e.title)
        );
        if (!target) return null;
        scheduleStore.remove(target.id);
        window.dispatchEvent(new CustomEvent('schedule-updated'));
        return { card: buildCard('delete', target), notify: { action: 'delete', title: target.title } };
      }
      case 'update': {
        const target = scheduleStore.getAll().find(e =>
          e.title.includes(ev.title) || ev.title.includes(e.title)
        );
        if (!target) return null;
        const changes = {
          ...(ev.date     && { date:     ev.date }),
          ...(ev.time     && { time:     ev.time }),
          ...(ev.location && { location: ev.location }),
          ...(ev.subtitle && { subtitle: ev.subtitle }),
        };
        scheduleStore.update(target.id, changes);
        window.dispatchEvent(new CustomEvent('schedule-updated'));
        const updated = { ...target, ...changes };
        return { card: buildCard('update', updated), notify: { action: 'update', title: updated.title } };
      }
      case 'query': {
        const todayEvents = scheduleStore.getToday();
        if (todayEvents.length === 0) return { notify: { action: 'query', title: '' } };
        return {
          card: {
            module: 'CHRONOS',
            action: 'query',
            title:  lang === 'zh' ? '今日日程' : "Today's Schedule",
            meta:   todayEvents.map(e => `${e.time}  ${e.title}${e.location ? '  · ' + e.location : ''}`),
          },
          notify: { action: 'query', title: '' },
        };
      }
      default:
        return null;
    }
  },

  resolveConfirmation(pending, lang): DomainActionResult | null {
    const item = buildEventItem(pending as any);
    commit(item);
    return {
      card: buildCard('create', item),
      notify: { action: 'create', title: item.title },
      reply: lang === 'zh' ? '已建立。' : 'Done.',
    };
  },

  handleStreamResult(intent, fullText): DomainActionResult | null {
    if (intent !== 'add') return null;
    const event = scheduleStore.parseFromAIResponse(fullText) ?? parseChronosAIBlock(fullText);
    if (!event) return null;
    return createResult(event);
  },
};
