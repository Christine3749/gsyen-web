import { ActionCard } from '../types/chat';
import { DomainHandler, DomainActionResult } from './types';

// 从用户原话提取收件人名字："给 yuki 写一份邮件" / "发邮件给张总" / "email to yuki"
function extractRecipient(text: string): string {
  const m =
    text.match(/给\s*([^\s给写发的，,。.]{1,20})\s*(?:写|发).{0,4}邮件/) ||
    text.match(/给\s*([^\s给写发的，,。.]{1,20})\s*的邮件/) ||
    text.match(/(?:发|写)邮件给\s*([^\s，,。.]{1,20})/) ||
    text.match(/(?:email|mail)\s+(?:to\s+)?([^\s,，.]{1,20})/i);
  return m?.[1]?.trim() ?? '';
}

// 从用户原话提取主题线索："关于X的邮件" / "发一封X信" / "邀请参加X"
function extractSubject(text: string, recipient: string, lang: 'zh' | 'en'): string {
  const about = text.match(/关于\s*([^的邮件\s，,。.]{2,16})/);
  if (about) return about[1].trim();
  const letter = text.match(/(?:一封|一份)\s*([^邮件写发的\s，,。.]{2,12})\s*(?:信|邮件)/);
  if (letter) return letter[1].trim();
  const invite = text.match(/邀请.{0,8}参加\s*([^，,。.\s]{2,16})/);
  if (invite) return invite[1].trim();
  return lang === 'zh' ? `致 ${recipient}` : `To ${recipient}`;
}

// 模块作用域：SSE 路径需要跨 detectIntent → handleStreamResult 传递收件人
let _lastRecipient = '';

export const mailHandler: DomainHandler = {
  module: 'MAIL',

  detectIntent(text) {
    if (/写邮件|发邮件|邮件给|给.{1,20}(?:写|发).{0,5}邮件|email|mail/i.test(text)) {
      _lastRecipient = extractRecipient(text);
      return 'compose';
    }
    return null;
  },

  // SSE 模型：在原始消息后附注，引导模型回复时顺带输出 JSON 标记供解析
  enrichMessage(text, _intent, lang) {
    const hint = _lastRecipient ? `收件人：${_lastRecipient}。` : '';
    return lang === 'zh'
      ? `${text}\n[邮件任务：${hint}请回复构思建议，并在末尾附上 JSON {"recipient":"${_lastRecipient}","subject":"邮件主题"}]`
      : `${text}\n[Mail task: ${hint}Reply with suggestions and append JSON {"recipient":"${_lastRecipient}","subject":"subject line"}]`;
  },

  buildContext() {
    return undefined;
  },

  handleAction(action, ev, lang): DomainActionResult | null {
    if (action !== 'create') return null;
    const recipient = ev?.recipient || ev?.to || _lastRecipient || '';
    const subject   = ev?.subject  || (recipient
      ? (lang === 'zh' ? `致 ${recipient}` : `To ${recipient}`)
      : (lang === 'zh' ? '新邮件' : 'New Mail'));
    return {
      card: buildCard(recipient, subject, lang),
    };
  },

  eagerCard(text, lang): ActionCard | null {
    const recipient = extractRecipient(text);
    if (!recipient) return null;
    const subject = extractSubject(text, recipient, lang);
    return buildCard(recipient, subject, lang);
  },

  resolveConfirmation(_pending, _lang) {
    return null;
  },

  // SSE 路径：尝试从模型输出中解析 JSON 标记，兜底用 _lastRecipient
  handleStreamResult(_intent, fullText): DomainActionResult | null {
    let recipient = _lastRecipient;
    let subject   = '';
    const jsonMatch = fullText.match(/\{\s*"recipient"\s*:[^}]{0,200}\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        recipient = parsed.recipient || recipient;
        subject   = parsed.subject   || '';
      } catch { /* ignore malformed */ }
    }
    if (!recipient && !subject) return null;
    return { card: buildCard(recipient, subject, 'zh') };
  },
};

function buildCard(recipient: string, subject: string, lang: 'zh' | 'en'): ActionCard {
  return {
    module: 'MAIL',
    action: 'create',
    title:  subject,
    meta:   [recipient || (lang === 'zh' ? '未指定' : 'Unknown'), lang === 'zh' ? '草稿' : 'Draft'],
  };
}
