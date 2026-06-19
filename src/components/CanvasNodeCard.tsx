import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import type { CardData } from './CanvasCardData';
import { CanvasEntityCard } from './CanvasEntityCard';
import { CanvasConnectorCard } from './CanvasConnectorCard';

export type { CardData } from './CanvasCardData';

const BAR: Record<string, string> = {
  '1': '#F87171', '2': '#FB923C', '3': '#FBBF24',
  '4': '#4ADE80', '5': '#2DD4BF', '6': '#A78BFA',
};

const COLOR_NAMES: Record<string, string> = {
  '1': '红', '2': '橙', '3': '黄', '4': '绿', '5': '青', '6': '紫',
};

const SIDES = [
  { pos: Position.Top,    id: 't' }, { pos: Position.Right,  id: 'r' },
  { pos: Position.Bottom, id: 'b' }, { pos: Position.Left,   id: 'l' },
];

const iconBtn: React.CSSProperties = {
  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
  color: 'rgba(0,0,0,0.28)', transition: 'color 0.12s',
};

function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((p, i) => {
    if (p.startsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('*'))  return <em key={i}>{p.slice(1, -1)}</em>;
    return p;
  });
}

function MD({ text }: { text: string }) {
  if (!text) return <span style={{ color: 'rgba(0,0,0,0.28)', fontStyle: 'italic' }}>双击编辑…</span>;
  return (
    <>
      {text.split('\n').map((line, i) => {
        if (line.startsWith('# '))
          return <div key={i} style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 4, color: '#1A1A1A' }}>{inline(line.slice(2))}</div>;
        if (line.startsWith('## '))
          return <div key={i} style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, marginBottom: 3, color: '#1A1A1A' }}>{inline(line.slice(3))}</div>;
        if (line.startsWith('### '))
          return <div key={i} style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, marginBottom: 2, color: '#1A1A1A' }}>{inline(line.slice(4))}</div>;
        if (line === '')
          return <div key={i} style={{ height: 6 }} />;
        return <div key={i} style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(0,0,0,0.72)' }}>{inline(line)}</div>;
      })}
    </>
  );
}

function TextCard({ id, data: d, selected }: { id: string; data: CardData; selected: boolean }) {
  const { updateNodeData, deleteElements, fitView } = useReactFlow();
  const [editing, setEditing] = useState(d.defaultEditing ?? false);
  const [draft,   setDraft]   = useState(d.text);
  const [hovered, setHovered] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) taRef.current?.focus(); }, [editing]);
  useEffect(() => { if (editing) setDraft(d.text); }, [editing, d.text]);

  const commit = () => {
    setEditing(false);
    if (draft !== d.text) updateNodeData(id, { text: draft, defaultEditing: false });
  };

  const barColor  = BAR[d.color ?? ''];
  const showMenu  = (hovered || selected) && !editing;

  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Handles — outside overflow:hidden */}
      {SIDES.map(({ pos, id: hid }) => (
        <Handle key={hid} id={`src-${hid}`} type="source" position={pos}
          style={{ opacity: 0, width: 8, height: 8, background: '#A78BFA', border: '1.5px solid #fff', transition: 'opacity 0.12s' }} />
      ))}
      {SIDES.map(({ pos, id: hid }) => (
        <Handle key={`t-${hid}`} id={`tgt-${hid}`} type="target" position={pos}
          style={{ opacity: 0, width: 14, height: 14 }} />
      ))}

      {/* Hover overlay: bottom-left, outside the card */}
      {showMenu && (
        <div className="nodrag nopan" style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'rgba(255,255,255,0.96)', borderRadius: 8, padding: '3px 6px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.10)', border: '0.5px solid rgba(0,0,0,0.07)',
        }}>
          <button title="Delete" onClick={() => deleteElements({ nodes: [{ id }] })}
            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.28)')}
            style={iconBtn}>
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M2 3h9M4.5 3V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5 5.5v4M8 5.5v4M2.5 3l.65 7.5a.5.5 0 00.5.5h5.7a.5.5 0 00.5-.5L10.5 3"/>
            </svg>
          </button>
          <button title="Focus" onClick={() => fitView({ nodes: [{ id }], duration: 350, padding: 0.35 })}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.65)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.28)')}
            style={iconBtn}>
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M1.5 4.5V2h2.5M8.5 2H11v2.5M11 8.5V11H8.5M4 11H1.5V8.5"/>
            </svg>
          </button>
          <button title="Edit" onClick={() => setEditing(true)}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.65)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.28)')}
            style={iconBtn}>
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2l2 2-6.5 6.5H2.5v-2L9 2z"/>
            </svg>
          </button>
          <div style={{ width: '0.5px', height: 10, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />
          {/* clear */}
          <button onClick={() => updateNodeData(id, { color: '' })}
            style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.22)',
              background: 'transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
          {Object.entries(BAR).map(([k, c]) => (
            <button key={k} onClick={() => updateNodeData(id, { color: k })}
              style={{ width: 11, height: 11, borderRadius: '50%', border: 'none', background: c,
                cursor: 'pointer', padding: 0, flexShrink: 0,
                outline: d.color === k ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
          ))}
        </div>
      )}

      {/* Card — no border, shadow only, large radius */}
      <div onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
        style={{
          background: '#FFFFFF', color: '#1A1A1A',
          borderRadius: 14, minWidth: 220, maxWidth: 360,
          boxShadow: hovered || selected
            ? '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)'
            : '0 2px 12px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.07)',
          overflow: 'hidden', transition: 'box-shadow 0.2s',
        }}>

        <div style={{ padding: '14px 16px', minHeight: 64 }}>
          {editing ? (
            <textarea ref={taRef} value={draft} className="nodrag nopan"
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Escape') commit(); }}
              style={{ width: '100%', minHeight: 56, background: 'transparent', border: 'none',
                outline: 'none', resize: 'none', color: '#1A1A1A', fontFamily: 'inherit',
                fontSize: 13, lineHeight: 1.65 }} />
          ) : (
            <div style={{ pointerEvents: 'none' }}><MD text={d.text} /></div>
          )}
        </div>

        {/* Color tag pill — only when a color is active */}
        {barColor && (
          <div style={{ padding: '0 16px 12px' }}>
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: 99,
              background: `${barColor}28`, color: barColor,
              fontSize: 11, fontWeight: 500,
            }}>{COLOR_NAMES[d.color!]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export const CanvasNodeCard = memo(({ id, data, selected }: NodeProps) => {
  const d = data as CardData;
  if (d.cardType === 'entity')    return <CanvasEntityCard id={id} data={d} selected={selected ?? false} />;
  if (d.cardType === 'connector') return <CanvasConnectorCard id={id} data={d} selected={selected ?? false} />;
  return <TextCard id={id} data={d} selected={selected ?? false} />;
});

CanvasNodeCard.displayName = 'CanvasNodeCard';
