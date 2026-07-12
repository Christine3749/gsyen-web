import { DomainHandler } from './types';

/** 神机百炼裁决：收集所有命中的 handler，应用主从规则，返回最终执行者。
 *
 *  三档逻辑：
 *  1. 唯一命中      → 直接执行
 *  2. 多命中有主从  → 主 handler 执行，被压制的静默（不出卡）
 *  3. 多命中无主从  → 返回 null（调用方负责向用户询问歧义）
 */
export function resolveHandler(
  text: string,
  handlers: DomainHandler[],
): { handler: DomainHandler; intent: string } | null {
  const matches: Array<{ handler: DomainHandler; intent: string }> = [];
  for (const h of handlers) {
    const intent = h.detectIntent(text);
    if (intent) matches.push({ handler: h, intent });
  }
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // 找出被压制的 module
  const dominated = new Set<string>();
  for (const { handler } of matches) {
    for (const m of handler.dominates ?? []) dominated.add(m);
  }
  const winners = matches.filter(m => !dominated.has(m.handler.module));
  if (winners.length === 1) return winners[0];

  // 真歧义：返回 null，交由上层询问用户
  return null;
}
