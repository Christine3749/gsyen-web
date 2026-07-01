import { useState } from 'react';
import type { PointerEvent } from 'react';
import type { ContentType, CardData, StatusColor } from './CanvasCardData';
import { CT_STATUS, STATUS_COLORS } from './CanvasCardData';

const ACCENT = '#1F73D8';
const FONT = '"HarmonyOS Sans SC","HarmonyOS Sans","Inter","PingFang SC","Microsoft YaHei UI",system-ui,sans-serif';

export function CTIcon({ type: t, stroke: s }: { type: ContentType; stroke: string }) {
  const a = { fill:'none', stroke:s, strokeWidth:1.75, strokeLinecap:'round' as const, strokeLinejoin:'round' as const };
  const v = { width:17, height:17, viewBox:'0 0 16 16' };
  if (t==='note')  return <svg {...v} {...a}><path d="M3 5h10M3 8.5h7M3 12h8.5"/></svg>;
  if (t==='code')  return <svg {...v} {...a}><path d="M5 5.5L2.5 8 5 10.5M11 5.5l2.5 2.5L11 10.5M9.5 4.5l-3 7"/></svg>;
  if (t==='image') return <svg {...v} {...a}><rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="5.5" cy="6.5" r="1"/><path d="M2 11l3.5-2.5 3.5 3 2-1.5 3 2.5"/></svg>;
  if (t==='link')  return <svg {...v} {...a}><path d="M6.5 9.5a3 3 0 004.24 0l1.26-1.26a3 3 0 00-4.24-4.24L7 5.24"/><path d="M9.5 6.5a3 3 0 00-4.24 0L4 7.76a3 3 0 004.24 4.24L9 10.76"/></svg>;
  if (t==='task')  return <svg {...v} {...a}><rect x="2" y="2" width="5.5" height="5.5" rx="1"/><path d="M3 4.5l1.5 1.5 2.5-2.5"/><path d="M10 4h4.5M10 7.5h3.5M2 11h12M2 13.5h9"/></svg>;
  if (t==='table') return <svg {...v} {...a}><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 7.5h12M8 3v10"/></svg>;
  if (t==='math')  return <svg {...v} {...a}><path d="M11 3.5H5L9.5 8 5 12.5h6M5.5 8h5"/></svg>;
  return <svg {...v} {...a}><path d="M4 4v8"/><path d="M7 5.5h6M7 8h5.5M7 10.5h6"/></svg>;
}

export function StatusSection({ data, up }: {
  data: CardData; up: (p: Partial<CardData>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState('');
  const presets = CT_STATUS[data.contentType ?? 'note'];

  const pick = (label: string, color: StatusColor) =>
    up(data.status === label ? { status: '', statusColor: undefined } : { status: label, statusColor: color });

  const pressPick = (e: PointerEvent<HTMLButtonElement>, label: string, color: StatusColor) => {
    e.preventDefault();
    e.stopPropagation();
    pick(label, color);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {presets.map(p => {
        const active = data.status === p.label;
        const col = STATUS_COLORS[active ? (data.statusColor ?? p.color) : p.color];
        return (
          <button key={p.label} type="button" onPointerDown={e => pressPick(e, p.label, p.color)} onClick={e => e.stopPropagation()}
            style={{ height: 27, padding: '0 10px', borderRadius: 11, cursor: 'pointer', fontSize: 12.5,
              fontFamily: FONT, border: `1px solid ${active ? 'rgba(255,255,255,0.54)' : 'rgba(24,27,34,0.075)'}`,
              background: active ? col.bg : 'rgba(255,255,255,0.34)',
              color: active ? col.fg : 'rgba(24,27,34,0.52)', outline: 'none',
              boxShadow: active ? '0 1px 0 rgba(255,255,255,0.72) inset, 0 2px 7px rgba(20,24,32,0.055)' : '0 1px 0 rgba(255,255,255,0.38) inset',
              fontWeight: active ? 700 : 540 }}>
            {p.label}
          </button>
        );
      })}
      {!editing
        ? <button type="button" onPointerDown={e => { e.preventDefault(); e.stopPropagation(); setEditing(true); }} onClick={e => e.stopPropagation()}
            style={{ height: 27, padding: '0 10px', borderRadius: 11, cursor: 'pointer', fontSize: 12.5,
              fontFamily: FONT, color: 'rgba(24,27,34,0.42)', border: '1px solid rgba(24,27,34,0.075)',
              background: 'rgba(255,255,255,0.24)', outline: 'none', fontWeight: 530 }}>
            + 自定义
          </button>
        : <input autoFocus value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && custom.trim()) { up({ status: custom.trim(), statusColor: 'gray' }); setCustom(''); setEditing(false); }
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={() => { if (!custom.trim()) setEditing(false); }}
            placeholder="输入状态…"
            style={{ height: 27, padding: '0 9px', borderRadius: 11, fontSize: 12.5,
              fontFamily: FONT, outline: 'none', border: `1px solid ${ACCENT}`, width: 92,
              color: 'rgba(24,27,34,0.84)', background: 'rgba(255,255,255,0.72)' }}/>
      }
    </div>
  );
}

export function ActionRow({ label, shortcut, onClick, danger }: {
  label: string; shortcut?: string; onClick: () => void; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const press = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };
  return (
    <button type="button" onPointerDown={press} onClick={e => e.stopPropagation()}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', height: 36, padding: '0 11px',
        borderRadius: 12, cursor: 'pointer', gap: 10, border: 'none', outline: 'none', fontFamily: FONT,
        background: hov ? 'rgba(255,255,255,0.66)' : 'transparent',
        boxShadow: hov ? '0 1px 0 rgba(255,255,255,0.72) inset, 0 1px 8px rgba(20,24,32,0.055)' : 'none' }}>
      <span style={{ flex: 1, textAlign: 'left', fontSize: 15, lineHeight: 1, fontWeight: 540, color: danger ? '#B42332' : 'rgba(24,27,34,0.82)', letterSpacing: 0 }}>{label}</span>
      {shortcut && <span style={{ fontSize: 12.5, fontWeight: 520, color: danger ? 'rgba(180,35,50,0.46)' : 'rgba(24,27,34,0.34)' }}>{shortcut}</span>}
    </button>
  );
}
