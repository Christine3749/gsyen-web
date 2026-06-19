import { useEffect, useRef } from 'react';
import type { EntityType, ModuleColor } from './CanvasCardData';

export interface MenuPosition { x: number; y: number; flowX: number; flowY: number }

interface Props {
  pos: MenuPosition | null;
  onClose: () => void;
  onCreateText:      (flowPos: { x: number; y: number }) => void;
  onCreateEntity:    (flowPos: { x: number; y: number }, entityType: EntityType) => void;
  onCreateConnector: (flowPos: { x: number; y: number }) => void;
  onCreateBox:       (flowPos: { x: number; y: number }, moduleColor: ModuleColor) => void;
}

const ENTITY_ITEMS: { type: EntityType; label: string; icon: string }[] = [
  { type: 'contact',  label: '联系人', icon: 'M6 2.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM2 12c0-2.2 1.8-4 4-4s4 1.8 4 4' },
  { type: 'order',    label: '订单',   icon: 'M3 1.5h6a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1zm1.5 3h3M4.5 7h3M4.5 9.5h2' },
  { type: 'task',     label: '任务',   icon: 'M2 2h8a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1zm1.5 5l1.5 1.5 3-3' },
  { type: 'schedule', label: '日程',   icon: 'M1.5 3h9a1 1 0 011 1v7a1 1 0 01-1 1h-9a1 1 0 01-1-1V4a1 1 0 011-1zm0 3h9M4 1.5v2M8 1.5v2' },
  { type: 'file',     label: '文件',   icon: 'M3 1h5l3 3v8.5a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5V1.5A.5.5 0 013 1zm5 0v3h3' },
];

const BOX_ITEMS: { color: ModuleColor; label: string; dot: string }[] = [
  { color: 'purple', label: '设计',  dot: '#8B5CF6' },
  { color: 'blue',   label: '往来',  dot: '#3B82F6' },
  { color: 'green',  label: '联系',  dot: '#22C55E' },
  { color: 'amber',  label: '日程',  dot: '#F59E0B' },
  { color: 'red',    label: '订单',  dot: '#EF4444' },
  { color: 'teal',   label: '任务',  dot: '#14B8A6' },
];

const menuStyle: React.CSSProperties = {
  position: 'fixed', zIndex: 9999,
  background: '#FFFFFF', borderRadius: 10,
  boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
  border: '0.5px solid rgba(0,0,0,0.10)',
  padding: '5px',
  minWidth: 180,
  userSelect: 'none',
};

const itemBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '7px 10px', borderRadius: 6,
  fontSize: 12.5, color: '#1A1A1A', cursor: 'pointer',
};

const divider: React.CSSProperties = {
  height: '0.5px', background: 'rgba(0,0,0,0.08)', margin: '4px 0',
};

function Icon({ path }: { path: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
      <path d={path} />
    </svg>
  );
}

function Item({ label, icon, sub, onClick }: { label: string; icon?: React.ReactNode; sub?: string; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} style={itemBase}
      onMouseEnter={() => { if (ref.current) ref.current.style.background = 'rgba(0,0,0,0.05)'; }}
      onMouseLeave={() => { if (ref.current) ref.current.style.background = 'transparent'; }}
      onClick={onClick}>
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {sub && <span style={{ fontSize: 10.5, color: 'rgba(0,0,0,0.35)', fontFamily: 'ui-monospace,monospace' }}>{sub}</span>}
    </div>
  );
}

export function CanvasContextMenu({ pos, onClose, onCreateText, onCreateEntity, onCreateConnector, onCreateBox }: Props) {
  useEffect(() => {
    if (!pos) return;
    const close = () => onClose();
    window.addEventListener('mousedown', close, { capture: true });
    window.addEventListener('keydown', close);
    return () => { window.removeEventListener('mousedown', close, { capture: true }); window.removeEventListener('keydown', close); };
  }, [pos, onClose]);

  if (!pos) return null;

  const fp = { x: pos.flowX, y: pos.flowY };

  return (
    <div style={{ ...menuStyle, left: pos.x, top: pos.y }} onMouseDown={e => e.stopPropagation()}>

      {/* 文本卡 */}
      <Item label="文本卡" sub="双击编辑"
        icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.55 }}>
          <rect x="1" y="1" width="10" height="10" rx="1.5"/><path d="M3.5 4h5M3.5 6h5M3.5 8h3"/>
        </svg>}
        onClick={() => { onCreateText(fp); onClose(); }} />

      <div style={divider} />

      {/* 实体卡 */}
      {ENTITY_ITEMS.map(e => (
        <Item key={e.type} label={`实体卡 · ${e.label}`}
          icon={<Icon path={e.icon} />}
          onClick={() => { onCreateEntity(fp, e.type); onClose(); }} />
      ))}

      <div style={divider} />

      {/* 纽带卡 */}
      <Item label="纽带卡" sub="关系"
        icon={<svg width="12" height="12" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
          <path d="M1 5h12M9 2l3 3-3 3M5 8L2 5l3-3"/>
        </svg>}
        onClick={() => { onCreateConnector(fp); onClose(); }} />

      <div style={divider} />

      {/* 盒子 */}
      {BOX_ITEMS.map(b => (
        <Item key={b.color} label={`盒子 · ${b.label}`}
          icon={<span style={{ width: 8, height: 8, borderRadius: '50%', background: b.dot, display: 'inline-block', opacity: 0.8 }} />}
          onClick={() => { onCreateBox(fp, b.color); onClose(); }} />
      ))}
    </div>
  );
}
