// 用户确认/否认短语 —— 从 useChatStream.ts 拆出以便单测。
export const CONFIRM_WORDS = ['是', '好', '建', '确认', '对', '要', '行', '加', 'yes', 'ok', 'sure', 'yeah', 'yep'];
export const DENY_WORDS    = ['不', '算', '取消', '否', '不要', '不用', 'no', 'nope', 'cancel'];

export function isConfirmation(text: string): boolean {
  const t = text.trim().toLowerCase();
  return CONFIRM_WORDS.some(w => t === w || (t.startsWith(w) && t.length <= 5));
}

export function isDenial(text: string): boolean {
  const t = text.trim().toLowerCase();
  return DENY_WORDS.some(w => t.startsWith(w));
}
