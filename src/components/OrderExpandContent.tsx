/**
 * OrderExpandContent — ORDER 卡片 L2 展开面板
 *
 * 订单只有 L1 / L2，不需要 L3。
 * 订单必然涉及客户，始终使用 shared（Regatta 蓝）配色。
 */
import { useState, useEffect } from 'react';
import { Trash2, CheckCircle2, Clock, CircleDashed, XCircle } from 'lucide-react';
import { CardColor } from './cardConstants';
import { orderStore, Order, OrderStatus } from '../stores/orderStore';

interface Props {
  lang:       'zh' | 'en';
  color:      CardColor;
  orderId:    string | undefined;
  expanded:   boolean;
  onCollapse: () => void;
}

const STATUS_CONFIG: Record<OrderStatus, { zh: string; en: string; icon: typeof Clock }> = {
  pending:  { zh: '待付款',   en: 'Pending',  icon: CircleDashed },
  partial:  { zh: '部分付款', en: 'Partial',  icon: Clock },
  active:   { zh: '已生效',   en: 'Active',   icon: CheckCircle2 },
  expired:  { zh: '已到期',   en: 'Expired',  icon: XCircle },
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'partial', 'active', 'expired'];

export function OrderExpandContent({ lang, color: C, orderId, expanded, onCollapse }: Props) {
  const zh = lang === 'zh';
  const [order, setOrder] = useState<Order | null>(() =>
    orderId ? (orderStore.getAll().find(o => o.id === orderId) ?? null) : null
  );
  const [editing, setEditing] = useState(false);
  const [ePaid,   setEPaid]   = useState('');

  useEffect(() => {
    const sync = () => {
      if (orderId) setOrder(orderStore.getAll().find(o => o.id === orderId) ?? null);
    };
    window.addEventListener('order-updated', sync);
    return () => window.removeEventListener('order-updated', sync);
  }, [orderId]);

  useEffect(() => {
    if (!expanded) { setEditing(false); }
  }, [expanded]);

  if (!expanded || !order) return null;

  const symbol   = order.currency === 'USD' ? '$' : '¥';
  const balance  = order.amount - order.paidAmount;
  const StatusIcon = STATUS_CONFIG[order.status].icon;

  const handleStatusChange = (s: OrderStatus) => {
    orderStore.update(order.id, { status: s });
  };

  const handleSavePaid = () => {
    const val = parseFloat(ePaid);
    if (!isNaN(val) && val >= 0) {
      orderStore.update(order.id, {
        paidAmount: val,
        status: val >= order.amount ? 'active' : val > 0 ? 'partial' : order.status,
      });
    }
    setEditing(false);
  };

  const handleDelete = () => {
    orderStore.remove(order.id);
    onCollapse();
  };

  return (
    <div className="overflow-hidden">
      <div className={`border-t ${C.panelBorder} px-4 pt-3.5 pb-4 space-y-3.5`}>

        {/* 状态切换 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = order.status === s;
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] font-mono text-[9px] tracking-wide transition-all duration-150 ${
                  active ? C.btnPrimary : C.btnGhost
                }`}
              >
                <cfg.icon className="w-2.5 h-2.5" />
                {zh ? cfg.zh : cfg.en}
              </button>
            );
          })}
        </div>

        {/* 订单字段 */}
        <div className="space-y-1.5">
          {[
            { label: zh ? '服务' : 'Service', value: order.service },
            { label: zh ? '套餐' : 'Plan',    value: order.plan },
            { label: zh ? '客户' : 'Customer', value: order.customer },
            { label: zh ? '开始' : 'Start',   value: order.startDate },
            ...(order.expireDate ? [{ label: zh ? '到期' : 'Expire', value: order.expireDate }] : []),
            ...(order.notes ? [{ label: zh ? '备注' : 'Notes', value: order.notes }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={`font-mono text-[8px] tracking-[0.15em] uppercase w-14 shrink-0 ${C.panelLabel}`}>{label}</span>
              <span className={`font-sans text-[11px] ${C.panelText}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* 金额区 */}
        <div className={`rounded-[3px] border ${C.panelBorder} px-3 py-2.5 space-y-1.5`}>
          <div className="flex justify-between items-center">
            <span className={`font-mono text-[8px] tracking-widest uppercase ${C.panelLabel}`}>{zh ? '总额' : 'Total'}</span>
            <span className={`font-mono text-[12px] font-bold ${C.panelText}`}>{symbol}{order.amount || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`font-mono text-[8px] tracking-widest uppercase ${C.panelLabel}`}>{zh ? '已付' : 'Paid'}</span>
            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  type="number"
                  value={ePaid}
                  onChange={e => setEPaid(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSavePaid(); if (e.key === 'Escape') setEditing(false); }}
                  className={`w-20 px-1.5 py-0.5 rounded-[2px] border text-[10px] font-mono ${C.panelInput} outline-none`}
                  placeholder={String(order.paidAmount)}
                />
                <button onClick={handleSavePaid} className={`px-2 py-0.5 rounded-[2px] text-[9px] font-mono ${C.btnPrimary}`}>
                  {zh ? '确认' : 'OK'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEPaid(String(order.paidAmount)); setEditing(true); }}
                className={`font-mono text-[12px] font-bold ${C.panelText} hover:opacity-70 transition`}
              >
                {symbol}{order.paidAmount}
              </button>
            )}
          </div>
          {order.amount > 0 && (
            <div className="flex justify-between items-center">
              <span className={`font-mono text-[8px] tracking-widest uppercase ${C.panelLabel}`}>{zh ? '待收' : 'Balance'}</span>
              <span className={`font-mono text-[12px] font-bold ${balance > 0 ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>
                {symbol}{Math.max(0, balance)}
              </span>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end pt-0.5">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-[9px] font-mono tracking-wide ${C.btnDanger}`}
          >
            <Trash2 className="w-2.5 h-2.5" />
            {zh ? '删除订单' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
