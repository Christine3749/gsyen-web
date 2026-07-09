import { localDateStr } from '../utils/date';
import { scheduleStore } from './scheduleStore';

const QUERY_KEYWORDS = [
  '今天计划', '今天日程', '今天安排', '工作计划', '工作安排',
  "today's schedule", "today plan", "what's scheduled",
];
const ADD_KEYWORDS = [
  '添加日程', '加入日历', '新建日程', '帮我记录', '帮我安排',
  '安排一个', '加一个', '记一下', '记录一下', '新增', '建一个',
  '今天要做', '今天我要', '今天打算', '今天需要', '今天准备',
  '安排今天', '今天工作', '今天任务',
  '今天有', '今天下午有', '今天上午有', '今天晚上有',
  '明天有', '明天下午有', '明天上午有',
  '下午有', '上午有', '晚上有', '早上有',
  '有个会', '有一个会', '有个活动', '有一个活动',
  '有个发布', '有一个发布', '有个产品', '有一个产品',
  '要参加', '要去', '想去', '准备去', '要看一个', '要开会',
  'add schedule', 'add event', 'create event', 'schedule a', 'remind me',
  'put it on', 'block time', 'plan to',
  'have a meeting', 'have a call', 'have an event',
];

const TIME_EXPR = /(今天|明天|后天|大后天|下周|这周|本周|周[一二三四五六日天]|星期[一二三四五六日天]|[0-9]{1,2}[点:：][0-9]{0,2}|[零〇一二两三四五六七八九十]{1,3}[点时]|上午|下午|晚上|早上|早晨|中午|傍晚|凌晨)/;
const ACTIVITY_VERB = /(开会|会议|评审|评审会|面试|约见|见面|聚餐|出差|上课|讲座|汇报|培训|拜访|签约|面谈|发布会|演讲|答辩|体检|看病|聚会|约会|碰头|讨论|对接|复盘|路演|提交|截止|交付|发车|起飞|出发|集合|去|到|前往|回家|找|处理|办理|登录|确认)/;

export type ScheduleIntent = 'query' | 'add' | null;

export function detectScheduleIntent(text: string): ScheduleIntent {
  const lower = text.toLowerCase();
  if (QUERY_KEYWORDS.some(k => lower.includes(k.toLowerCase()))) return 'query';
  if (ADD_KEYWORDS.some(k => lower.includes(k.toLowerCase()))) return 'add';
  if (TIME_EXPR.test(text) && ACTIVITY_VERB.test(text)) return 'add';
  return null;
}

export function enrichMessageForSchedule(text: string, intent: ScheduleIntent, lang: 'zh' | 'en'): string {
  if (intent === 'query') {
    const ctx = scheduleStore.buildTodayContext(lang);
    return lang === 'zh'
      ? `[日程上下文]\n${ctx}\n\n[用户问题]\n${text}`
      : `[Schedule Context]\n${ctx}\n\n[User Question]\n${text}`;
  }
  if (intent === 'add') {
    const today = localDateStr(new Date());
    const instruction = lang === 'zh'
      ? `\n\n[系统指令] 今天是 ${today}。请在回复末尾附上如下格式的日程数据，系统将自动写入日历（仅需一个 \`\`\`schedule\`\`\` 块，日期若未指定请默认今天）：\n\`\`\`schedule\n{"title":"事件名称","date":"${today}","time":"09:00","category":"creative","location":"","subtitle":"简短说明"}\n\`\`\``
      : `\n\n[System] Today is ${today}. Please append one \`\`\`schedule\`\`\` block at the end of your reply so the system can auto-create the calendar event (use today's date if not specified):\n\`\`\`schedule\n{"title":"Event title","date":"${today}","time":"09:00","category":"creative","location":"","subtitle":"Brief note"}\n\`\`\``;
    return text + instruction;
  }
  return text;
}
