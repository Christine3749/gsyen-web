/**
 * BrandOrders — 品牌实验室「订单」tab
 * 监听 order-updated 事件，展示所有订单卡片（active/partial/pending/expired）。
 */
import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { orderStore, Order, OrderStatus } from '../../stores/orderStore';

interface Props { lang: 'zh' | 'en' }

const STATUS_LABEL: Record<OrderStatus, { zh: string; en: string; color: string }> = {
  active:  { zh: '已生效',   en: 'Active',   color: 'text-[#4F77AC] bg-[#4F77AC]/10' },
  partial: { zh: '部分付款', en: 'Partial',  color: 'text-amber-600 bg-amber-50' },
  pending: { zh: '待付款',   en: 'Pending',  color: 'text-[#9B8C7A] bg-[#9B8C7A]/10' },
  expired: { zh: '已到期',   en: 'Expired',  color: 'text-[#6B6258] bg-[#6B6258]/10' },
};

const FILTERS: { key: OrderStatus | 'all'; zh: string; en: string }[] = [
  { key: 'all',     zh: '全部',   en: 'All' },
  { key: 'active',  zh: '已生效', en: 'Active' },
  { key: 'partial', zh: '部分',   en: 'Partial' },
  { key: 'pending', zh: '待付款', en: 'Pending' },
  { key: 'expired', zh: '已到期', en: 'Expired' },
];

function OrderRow({ order, lang }: { order: Order; lang: 'zh' | 'en' }) {
  const zh = lang === 'zh';
  const cfg = STATUS_LABEL[order.status];
  const symbol = order.currency === 'USD' ? '$' : '¥';
  const balance = order.amount - order.paidAmount;

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-[#1A1A1A]/[0.05] hover:bg-[#1A1A1A]/[0.02] transition-colors">
      <div className="w-[90px] shrink-0">
        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-[2px] tracking-wide ${cfg.color}`}>
          {zh ? cfg.zh : cfg.en}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[12px] font-semibold text-[#1A1A1A]/80 truncate">{order.customer}</p>
        <p className="font-mono text-[9px] text-[#1A1A1A]/40 truncate">{order.service} · {order.plan}</p>
      </div>
      <div className="text-right shrink-0 w-[80px]">
        <p className="font-mono text-[11px] font-bold text-[#1A1A1A]/70">{symbol}{order.amount || '—'}</p>
        {balance > 0 && order.amount > 0 && (
          <p className="font-mono text-[9px] text-amber-600/70">{zh ? '待收' : 'Due'} {symbol}{balance}</p>
        )}
      </div>
      <div className="text-right shrink-0 w-[70px]">
        <p className="font-mono text-[9px] text-[#1A1A1A]/35">{order.startDate}</p>
        {order.expireDate && (
          <p className="font-mono text-[9px] text-[#1A1A1A]/25">{order.expireDate}</p>
        )}
      </div>
    </div>
  );
}

export default function BrandOrders({ lang }: Props) {
  const zh = lang === 'zh';
  const [orders, setOrders] = useState<Order[]>(() => orderStore.getAll());
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    const sync = () => setOrders(orderStore.getAll());
    window.addEventListener('order-updated', sync);
    return () => window.removeEventListener('order-updated', sync);
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const totalPaid = orders.filter(o => o.status === 'active').reduce((s, o) => s + o.paidAmount, 0);
  const totalPending = orders.filter(o => o.status !== 'expired').reduce((s, o) => s + (o.amount - o.paidAmount), 0);

  if (orders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Package className="w-8 h-8 text-[#1A1A1A]/20" strokeWidth={1.2} />
        <p className="text-xs font-mono tracking-widest uppercase text-[#1A1A1A]/40">
          {zh ? '暂无订单' : 'No orders yet'}
        </p>
        <p className="text-[11px] font-serif italic text-[#1A1A1A]/30 max-w-xs">
          {zh ? '在 Chat 里说「帮我开一个月的疆域会员」试试' : 'Try saying "open a monthly plan" in Chat'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 汇总 */}
      <div className="flex items-center gap-6 px-4 py-3 border-b border-[#1A1A1A]/[0.06]">
        <div>
          <p className="font-mono text-[8px] tracking-widest uppercase text-[#1A1A1A]/35">{zh ? '已收' : 'Collected'}</p>
          <p className="font-mono text-[14px] font-bold text-[#4F77AC]">¥{totalPaid}</p>
        </div>
        <div>
          <p className="font-mono text-[8px] tracking-widest uppercase text-[#1A1A1A]/35">{zh ? '待收' : 'Pending'}</p>
          <p className="font-mono text-[14px] font-bold text-amber-600/80">¥{Math.max(0, totalPending)}</p>
        </div>
        <div className="ml-auto">
          <p className="font-mono text-[8px] tracking-widest uppercase text-[#1A1A1A]/35">{zh ? '订单数' : 'Orders'}</p>
          <p className="font-mono text-[14px] font-bold text-[#1A1A1A]/60">{orders.length}</p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#1A1A1A]/[0.05]">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-2 py-0.5 rounded-[2px] font-mono text-[9px] tracking-wide transition-all ${
              filter === f.key
                ? 'bg-[#1A1A1A] text-[#F4F2EE]'
                : 'bg-[#1A1A1A]/[0.05] text-[#1A1A1A]/50 hover:bg-[#1A1A1A]/[0.09]'
            }`}
          >
            {zh ? f.zh : f.en}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="font-mono text-[10px] text-[#1A1A1A]/30 tracking-widest uppercase">
              {zh ? '该分类暂无订单' : 'No orders in this category'}
            </p>
          </div>
        ) : (
          filtered.map(order => <OrderRow key={order.id} order={order} lang={lang} />)
        )}
      </div>
    </div>
  );
}
