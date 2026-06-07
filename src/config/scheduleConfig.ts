import { EventItem, ColumnId } from '../types/schedule';

// ─── Category display map ─────────────────────────────────────────────────────

export const categoryMap = {
  creative: {
    zhLabel: '创意设计', enLabel: 'Creative & Graphics',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    textAccent: 'text-emerald-700', dot: 'bg-emerald-500',
    accentBg: 'bg-emerald-500',
    pastelBg: 'bg-emerald-50/95 text-emerald-800 border-emerald-500/10',
    solidBg: 'bg-emerald-600 text-[#F9F8F6] border-emerald-700/20 font-bold',
    borderColor: 'border-l-emerald-500',
  },
  finance: {
    zhLabel: '资产流转', enLabel: 'Capital & Flows',
    color: 'bg-amber-50 text-amber-800 border-amber-200/80',
    textAccent: 'text-amber-700', dot: 'bg-amber-500',
    accentBg: 'bg-amber-500',
    pastelBg: 'bg-amber-50/95 text-amber-800 border-amber-500/10',
    solidBg: 'bg-amber-600 text-[#F9F8F6] border-amber-700/20 font-bold',
    borderColor: 'border-l-amber-500',
  },
  secure: {
    zhLabel: '保密机制', enLabel: 'Citadel Sec Ops',
    color: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
    textAccent: 'text-indigo-700', dot: 'bg-indigo-500',
    accentBg: 'bg-indigo-500',
    pastelBg: 'bg-indigo-50/95 text-indigo-800 border-indigo-500/10',
    solidBg: 'bg-indigo-600 text-[#F9F8F6] border-indigo-700/20 font-bold',
    borderColor: 'border-l-indigo-500',
  },
  strategy: {
    zhLabel: '路线决策', enLabel: 'Strategic Blueprints',
    color: 'bg-teal-50 text-teal-800 border-teal-200/80',
    textAccent: 'text-teal-700', dot: 'bg-teal-500',
    accentBg: 'bg-teal-500',
    pastelBg: 'bg-teal-50/95 text-teal-800 border-teal-500/10',
    solidBg: 'bg-teal-600 text-[#F9F8F6] border-teal-700/20 font-bold',
    borderColor: 'border-l-teal-500',
  },
} as const;

// ─── Kanban column definitions ────────────────────────────────────────────────

export const SCHEDULE_COLUMNS: {
  id: ColumnId; zhTitle: string; enTitle: string;
  colorClass: string; borderFocus: string;
}[] = [
  { id: 'todo',     zhTitle: '预约待编', enTitle: 'Backlog Tasks',
    colorClass: 'bg-[#F9F8F6]/40 border-zinc-200',
    borderFocus: 'border-[#1A1A1A] bg-zinc-200/40' },
  { id: 'progress', zhTitle: '执行中柜', enTitle: 'In Progress',
    colorClass: 'bg-[#F9F8F6]/20 border-[#1A1A1A]/5',
    borderFocus: 'border-amber-500 bg-amber-50/10' },
  { id: 'review',   zhTitle: '评审阶段', enTitle: 'Under Review',
    colorClass: 'bg-[#F9F8F6]/20 border-[#1A1A1A]/5',
    borderFocus: 'border-indigo-500 bg-indigo-50/10' },
  { id: 'done',     zhTitle: '极速已成', enTitle: 'Completed',
    colorClass: 'bg-emerald-50/10 border-emerald-200/30',
    borderFocus: 'border-emerald-500 bg-emerald-50/20' },
];

// ─── Default seed events ──────────────────────────────────────────────────────

export const DEFAULT_EVENTS: EventItem[] = [
  {
    id: '1', title: '雅致品牌推介会与设计评审',
    subtitle: '首席设计师审核矢量徽志第一阶段草图比例',
    time: '10:00', date: '2026-05-26', endDate: '2026-05-28',
    category: 'creative', location: 'Atelier Room III',
    completed: false, status: 'todo',
  },
  {
    id: '2', title: '中世纪美学季度财务审计',
    subtitle: '整理资产负债表与原浆纸浆采购耗料发票',
    time: '14:30', date: '2026-05-26', endDate: '2026-05-26',
    category: 'finance', location: 'Boardroom Annex',
    completed: false, status: 'progress',
  },
  {
    id: '3', title: '机密系统服务器 PGP 与 SSL 轮转',
    subtitle: '更新本地多端数据库独立高强度访问密钥对',
    time: '17:00', date: '2026-05-27', endDate: '2026-05-27',
    category: 'secure', location: 'Citadel Operations Vault',
    completed: true, status: 'done',
  },
  {
    id: '4', title: '品牌定位战略圆桌会议',
    subtitle: '制定下半年奢侈印刷工艺推广纲领',
    time: '09:00', date: '2026-05-24', endDate: '2026-05-25',
    category: 'strategy', location: 'Studio Loft A',
    completed: false, status: 'todo',
  },
  {
    id: '5', title: '设计方案交付与客户签收确认',
    subtitle: '提交全部高分辨率向量化资产及版权契约说明',
    time: '15:30', date: '2026-05-30', endDate: '2026-05-30',
    category: 'creative', location: 'Client Agency Office',
    completed: false, status: 'review',
  },
];
