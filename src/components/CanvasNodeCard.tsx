import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';

export interface CardData extends Record<string, unknown> {
  text:            string;
  color?:          string;
  defaultEditing?: boolean;
}

const PALETTE: Record<string, { bg: string; dot: string }> = {
  '1': { bg: '#FFF0F2', dot: '#F87171' },
  '2': { bg: '#FFF7ED', dot: '#FB923C' },
  '3': { bg: '#FEFCE8', dot: '#FBBF24' },
  '4': { bg: '#F0FDF4', dot: '#4ADE80' },
  '5': { bg: '#F0FDFA', dot: '#2DD4BF' },
  '6': { bg: '#FAF5FF', dot: '#A78BFA' },
};

const SIDES = [
  { pos: Position.Top, id: 't' }, { pos: Position.Right, id: 'r' },
  { pos: Position.Bottom, id: 'b' }, { pos: Position.Left, id: 'l' },
];

const tbBtn: React.CSSProperties = {
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
};

export const CanvasNodeCard = memo(({ id, data, selected }: NodeProps) => {
  const { updateNodeData, deleteElements, fitView } = useReactFlow();
  const d = data as CardData;
  const [editing,    setEditing]    = useState(d.defaultEditing ?? false);
  const [draft,      setDraft]      = useState(d.text);
  const [showColors, setShowColors] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) taRef.current?.focus(); }, [editing]);
  useEffect(() => { if (editing) setDraft(d.text); }, [editing, d.text]);
  useEffect(() => { if (!selected) setShowColors(false); }, [selected]);

  const commit = () => {
    setEditing(false);
    if (draft !== d.text) updateNodeData(id, { text: draft, defaultEditing: false });
  };

  const pal    = PALETTE[d.color ?? ''];
  const cardBg = pal?.bg ?? 'var(--cn-bg)';

  const sep: React.CSSProperties = { width: '0.5px', background: 'rgba(0,0,0,0.1)', margin: '3px 2px' };

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Selection toolbar ── */}
      {selected && !editing && (
        <div className="nodrag nopan" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 2,
          background: 'var(--cn-bg)', borderRadius: 8, padding: '3px 5px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
          border: '0.5px solid var(--cn-border)', zIndex: 10, whiteSpace: 'nowrap',
        }}>

          {/* Delete */}
          <button style={tbBtn} title="Delete"
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,0.08)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
            onClick={() => deleteElements({ nodes: [{ id }] })}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--cn-dim)" strokeWidth="1.4" strokeLinecap="round">
              <path d="M2 3h9M4.5 3V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5 5.5v4M8 5.5v4M2.5 3l.65 7.5a.5.5 0 00.5.5h5.7a.5.5 0 00.5-.5L10.5 3"/>
            </svg>
          </button>

          <div style={sep} />

          {/* Color */}
          <div style={{ position: 'relative' }}>
            <button style={tbBtn} title="Color"
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(0,0,0,0.05)')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
              onClick={() => setShowColors(v => !v)}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--cn-dim)" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="6.5" cy="6.5" r="5"/>
                <circle cx="4" cy="6.5" r="1.1" fill="#F87171" stroke="none"/>
                <circle cx="6.5" cy="4"  r="1.1" fill="#FBBF24" stroke="none"/>
                <circle cx="9"  cy="6.5" r="1.1" fill="#4ADE80" stroke="none"/>
                <circle cx="6.5" cy="9"  r="1.1" fill="#A78BFA" stroke="none"/>
              </svg>
            </button>
            {showColors && (
              <div className="nodrag nopan" style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
                transform: 'translateX(-50%)', display: 'flex', gap: 5, padding: '6px 8px',
                background: 'var(--cn-bg)', borderRadius: 8, zIndex: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)', border: '0.5px solid var(--cn-border)',
              }}>
                <button onClick={() => { updateNodeData(id, { color: '' }); setShowColors(false); }}
                  style={{ width: 15, height: 15, borderRadius: '50%', border: '1.5px solid var(--cn-dim)', background: 'var(--cn-bg)', cursor: 'pointer', padding: 0 }} />
                {Object.entries(PALETTE).map(([k, p]) => (
                  <button key={k} onClick={() => { updateNodeData(id, { color: k }); setShowColors(false); }}
                    style={{ width: 15, height: 15, borderRadius: '50%', border: 'none', background: p.dot, cursor: 'pointer', padding: 0,
                      outline: d.color === k ? `2px solid ${p.dot}` : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            )}
          </div>

          <div style={sep} />

          {/* Fit to node */}
          <button style={tbBtn} title="Focus"
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(0,0,0,0.05)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
            onClick={() => fitView({ nodes: [{ id }], duration: 350, padding: 0.35 })}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--cn-dim)" strokeWidth="1.4" strokeLinecap="round">
              <path d="M1.5 4.5V2h2.5M8.5 2H11v2.5M11 8.5V11H8.5M4 11H1.5V8.5"/>
            </svg>
          </button>

          {/* Edit */}
          <button style={tbBtn} title="Edit"
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(0,0,0,0.05)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
            onClick={() => setEditing(true)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--cn-dim)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2l2 2-6.5 6.5H2.5v-2L9 2z"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Card body ── */}
      <div onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
        style={{
          background: cardBg, color: 'var(--cn-fg)',
          border: selected ? '1.5px solid #4A9EFF' : '1px solid rgba(0,0,0,0.07)',
          borderRadius: 12, padding: '14px 18px',
          minWidth: 220, minHeight: 80, maxWidth: 380,
          boxShadow: selected
            ? '0 0 0 3px rgba(74,158,255,0.15), 0 8px 24px rgba(0,0,0,0.1)'
            : '0 2px 8px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)',
          cursor: editing ? 'text' : 'default',
          fontSize: 14, lineHeight: 1.75, fontFamily: 'inherit',
          position: 'relative',
          transition: 'box-shadow 0.15s, border-color 0.15s',
        }}>

        {SIDES.map(({ pos, id: hid }) => (
          <Handle key={hid} id={`src-${hid}`} type="source" position={pos}
            style={{ opacity: selected ? 0.7 : 0.2, width: 8, height: 8, background: '#4A9EFF', border: '1.5px solid #fff' }} />
        ))}
        {SIDES.map(({ pos, id: hid }) => (
          <Handle key={`t-${hid}`} id={`tgt-${hid}`} type="target" position={pos}
            style={{ opacity: 0, width: 14, height: 14 }} />
        ))}

        {editing ? (
          <textarea ref={taRef} value={draft} className="nodrag nopan"
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Escape') commit(); }}
            style={{
              width: '100%', minHeight: 56, background: 'transparent',
              border: 'none', outline: 'none', resize: 'none',
              color: 'var(--cn-fg)', fontFamily: 'inherit',
              fontSize: 13.5, lineHeight: 1.7,
            }} />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none' }}>
            {d.text || <span style={{ color: 'var(--cn-dim)', fontStyle: 'italic' }}>双击编辑…</span>}
          </div>
        )}
      </div>
    </div>
  );
});

CanvasNodeCard.displayName = 'CanvasNodeCard';
