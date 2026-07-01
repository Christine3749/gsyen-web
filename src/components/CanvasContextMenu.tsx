import { useEffect, useRef } from 'react';
import type { CardSize } from './CanvasCardData';

export interface MenuPosition { x: number; y: number; flowX: number; flowY: number }

interface Props {
  pos: MenuPosition | null;
  onClose: () => void;
  onCreateA: (flowPos: { x: number; y: number }, size: CardSize) => void;
  onCreateB: (flowPos: { x: number; y: number }, size: CardSize) => void;
  onCreateCollection: (flowPos: { x: number; y: number }) => void;
}

const menuStyle: React.CSSProperties = {
  position: 'fixed', zIndex: 9999,
  background: '#FFFFFF', borderRadius: 10,
  boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
  border: '0.5px solid rgba(0,0,0,0.10)',
  padding: '5px',
  minWidth: 164,
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

function Item({ label, sub, icon, onClick }: { label: string; sub?: string; icon?: React.ReactNode; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} style={itemBase}
      onMouseEnter={() => { if (ref.current) ref.current.style.background = 'rgba(0,0,0,0.05)'; }}
      onMouseLeave={() => { if (ref.current) ref.current.style.background = 'transparent'; }}
      onClick={onClick}>
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {sub && <span style={{ fontSize: 10.5, color: 'rgba(0,0,0,0.30)', fontFamily: 'ui-monospace,monospace' }}>{sub}</span>}
    </div>
  );
}

const IconA = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.55 }}>
    <rect x="1" y="1" width="10" height="10" rx="1.5"/>
    <path d="M1 4.5h10M1 7.5h10"/>
  </svg>
);

const IconB = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
    <rect x="1" y="1" width="10" height="10" rx="1.5" strokeDasharray="2.5 1.5"/>
    <path d="M1 4.5h10M1 7.5h10" strokeDasharray="2.5 1.5"/>
  </svg>
);

const IconC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
    <path d="M1.5 4V3.2c0-.66.54-1.2 1.2-1.2h2.1L5.9 3h3.4c.66 0 1.2.54 1.2 1.2V5"/>
    <rect x="1.5" y="4.5" width="9" height="5.5" rx="1"/>
  </svg>
);

const SIZES: { size: CardSize; label: string }[] = [
  { size: 'S', label: 'S' },
  { size: 'M', label: 'M' },
  { size: 'L', label: 'L' },
];

export function CanvasContextMenu({ pos, onClose, onCreateA, onCreateB, onCreateCollection }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener('mousedown', close, { capture: true });
    window.addEventListener('keydown', onClose);
    return () => {
      window.removeEventListener('mousedown', close, { capture: true });
      window.removeEventListener('keydown', onClose);
    };
  }, [pos, onClose]);

  if (!pos) return null;

  const fp = { x: pos.flowX, y: pos.flowY };

  return (
    <div ref={menuRef} style={{ ...menuStyle, left: pos.x, top: pos.y }}>

      {SIZES.map(({ size, label }) => (
        <Item key={`a-${size}`}
          label={`A 实线 · ${label}`}
          icon={<IconA />}
          onClick={() => { onCreateA(fp, size); onClose(); }} />
      ))}

      <div style={divider} />

      {SIZES.map(({ size, label }) => (
        <Item key={`b-${size}`}
          label={`B 虚线 · ${label}`}
          icon={<IconB />}
          onClick={() => { onCreateB(fp, size); onClose(); }} />
      ))}

      <div style={divider} />

      <Item
        label="集合"
        sub="Box"
        icon={<IconC />}
        onClick={() => { onCreateCollection(fp); onClose(); }} />

    </div>
  );
}
