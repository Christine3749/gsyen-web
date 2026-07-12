import { describe, it, expect } from 'vitest';
import { resolveHandler } from './resolveHandler';
import { DomainHandler } from './types';

function makeHandler(module: string, intent: string | null, dominates?: string[]): DomainHandler {
  return {
    module,
    detectIntent: () => intent,
    enrichMessage: (t) => t,
    buildContext: () => undefined,
    handleAction: () => null,
    resolveConfirmation: () => null,
    handleStreamResult: () => null,
    dominates,
  };
}

describe('resolveHandler（神机百炼裁决）', () => {
  it('无命中 → null', () => {
    expect(resolveHandler('你好', [makeHandler('CHRONOS', null)])).toBeNull();
  });

  it('唯一命中 → 直接执行', () => {
    const chronos = makeHandler('CHRONOS', 'create');
    const result = resolveHandler('明天开会', [makeHandler('LEDGER', null), chronos]);
    expect(result?.handler.module).toBe('CHRONOS');
    expect(result?.intent).toBe('create');
  });

  it('多命中有主从 → 主 handler 胜出，被压制者静默', () => {
    const order  = makeHandler('ORDER', 'create', ['LEDGER']);
    const ledger = makeHandler('LEDGER', 'create');
    const result = resolveHandler('客户下单 500 元', [ledger, order]);
    expect(result?.handler.module).toBe('ORDER');
  });

  it('多命中无主从（真歧义）→ null，交由上层询问', () => {
    const mail  = makeHandler('MAIL', 'create');
    const vault = makeHandler('VAULT', 'create');
    expect(resolveHandler('帮我保存一下', [mail, vault])).toBeNull();
  });

  it('互相压制导致无胜者 → null', () => {
    const a = makeHandler('A', 'x', ['B']);
    const b = makeHandler('B', 'y', ['A']);
    expect(resolveHandler('text', [a, b])).toBeNull();
  });
});
