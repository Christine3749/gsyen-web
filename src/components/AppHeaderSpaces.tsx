import type { ComponentType } from 'react';
import { Mail, Sparkles } from 'lucide-react';
import { KanbanIcon } from '../gsyen-designer';

interface GsIconProps { className?: string; strokeWidth?: number }

export function KanbanOutlineIcon({ className, strokeWidth = 1.5 }: GsIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="7" height="18" rx="1.5" />
      <rect x="13" y="3" width="7" height="11" rx="1.5" />
    </svg>
  );
}

function ReportMoneyIcon({ className, strokeWidth = 1.5 }: GsIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
      <path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2" />
      <path d="M14 11h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5" />
      <path d="M12 17v1m0 -8v1" />
    </svg>
  );
}

function ShieldLockIcon({ className, strokeWidth = 1.5 }: GsIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
      <path d="M11 11a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M12 12l0 2.5" />
    </svg>
  );
}

function PrismIcon({ className, strokeWidth = 1.5 }: GsIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 5.45,20 18.55,20" />
    </svg>
  );
}

function CalendarDateIcon({ className, strokeWidth = 1.5 }: GsIconProps) {
  const day = new Date().getDate();
  return (
    <svg viewBox="0 0 24 24" className={className}
      style={{ fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <text x="12" y="20" textAnchor="middle" fontSize="9.5" fontWeight="700"
        fill="currentColor" stroke="none" style={{ fontFamily: 'system-ui,sans-serif', fontVariantNumeric: 'tabular-nums' }}>
        {day}
      </text>
    </svg>
  );
}

export type ActiveSpace = 'chat' | 'mail' | 'schedule' | 'calendar' | 'finance' | 'password' | 'brand';

export interface SpaceTab {
  value: ActiveSpace;
  Icon: ComponentType<any>;
  iconClass: string;
  zh: string;
  en: string;
  shortZh: string;
  shortEn: string;
  subtitle: string;
}

export const SPACES: SpaceTab[] = [
  { value: 'chat', Icon: Sparkles, iconClass: 'text-amber-500 animate-pulse', zh: '疆域灵阁', en: 'GSYEN Muse', shortZh: '灵阁', shortEn: 'Muse', subtitle: '' },
  { value: 'mail', Icon: Mail, iconClass: 'scale-90', zh: '工作邮件', en: 'Mailbox', shortZh: '邮件', shortEn: 'Mail', subtitle: 'Hermes · 极雅私密邮件信道' },
  { value: 'schedule', Icon: KanbanIcon, iconClass: 'animate-pulse scale-[1.3]', zh: '项目看板', en: 'Kanban', shortZh: '看板', shortEn: 'Kanban', subtitle: 'Flow · 信息流转看板工作系统' },
  { value: 'calendar', Icon: CalendarDateIcon, iconClass: 'scale-90', zh: '日程日历', en: 'Calendar', shortZh: '日历', shortEn: 'Cal', subtitle: 'Chronos · 极速格栅日程空间' },
  { value: 'finance', Icon: ReportMoneyIcon, iconClass: '', zh: '复试账簿', en: 'Atelier Ledger', shortZh: '账簿', shortEn: 'Ledger', subtitle: 'Atelier Ledger · 奢雅资产复式记账账簿' },
  { value: 'password', Icon: ShieldLockIcon, iconClass: '', zh: '军工密钥', en: 'Citadel Key', shortZh: '密钥', shortEn: 'Keys', subtitle: 'Citadel · 军事级密匙生成与保管箱' },
  { value: 'brand', Icon: PrismIcon, iconClass: '', zh: 'PRISM实验', en: 'Brand Lab', shortZh: '品牌', shortEn: 'Brand', subtitle: 'Prism · 品牌基因折射实验室' },
];
