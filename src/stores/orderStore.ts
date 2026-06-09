/**
 * orderStore — 订单数据层
 *
 * 核心规则（Ethan 2026-06-09）：
 *   有订单一定要记账 → add() 自动向 ledgerStore 写一笔 income 流水。
 *   记账不一定有订单 → ledgerStore 独立存在，不反向依赖 orderStore。
 */
import { cardRegistry } from './cardRegistry';
import { CardRecord } from '../types/card';
import { ledgerStore } from './ledgerStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'partial' | 'active' | 'expired';

export interface Order {
  id:          string;
  service:     string;        // 服务名，如「疆域」「三元楼」
  plan:        string;        // 套餐，如「月会员」「年会员」
  customer:    string;        // 客户名
  amount:      number;        // 总金额
  currency:    'CNY' | 'USD';
  paidAmount:  number;        // 已付金额
  status:      OrderStatus;
  startDate:   string;        // ISO date string
  expireDate?: string;
  notes?:      string;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gsyen_orders';
export const ORDER_EVENT = 'order-updated';

function readRaw(): Order[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function writeRaw(items: Order[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function broadcast(): void {
  window.dispatchEvent(new CustomEvent(ORDER_EVENT));
}

// ─── CardRegistry ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<OrderStatus, string> = {
  active:  '#4F77AC',  // Regatta 蓝（已生效）
  partial: '#7A6B4F',  // 暖棕（部分付款）
  pending: '#9B8C7A',  // 浅棕灰（待付款）
  expired: '#6B6258',  // 暗灰（已到期）
};

function toCardRecord(o: Order): CardRecord {
  const symbol = o.currency === 'USD' ? '$' : '¥';
  return {
    id:         `order-${o.id}`,
    module:     'ORDER',
    kind:       o.status,
    title:      o.customer,
    subtitle:   `${o.service} · ${o.plan}`,
    color:      STATUS_COLOR[o.status],
    timestamp:  o.startDate,
    status:     o.status,
    searchText: [o.service, o.plan, o.customer, o.notes, `${symbol}${o.amount}`].filter(Boolean).join(' '),
    payload:    o,
  };
}

let knownIds = new Set<string>();
function syncRegistry(items: Order[]): void {
  const nextIds = new Set(items.map(o => `order-${o.id}`));
  for (const item of items) cardRegistry.register(toCardRecord(item));
  for (const id of knownIds) if (!nextIds.has(id)) cardRegistry.unregister(id);
  knownIds = nextIds;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const orderStore = {
  getAll(): Order[] { return readRaw(); },

  add(order: Order): void {
    const updated = [order, ...readRaw()];
    writeRaw(updated);
    syncRegistry(updated);
    broadcast();
    // 有订单一定要记账——自动写入 LEDGER income 流水
    if (order.paidAmount > 0) {
      ledgerStore.add({
        id:          `order-ledger-${order.id}`,
        description: `${order.customer} · ${order.service}${order.plan}`,
        amount:      order.paidAmount,
        currency:    order.currency,
        type:        'income',
        category:    'consultancy',
        date:        order.startDate,
        notes:       `订单 #${order.id.slice(-6)}`,
        scope:       'shared',
      });
    }
  },

  update(id: string, changes: Partial<Omit<Order, 'id'>>): void {
    const prev = readRaw().find(o => o.id === id);
    const updated = readRaw().map(o => o.id === id ? { ...o, ...changes } : o);
    writeRaw(updated);
    syncRegistry(updated);
    broadcast();
    // 如果 paidAmount 增加了，补记一笔 LEDGER
    if (prev && changes.paidAmount !== undefined && changes.paidAmount > prev.paidAmount) {
      const delta = changes.paidAmount - prev.paidAmount;
      const order = updated.find(o => o.id === id)!;
      ledgerStore.add({
        id:          `order-ledger-${order.id}-${Date.now()}`,
        description: `${order.customer} · ${order.service}${order.plan}（补款）`,
        amount:      delta,
        currency:    order.currency,
        type:        'income',
        category:    'consultancy',
        date:        changes.startDate ?? order.startDate,
        notes:       `订单 #${id.slice(-6)}`,
        scope:       'shared',
      });
    }
  },

  remove(id: string): void {
    const updated = readRaw().filter(o => o.id !== id);
    writeRaw(updated);
    syncRegistry(updated);
    broadcast();
  },

  getRecent(n = 5): Order[] { return readRaw().slice(0, n); },
};

// 启动即对账——把已存在的订单收编进卡片集
syncRegistry(readRaw());
