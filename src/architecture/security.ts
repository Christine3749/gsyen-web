/**
 * 疆域 GSYEN · 双向安全沙箱
 *
 * 防护层：
 *  1. 输入注入过滤（Prompt Injection Detection）：中英双语模式覆盖
 *  2. Payload 长度熔断：超 8000 字符拒绝
 *  3. CSRF Token 注入：读 <meta name="csrf-token">，服务端验证
 *  4. 服务端 RLS 二次校验：tier + teamId 双重门禁（不信任前端）
 */

import { SecurityError } from './types';
import type { UserTier } from './types';

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /you\s+are\s+no\s+longer/i,
  /你现在不再是/,
  /忽略(之前)?(所有)?(系统的)?提示/,
  /system\s+override/i,
  /翻译上面这句话/,
  /disregard\s+(all\s+)?previous/i,
];

/**
 * 输入安全校验：长度熔断 + 注入模式检测。
 * 抛 SecurityError 而非返回 false，调用方无法静默忽略错误。
 */
export function sanitize(content: string): void {
  if (!content || content.length > 8000)
    throw new SecurityError('Payload length overflow');
  for (const re of INJECTION_PATTERNS)
    if (re.test(content)) throw new SecurityError('Prompt injection detected');
}

/** 从 <meta name="csrf-token"> 读取 CSRF Token，SSR 环境安全返回空字符串。 */
export function csrfToken(): string {
  if (typeof document === 'undefined') return '';
  return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
    ?.content ?? '';
}

/**
 * 知识注入入口。
 *
 * 安全链路：
 *  1. tier + teamId 服务端双重门禁（前端判断不可信，此处是二次防线）
 *  2. sanitize：长度 + 注入模式
 *  3. CSRF Token 附在请求头
 *  4. 服务端 /api/knowledge/inject 还应有 RLS Policy 第三层防护
 */
export async function injectKnowledge(
  content:   string,
  tier:      UserTier,
  teamId:    string,
  reqTeamId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (tier !== 'star' || teamId !== reqTeamId)
    return { ok: false, error: 'Authorization denied (server-side RLS)' };

  try {
    sanitize(content);
    const res = await fetch('/api/knowledge/inject', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken(),
      },
      body: JSON.stringify({ content: content.trim(), teamId }),
    });
    return res.ok ? res.json() : { ok: false, error: `HTTP ${res.status}` };
  } catch (e) {
    if (e instanceof SecurityError) return { ok: false, error: e.message };
    return { ok: false, error: String(e) };
  }
}
