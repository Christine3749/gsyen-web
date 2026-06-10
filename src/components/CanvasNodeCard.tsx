import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';

export interface CardData extends Record<string, unknown> {
  text:   string;
  color?: string;
}

const ACCENT: Record<string, string> = {
  '1': '#eb3b5a', '2': '#fa8231', '3': '#f7b731',
  '4': '#20bf6b', '5': '#0fb9b1', '6': '#8854d0',
};

// 每个方向都支持连出和连入
const SIDES = [
  { pos: Position.Top,    id: 't' },
  { pos: Position.Right,  id: 'r' },
  { pos: Position.Bottom, id: 'b' },
  { pos: Position.Left,   id: 'l' },
];

export const CanvasNodeCard = memo(({ id, data, selected }: NodeProps) => {
  const { updateNodeData } = useReactFlow();
  const d = data as CardData;
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(d.text);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) taRef.current?.focus(); }, [editing]);

  // 每次进入编辑模式时同步最新 text
  useEffect(() => { if (editing) setDraft(d.text); }, [editing, d.text]);

  const commit = () => {
    setEditing(false);
    if (draft !== d.text) updateNodeData(id, { text: draft });
  };

  const accent   = ACCENT[d.color ?? ''];
  const brdColor = selected ? '#4488CC' : 'var(--cn-border)';

  return (
    <div
      onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
      style={{
        background: 'var(--cn-bg)', color: 'var(--cn-fg)',
        border: `1.5px solid ${brdColor}`,
        borderLeft: `4px solid ${accent ?? brdColor}`,
        borderRadius: 8, padding: '10px 14px',
        minWidth: 180, minHeight: 72, maxWidth: 320,
        boxShadow: selected ? '0 0 0 2px #4488CC33' : '0 1px 6px rgba(0,0,0,0.06)',
        cursor: editing ? 'text' : 'grab',
        fontSize: 13, lineHeight: 1.65, fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      {/* 四个方向各一个 handle，同时支持 source 和 target */}
      {SIDES.map(({ pos, id: hid }) => (
        <Handle key={hid} id={`src-${hid}`} type="source" position={pos}
          style={{ opacity: 0.35, width: 8, height: 8 }} />
      ))}
      {SIDES.map(({ pos, id: hid }) => (
        <Handle key={`t-${hid}`} id={`tgt-${hid}`} type="target" position={pos}
          style={{ opacity: 0, width: 14, height: 14 }} />
      ))}

      {editing ? (
        <textarea
          ref={taRef}
          value={draft}
          className="nodrag nopan"
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Escape') commit(); }}
          style={{
            width: '100%', minHeight: 56, background: 'transparent',
            border: 'none', outline: 'none', resize: 'none',
            color: 'var(--cn-fg)', fontFamily: 'inherit',
            fontSize: 13, lineHeight: 1.65,
          }}
        />
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none' }}>
          {d.text || <span style={{ color: 'var(--cn-dim)', fontStyle: 'italic' }}>双击编辑…</span>}
        </div>
      )}
    </div>
  );
});

CanvasNodeCard.displayName = 'CanvasNodeCard';
