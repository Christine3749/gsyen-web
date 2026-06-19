import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow, Background, Panel, BackgroundVariant,
  addEdge, useNodesState, useEdgesState,
  type Node, type Edge, type Connection, type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useReactFlow } from '@xyflow/react';
import { CanvasNodeCard, type CardData } from './CanvasNodeCard';
import { canvasStore } from '../stores/canvasStore';

const NODE_TYPES = { card: CanvasNodeCard };

const EDGE_DEFAULTS = {
  style: { stroke: 'rgba(0,0,0,0.18)', strokeWidth: 1.5 },
  animated: false,
};

/* ── Right-side Obsidian-style controls (inside ReactFlow context) ── */
function CanvasRightControls({ dark }: { dark: boolean }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const bg  = dark ? '#1E1E1E' : '#FFFFFF';
  const bdr = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const sh  = dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)';
  const ic  = dark ? '#888' : '#666';

  const btn = (onClick: () => void, title: string, children: React.ReactNode) => (
    <button title={title} onClick={onClick} style={{
      width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg, border: `0.5px solid ${bdr}`, borderRadius: 8, cursor: 'pointer',
      boxShadow: sh, color: ic, fontSize: 16, fontWeight: 400, transition: 'opacity 0.1s',
    }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
      {children}
    </button>
  );

  return (
    <Panel position="top-right" style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '14px 14px 0 0' }}>
      {btn(() => zoomIn({ duration: 200 }), 'Zoom In',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/>
        </svg>)}
      {btn(() => fitView({ duration: 300, padding: 0.15 }), 'Fit View',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M1.5 4.5V2H4M10 2h2.5v2.5M12.5 9.5V12H10M4 12H1.5V9.5"/>
        </svg>)}
      {btn(() => zoomOut({ duration: 200 }), 'Zoom Out',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="2" y1="7" x2="12" y2="7"/>
        </svg>)}
    </Panel>
  );
}

/* ── Main editor ── */
interface SavedGraph { nodes: Node[]; edges: Edge[] }

function loadGraph(docId: string): SavedGraph {
  try {
    const doc = canvasStore.getById(docId);
    if (doc?.content) return JSON.parse(doc.content);
  } catch { /* empty */ }
  return { nodes: [], edges: [] };
}

export interface CanvasNodeEditorRef { addCard: () => void }

interface Props { docId: string; dark: boolean }

export const CanvasNodeEditor = forwardRef<CanvasNodeEditorRef, Props>(
  ({ docId, dark }, ref) => {
    const initial = loadGraph(docId);
    const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
    const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const viewport   = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
    const wrapRef    = useRef<HTMLDivElement>(null);

    const scheduleSave = useCallback((ns: Node[], es: Edge[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        canvasStore.update(docId, { content: JSON.stringify({ nodes: ns, edges: es }) });
      }, 600);
    }, [docId]);

    const onConnect = useCallback((conn: Connection) =>
      setEdges(es => addEdge({ ...conn, ...EDGE_DEFAULTS }, es)), [setEdges]);

    const addCard = useCallback((pos?: { x: number; y: number }) => {
      const id = `card-${Date.now()}`;
      setNodes(ns => {
        const newNodes = [...ns, {
          id, type: 'card',
          position: pos ?? { x: 80 + Math.random() * 200, y: 80 + Math.random() * 120 },
          data: { text: '', color: '', defaultEditing: true } satisfies CardData,
        }];
        scheduleSave(newNodes, edges);
        return newNodes;
      });
    }, [setNodes, scheduleSave, edges]);

    useImperativeHandle(ref, () => ({ addCard }), [addCard]);

    /* Convert screen → flow position using tracked viewport */
    const onDoubleClick = useCallback((e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.react-flow__node')) return;
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { x, y, zoom } = viewport.current;
      addCard({
        x: (e.clientX - rect.left - x) / zoom - 100,
        y: (e.clientY - rect.top  - y) / zoom - 40,
      });
    }, [addCard]);

    /* CSS vars — nodes read these for colours */
    const vars = dark
      ? { '--cn-bg': '#1E1E1E', '--cn-fg': '#CCCCCC', '--cn-border': '#383838', '--cn-dim': '#666' }
      : { '--cn-bg': '#FFFFFF', '--cn-fg': '#1A1A1A', '--cn-border': 'rgba(0,0,0,0.1)', '--cn-dim': '#AAA' };

    const bgColor  = dark ? '#1A1A1A' : '#F0EDE8';
    const dotColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

    return (
      <div ref={wrapRef} onDoubleClick={onDoubleClick}
        style={{ width: '100%', height: '100%', background: bgColor, ...vars } as React.CSSProperties}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={e => { onNodesChange(e); scheduleSave(nodes, edges); }}
          onEdgesChange={e => { onEdgesChange(e); scheduleSave(nodes, edges); }}
          onConnect={onConnect}
          onMove={(_e, vp) => { viewport.current = vp; }}
          nodeTypes={NODE_TYPES}
          defaultEdgeOptions={EDGE_DEFAULTS}
          colorMode={dark ? 'dark' : 'light'}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} color={dotColor} gap={24} size={1.5} />
          <CanvasRightControls dark={dark} />
        </ReactFlow>
      </div>
    );
  }
);

CanvasNodeEditor.displayName = 'CanvasNodeEditor';
