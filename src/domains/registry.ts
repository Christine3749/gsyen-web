import { DomainHandler } from './types';
import { chronosHandler } from './chronosHandler';
import { ledgerHandler } from './ledgerHandler';
import { paymentHandler } from './paymentHandler';
import { mailHandler } from './mailHandler';
import { vaultHandler } from './vaultHandler';
import { orderHandler } from './orderHandler';

/**
 * All domain handlers known to the chat router.
 * Order matters: first handler whose detectIntent matches wins.
 */
export const domainHandlers: DomainHandler[] = [
  orderHandler,    // 订单：买/购买/开通 + 会员/套餐，优先于 ledger 的宽泛金额匹配
  mailHandler,     // 先判，避免"给xxx写邮件"被 chronos 误抢
  vaultHandler,    // 密钥存储，关键词独立无歧义
  chronosHandler,
  paymentHandler,  // 比 ledgerHandler 更具体（"收款码/扫码收款"等）
  ledgerHandler,
];
