import { useCallback, useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow, Background, BackgroundVariant, ReactFlowProvider,
  addEdge, useNodesState, useEdgesState, useReactFlow,
  type Node, type Edge, type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CanvasNodeCard, type CardData } from './CanvasNodeCard';
import { CanvasBox } from './CanvasBox';
import { CanvasRightControls, CanvasHint } from './CanvasFlowPanels';
import { CanvasContextMenu, type MenuPosition } from './CanvasContextMenu';
import type { EntityType, ModuleColor } from './CanvasCardData';
import { canvasStore } from '../stores/canvasStore';
import { toObsidian, loadGraph } from './canvasObsidian';

const NODE_TYPES = { card: CanvasNodeCard, box: CanvasBox };
const EDGE_DEFAULTS = { style: { stroke: 'rgba(0,0,0,0.15)', strokeWidth: 1.5 }, animated: false };

/* ── Inner (needs ReactFlow context) ── */
interface InnerProps {
  nodes: Node[]; edges: Edge[];
  onNodesChange: (e: any) => void;
  onEdgesChange: (e: any) => void;
  onConnect: (c: Connection) => void;
  addCard:      (pos?: { x: number; y: number }) => void;
  addEntity:    (pos: { x: number; y: number }, et: EntityType) => void;
  addConnector: (pos: { x: number; y: number }) => void;
  addBox:       (pos: { x: number; y: number }, mc: ModuleColor) => void;
  dark: boolean;
}

function CanvasFlowInner({ nodes, edges, onNodesChange, onEdgesChange, onConnect, addCard, addEntity, addConnector, addBox, dark }: InnerProps) {
  const { screenToFlowPosition } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onDbl = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('.react-flow__node, .react-flow__edge, .react-flow__controls, .react-flow__panel, .react-flow__minimap')) return;
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addCard({ x: p.x - 100, y: p.y - 40 });
    };
    const onCtx = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('.react-flow__node, .react-flow__edge')) return;
      e.preventDefault();
      const fp = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setMenuPos({ x: e.clientX, y: e.clientY, flowX: fp.x - 110, flowY: fp.y - 40 });
    };
    el.addEventListener('dblclick', onDbl, { capture: true });
    el.addEventListener('contextmenu', onCtx, { capture: true });
    return () => {
      el.removeEventListener('dblclick', onDbl, { capture: true });
      el.removeEventListener('contextmenu', onCtx, { capture: true });
    };
  }, [screenToFlowPosition, addCard]);

  const bgColor  = '#EEEDF6';
  const dotColor = '#C8C7D6';
  const vars = { '--cn-bg': '#FFFFFF', '--cn-fg': '#1A1A1A', '--cn-border': 'rgba(0,0,0,0.08)', '--cn-dim': '#AAA' };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: bgColor, ...vars } as React.CSSProperties}>
      <style>{`
        .react-flow__pane { cursor: default !important; }
        .react-flow__pane.dragging { cursor: grabbing !important; }
        .react-flow__node { cursor: default; }
        .react-flow__node:hover .react-flow__handle[data-handletype="source"] { opacity: 0.55 !important; }
        .react-flow__node.selected .react-flow__handle[data-handletype="source"] { opacity: 0.75 !important; }
      `}</style>
      <ReactFlow nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        nodeTypes={NODE_TYPES} defaultEdgeOptions={EDGE_DEFAULTS}
        colorMode={dark ? 'dark' : 'light'} defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }} panOnDrag={[1, 2]} panOnScroll>
        <Background variant={BackgroundVariant.Cross} color={dotColor} gap={24} size={5} strokeWidth={1} />
        <CanvasRightControls dark={dark} />
        <CanvasHint dark={dark} />
      </ReactFlow>
      <CanvasContextMenu pos={menuPos} onClose={() => setMenuPos(null)}
        onCreateText={fp => addCard(fp)}
        onCreateEntity={(fp, et) => addEntity(fp, et)}
        onCreateConnector={fp => addConnector(fp)}
        onCreateBox={(fp, mc) => addBox(fp, mc)} />
    </div>
  );
}

/* ── Exported component ── */
export interface CanvasNodeEditorRef { addCard: () => void }

export const CanvasNodeEditor = forwardRef<CanvasNodeEditorRef, { docId: string; dark: boolean }>(
  ({ docId, dark }, ref) => {
    const initial = loadGraph(docId);
    const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleSave = useCallback((ns: Node[], es: Edge[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() =>
        canvasStore.update(docId, { content: JSON.stringify(toObsidian(ns, es)) }), 600);
    }, [docId]);

    const onConnect = useCallback((conn: Connection) =>
      setEdges(es => addEdge({ ...conn, ...EDGE_DEFAULTS }, es)), [setEdges]);

    const addCard = useCallback((pos?: { x: number; y: number }) => {
      const id = `card-${Date.now()}`;
      setNodes(ns => { const next = [...ns, { id, type: 'card',
        position: pos ?? { x: 80 + Math.random() * 200, y: 80 + Math.random() * 120 },
        data: { text: '', color: '', defaultEditing: true, width: 250, height: 100 } satisfies CardData,
      }]; scheduleSave(next, edges); return next; });
    }, [setNodes, scheduleSave, edges]);

    const addEntity = useCallback((pos: { x: number; y: number }, entityType: EntityType) => {
      const id = `card-${Date.now()}`;
      setNodes(ns => { const next = [...ns, { id, type: 'card', position: pos,
        data: { cardType: 'entity', text: '', entityType, entityName: '', entitySub: '', statusColor: 'gray' } }];
        scheduleSave(next, edges); return next; });
    }, [setNodes, scheduleSave, edges]);

    const addConnector = useCallback((pos: { x: number; y: number }) => {
      const id = `card-${Date.now()}`;
      setNodes(ns => { const next = [...ns, { id, type: 'card', position: pos,
        data: { cardType: 'connector', text: '', connectorType: 'calls', connectorName: '' } }];
        scheduleSave(next, edges); return next; });
    }, [setNodes, scheduleSave, edges]);

    const addBox = useCallback((pos: { x: number; y: number }, moduleColor: ModuleColor) => {
      const id = `box-${Date.now()}`;
      setNodes(ns => { const next = [...ns, { id, type: 'box', position: pos,
        style: { width: 280, height: 180 },
        data: { label: '新建盒子', moduleColor, childCount: 0, collapsed: false } }];
        scheduleSave(next, edges); return next; });
    }, [setNodes, scheduleSave, edges]);

    useImperativeHandle(ref, () => ({ addCard }), [addCard]);

    return (
      <ReactFlowProvider>
        <CanvasFlowInner
          nodes={nodes} edges={edges}
          onNodesChange={e => { onNodesChange(e); scheduleSave(nodes, edges); }}
          onEdgesChange={e => { onEdgesChange(e); scheduleSave(nodes, edges); }}
          onConnect={onConnect} addCard={addCard}
          addEntity={addEntity} addConnector={addConnector} addBox={addBox}
          dark={dark} />
      </ReactFlowProvider>
    );
  }
);

CanvasNodeEditor.displayName = 'CanvasNodeEditor';
