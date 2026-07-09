import { EventItem, EventCategory } from '../types/schedule';
import { localDateStr } from '../utils/date';

export type ChronosEventDraft = Pick<EventItem, 'title' | 'time' | 'date'> &
  Partial<Pick<EventItem, 'subtitle' | 'endDate' | 'category' | 'location'>>;

const CN_NUM: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

const DATE_WORD = /(今天|明天|明早|明晚|后天|大后天|下周[一二三四五六日天]|这周[一二三四五六日天]|本周[一二三四五六日天]|周[一二三四五六日天]|星期[一二三四五六日天])/g;
const DATE_NUM = /(?:(20\d{2})[年/-])?(\d{1,2})[月/-](\d{1,2})[日号]?/g;
const TIME_WORD = /(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上|夜里)?\s*([0-9]{1,2}|[零〇一二两三四五六七八九十]{1,3})\s*(?:点|时)(半|[0-9]{1,2}分?)?/g;
const TIME_COLON = /(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上|夜里)?\s*([0-9]{1,2})[:：]([0-9]{1,2})/g;
const ACTION_HINT = /(去|到|前往|回|回家|出发|抵达|见|找|约|拜访|开会|会议|对接|吃饭|聚餐|提交|截止|交付|上课|面试|汇报|复盘|签约|体检|看病|处理|办理|登录|确认)/;

function toInt(raw: string): number | null {
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === '十') return 10;
  const [ten, one] = raw.split('十');
  if (one !== undefined) {
    const tens = ten ? CN_NUM[ten] : 1;
    const ones = one ? CN_NUM[one] : 0;
    return tens == null || ones == null ? null : tens * 10 + ones;
  }
  return CN_NUM[raw] ?? null;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return next;
}

function weekdayOffset(base: Date, raw: string): number {
  const map: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 };
  const target = map[raw.charAt(raw.length - 1)];
  if (target == null) return 0;
  let diff = target - base.getDay();
  if (raw.startsWith('下周')) return diff <= 0 ? diff + 7 : diff + 7;
  if (diff < 0) diff += 7;
  return diff;
}

function parseDate(text: string, now: Date): string {
  const explicit = [...text.matchAll(DATE_NUM)][0];
  if (explicit) {
    const year = explicit[1] ? Number(explicit[1]) : now.getFullYear();
    return localDateStr(new Date(year, Number(explicit[2]) - 1, Number(explicit[3])));
  }
  const word = [...text.matchAll(DATE_WORD)][0]?.[1];
  if (!word || word === '今天') return localDateStr(now);
  if (word === '明天' || word === '明早' || word === '明晚') return localDateStr(addDays(now, 1));
  if (word === '后天') return localDateStr(addDays(now, 2));
  if (word === '大后天') return localDateStr(addDays(now, 3));
  return localDateStr(addDays(now, weekdayOffset(now, word)));
}

function normalizeHour(hour: number, period = ''): number {
  if (period === '下午' || period === '傍晚' || period === '晚上' || period === '夜里') {
    return hour < 12 ? hour + 12 : hour;
  }
  if (period === '中午') return hour < 11 ? hour + 12 : hour;
  if (period === '凌晨' && hour === 12) return 0;
  return hour;
}

function parseTime(text: string): string | null {
  const colon = [...text.matchAll(TIME_COLON)][0];
  if (colon) {
    const hour = normalizeHour(Number(colon[2]), colon[1]);
    return `${String(hour).padStart(2, '0')}:${String(Number(colon[3])).padStart(2, '0')}`;
  }
  const word = [...text.matchAll(TIME_WORD)][0];
  if (!word) return null;
  const hourRaw = toInt(word[2]);
  if (hourRaw == null) return null;
  const minuteRaw = word[3] ?? '';
  const minute = minuteRaw === '半' ? 30 : Number(minuteRaw.replace('分', '') || 0);
  const hour = normalizeHour(hourRaw, word[1]);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function cleanTitle(text: string): string {
  return text
    .replace(DATE_NUM, ' ')
    .replace(DATE_WORD, ' ')
    .replace(TIME_COLON, ' ')
    .replace(TIME_WORD, ' ')
    .replace(/(帮我|请|麻烦|给我|把|记一下|记录一下|安排一下|安排|添加|新增|新建|建立|创建)/g, ' ')
    .replace(/(我想要|我想|我要|我打算|我需要|我今天要|今天要|明天要)/g, ' ')
    .replace(/[，。,.；;！!？?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCategory(title: string): EventCategory {
  if (/(工资|钱|款|付款|收款|报价|发票|报销|账|合同)/.test(title)) return 'finance';
  if (/(密码|密钥|登录|账号|验证|证件|安全)/.test(title)) return 'secure';
  if (/(设计|品牌|稿|图片|方案|海报|拍摄|文案)/.test(title)) return 'creative';
  return 'strategy';
}

function inferLocation(title: string): string {
  const travel = title.match(/(?:去|到|前往|回)([\u4e00-\u9fa5A-Za-z0-9·-]{2,}?)(?:回家|办事|出差|处理|参加|开会|见|$)/);
  return travel?.[1] ?? '';
}

export function parseChronosNatural(text: string, now = new Date()): ChronosEventDraft | null {
  const time = parseTime(text);
  if (!time || !ACTION_HINT.test(text)) return null;
  const title = cleanTitle(text);
  if (!title || title.length < 2) return null;
  const date = parseDate(text, now);
  return {
    title,
    subtitle: inferLocation(title) || title,
    time,
    date,
    endDate: date,
    category: inferCategory(title),
    location: inferLocation(title),
  };
}

function normalizeJsonPayload(raw: unknown): ChronosEventDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, any>;
  const payload = data.event ?? data.schedule ?? data.payload ?? data;
  const action = String(data.action ?? payload.action ?? '').toLowerCase();
  if (action && !/(create|schedule|add)/.test(action)) return null;
  if (!payload.title) return null;
  const today = localDateStr(new Date());
  return {
    title: String(payload.title),
    subtitle: payload.subtitle ? String(payload.subtitle) : '',
    time: payload.time ? String(payload.time) : '09:00',
    date: payload.date ? String(payload.date) : today,
    endDate: payload.endDate ? String(payload.endDate) : payload.date ? String(payload.date) : today,
    category: payload.category || 'strategy',
    location: payload.location ? String(payload.location) : '',
  };
}

export function parseChronosAIBlock(text: string): ChronosEventDraft | null {
  const blocks = [...text.matchAll(/```(?:schedule|json)?\s*([\s\S]*?)```/gi)].map(m => m[1].trim());
  const candidates = blocks.length ? blocks : [text.trim()];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const normalized = normalizeJsonPayload(parsed);
      if (normalized) return normalized;
    } catch {
      // try next candidate
    }
  }
  return null;
}
