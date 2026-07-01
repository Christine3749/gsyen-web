import { useCallback, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow, Panel, ReactFlowProvider,
  addEdge, useNodesState, useEdgesState, useReactFlow, useViewport, useOnViewportChange,
  MarkerType,
  type Node, type Edge, type Connection, type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CanvasNodeCard, type CardData } from './CanvasNodeCard';
import { CanvasBox } from './CanvasBox';
import { CanvasRightControls } from './CanvasFlowPanels';
import type { BoxData, CardBorder, CardSize } from './CanvasCardData';
import { canvasStore } from '../stores/canvasStore';
import { toObsidian, loadGraph } from './canvasObsidian';

const NODE_TYPES = { card: CanvasNodeCard, box: CanvasBox };

function StarBackground({ color }: { color: string }) {
  const { x, y, zoom } = useViewport();
  const gap = 24 * zoom;
  const arm = 2 * zoom;
  const px = ((x % gap) + gap) % gap;
  const py = ((y % gap) + gap) % gap;
  const cx = gap / 2, cy = gap / 2;
  const d = `M ${cx},${cy - arm} A ${arm},${arm} 0 0 0 ${cx + arm},${cy} A ${arm},${arm} 0 0 0 ${cx},${cy + arm} A ${arm},${arm} 0 0 0 ${cx - arm},${cy} A ${arm},${arm} 0 0 0 ${cx},${cy - arm} Z`;
  return (
    <Panel position="top-left" style={{ inset: 0, margin: 0, pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
      <svg width="100%" height="100%">
        <defs>
          <pattern id="star-bg" x={px} y={py} width={gap} height={gap} patternUnits="userSpaceOnUse">
            <path d={d} fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#star-bg)" />
      </svg>
    </Panel>
  );
}

const EDGE_COLOR = 'rgba(126,136,154,0.26)';
const EDGE_STYLE = { stroke: EDGE_COLOR, strokeWidth: 2.2, strokeLinecap: 'round' as const };
const EDGE_MARKER = { type: MarkerType.ArrowClosed, color: EDGE_COLOR, width: 14, height: 14 };
const EDGE_CURVATURE = 0.34;
const EDGE_LABEL_BG = '#EEEDF6';
const EDGE_LABEL_PADDING: [number, number] = [6, 4];
const EDGE_DEFAULTS = {
  style: EDGE_STYLE,
  markerEnd: EDGE_MARKER,
  pathOptions: { curvature: EDGE_CURVATURE },
  animated: false,
};
const RELATION_EDGE_COLOR = 'rgba(96,108,128,0.46)';
const MUTED_EDGE_COLOR = 'rgba(126,136,154,0.10)';
const RELATED_NODE_OPACITY = 1;
const UNRELATED_NODE_OPACITY = 0.34;

const SIZE_DIM: Record<CardSize, { w: number; h: number }> = {
  S: { w: 220, h: 170 },
  M: { w: 300, h: 230 },
  L: { w: 380, h: 320 },
};

const COLLECTION_DIM = { w: 420, h: 280 };
const ABSORB_PREVIEW_RATIO = 0.25;
const ABSORB_RATIO = 0.6;

/* ── Inner (needs ReactFlow context) ── */
interface InnerProps {
  nodes: Node[]; edges: Edge[];
  onNodesChange: (e: any) => void;
  onEdgesChange: (e: any) => void;
  onConnect: (c: Connection) => void;
  onNodeDrag: (_event: React.MouseEvent, node: Node) => void;
  onNodeDragStop: (_event: React.MouseEvent, node: Node) => void;
  onViewportChange?: (vp: Viewport) => void;
  dark: boolean;
}

function CanvasFlowInner({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeDrag, onNodeDragStop, onViewportChange, dark }: InnerProps) {
  useOnViewportChange({ onChange: vp => onViewportChange?.(vp) });
  const { fitView } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const didInitialFitRef = useRef(false);
  const relationView = useMemo(() => buildRelationView(nodes, edges), [nodes, edges]);

  useEffect(() => {
    if (didInitialFitRef.current) return;
    const visibleNodes = nodes.filter(node => !node.hidden);
    if (visibleNodes.length === 0) return;
    const timer = window.setTimeout(() => {
      fitView({
        nodes: visibleNodes.map(node => ({ id: node.id })),
        duration: 0,
        padding: 0.18,
      });
      didInitialFitRef.current = true;
    }, 80);
    return () => window.clearTimeout(timer);
  }, [fitView, nodes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const suppressCtx = (e: MouseEvent) => {
      e.preventDefault();
    };
    el.addEventListener('contextmenu', suppressCtx, { capture: true });
    return () => {
      el.removeEventListener('contextmenu', suppressCtx, { capture: true });
    };
  }, []);

  const bgColor  = '#EEEDF6';
  const dotColor = '#C8C7D6';
  const vars = { '--cn-bg': '#FFFFFF', '--cn-fg': '#1A1A1A', '--cn-border': 'rgba(0,0,0,0.08)', '--cn-dim': '#AAA' };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: bgColor, ...vars } as React.CSSProperties}>
      <style>{`
        .react-flow__pane { cursor: default !important; }
        .react-flow__pane.dragging { cursor: grabbing !important; }
        .react-flow__node { cursor: default; }
        .react-flow__node:hover .react-flow__handle[data-handletype="source"]:not(.gsyen-side-aware-handle) { opacity: 0.55 !important; }
        .react-flow__node.selected .react-flow__handle[data-handletype="source"]:not(.gsyen-side-aware-handle) { opacity: 0.75 !important; }
      `}</style>
      <ReactFlow nodes={relationView.nodes} edges={relationView.edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={NODE_TYPES} defaultEdgeOptions={EDGE_DEFAULTS}
        colorMode={dark ? 'dark' : 'light'} defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }} panOnDrag={[1, 2]} panOnScroll>
        <StarBackground color={dotColor} />
        <CanvasRightControls dark={dark} />
      </ReactFlow>
    </div>
  );
}

function markerFor(color: string) {
  return { type: MarkerType.ArrowClosed, color, width: 14, height: 14 };
}

function edgeStyleFor(color: string) {
  return { stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, transition: 'stroke 0.16s ease' };
}

function hasEdgeLabel(edge: Edge) {
  return String(edge.label ?? '').trim().length > 0;
}

function edgeLabelStyle(kind: 'default' | 'related' | 'muted') {
  const fill = kind === 'related'
    ? 'rgba(51,58,72,0.82)'
    : kind === 'muted'
      ? 'rgba(80,88,104,0.22)'
      : 'rgba(64,70,86,0.58)';
  return {
    fill,
    fontSize: 13,
    fontWeight: 500,
    fontFamily: '"HarmonyOS Sans SC","HarmonyOS Sans","Inter","PingFang SC","Microsoft YaHei UI",system-ui,sans-serif',
  };
}

function edgeLabelBgStyle(kind: 'default' | 'related' | 'muted') {
  return {
    fill: EDGE_LABEL_BG,
    fillOpacity: kind === 'muted' ? 0.52 : 0.9,
  };
}

function presentEdge(edge: Edge, color: string, kind: 'default' | 'related' | 'muted') {
  const showLabel = hasEdgeLabel(edge);
  return {
    ...edge,
    style: edgeStyleFor(color),
    markerEnd: markerFor(color),
    pathOptions: { curvature: EDGE_CURVATURE },
    labelStyle: edgeLabelStyle(kind),
    labelShowBg: showLabel,
    labelBgStyle: edgeLabelBgStyle(kind),
    labelBgPadding: EDGE_LABEL_PADDING,
    labelBgBorderRadius: 5,
    zIndex: kind === 'related' ? 2 : 0,
  };
}

function buildRelationView(nodes: Node[], edges: Edge[]) {
  const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
  if (selectedIds.size === 0) {
    return { nodes, edges: edges.map(edge => presentEdge(edge, EDGE_COLOR, 'default')) };
  }

  const relatedNodeIds = new Set(selectedIds);
  const relatedEdgeIds = new Set<string>();

  edges.forEach(edge => {
    const related = selectedIds.has(edge.source) || selectedIds.has(edge.target);
    if (!related) return;
    relatedEdgeIds.add(edge.id);
    relatedNodeIds.add(edge.source);
    relatedNodeIds.add(edge.target);
  });

  return {
    nodes: nodes.map(node => {
      const related = relatedNodeIds.has(node.id);
      return {
        ...node,
        style: {
          ...node.style,
          opacity: related ? RELATED_NODE_OPACITY : UNRELATED_NODE_OPACITY,
          transition: 'opacity 0.16s ease',
        },
      };
    }),
    edges: edges.map(edge => {
      const related = relatedEdgeIds.has(edge.id);
      const color = related ? RELATION_EDGE_COLOR : MUTED_EDGE_COLOR;
      return presentEdge(edge, color, related ? 'related' : 'muted');
    }),
  };
}

function nodeSize(n: Node) {
  const d = n.data as Record<string, unknown>;
  const style = n.style as Record<string, unknown> | undefined;
  const measured = (n as any).measured as { width?: number; height?: number } | undefined;
  return {
    w: Number(d.width ?? n.width ?? measured?.width ?? style?.width ?? (n.type === 'box' ? COLLECTION_DIM.w : SIZE_DIM.S.w)),
    h: Number(d.height ?? n.height ?? measured?.height ?? style?.height ?? (n.type === 'box' ? COLLECTION_DIM.h : SIZE_DIM.S.h)),
  };
}

function absolutePosition(n: Node, nodes: Node[]) {
  let x = n.position.x;
  let y = n.position.y;
  let parentId = n.parentId;
  while (parentId) {
    const parent = nodes.find(item => item.id === parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}

function isDescendant(nodeId: string, ancestorId: string, nodes: Node[]) {
  let cur = nodes.find(n => n.id === nodeId);
  while (cur?.parentId) {
    if (cur.parentId === ancestorId) return true;
    cur = nodes.find(n => n.id === cur?.parentId);
  }
  return false;
}

function overlapRatio(child: Node, box: Node, nodes: Node[]) {
  const c = absolutePosition(child, nodes);
  const b = absolutePosition(box, nodes);
  const cs = nodeSize(child);
  const bs = nodeSize(box);
  const left = Math.max(c.x, b.x);
  const top = Math.max(c.y, b.y);
  const right = Math.min(c.x + cs.w, b.x + bs.w);
  const bottom = Math.min(c.y + cs.h, b.y + bs.h);
  if (right <= left || bottom <= top) return 0;
  return ((right - left) * (bottom - top)) / (cs.w * cs.h);
}

function withCollectionCounts(nodes: Node[]) {
  return orderParentsFirst(nodes.map(n => {
    if (n.type !== 'box') return n;
    const childCount = nodes.filter(child => child.parentId === n.id).length;
    return { ...n, data: { ...n.data, childCount } };
  }));
}

function clearAbsorbPreview(nodes: Node[]) {
  return nodes.map(n => {
    if (n.type !== 'box' || !(n.data as BoxData).absorbPreview) return n;
    return { ...n, data: { ...n.data, absorbPreview: false } };
  });
}

function orderParentsFirst(nodes: Node[]) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const visited = new Set<string>();
  const ordered: Node[] = [];

  const visit = (node: Node) => {
    if (visited.has(node.id)) return;
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) visit(parent);
    }
    visited.add(node.id);
    ordered.push(node);
  };

  nodes.forEach(visit);
  return ordered;
}

function attachToCollection(nodes: Node[], draggedNode: Node) {
  if (draggedNode.type !== 'card' && draggedNode.type !== 'box') return nodes;
  const current = nodes.map(n => n.id === draggedNode.id ? { ...n, position: draggedNode.position, parentId: draggedNode.parentId } : n);
  const dragged = current.find(n => n.id === draggedNode.id);
  if (!dragged) return nodes;

  const candidates = current
    .filter(n => n.type === 'box' && n.id !== dragged.id && !n.hidden && !isDescendant(n.id, dragged.id, current))
    .map(box => ({ box, ratio: overlapRatio(dragged, box, current) }))
    .filter(item => item.ratio >= ABSORB_RATIO)
    .sort((a, b) => b.ratio - a.ratio);

  const target = candidates[0]?.box;
  const draggedAbs = absolutePosition(dragged, current);

  if (!target) {
    const detached = current.map(n => {
      if (n.id !== dragged.id || !n.parentId) return n;
      return { ...n, parentId: undefined, position: draggedAbs };
    });
    return withCollectionCounts(detached);
  }

  const targetAbs = absolutePosition(target, current);
  const hidden = Boolean((target.data as BoxData).collapsed);
  const attached = current.map(n => {
    if (n.id !== dragged.id) return n;
    return {
      ...n,
      parentId: target.id,
      position: { x: draggedAbs.x - targetAbs.x, y: draggedAbs.y - targetAbs.y },
      hidden,
    };
  });
  return withCollectionCounts(attached);
}

function absorbCandidateId(nodes: Node[], draggedNode: Node, threshold: number) {
  if (draggedNode.type !== 'card' && draggedNode.type !== 'box') return null;
  const current = nodes.map(n => n.id === draggedNode.id ? { ...n, position: draggedNode.position, parentId: draggedNode.parentId } : n);
  const dragged = current.find(n => n.id === draggedNode.id);
  if (!dragged) return null;
  const candidates = current
    .filter(n => n.type === 'box' && n.id !== dragged.id && !n.hidden && !isDescendant(n.id, dragged.id, current))
    .map(box => ({ box, ratio: overlapRatio(dragged, box, current) }))
    .filter(item => item.ratio >= threshold)
    .sort((a, b) => b.ratio - a.ratio);
  return candidates[0]?.box.id ?? null;
}

function markAbsorbPreview(nodes: Node[], targetId: string | null) {
  return nodes.map(n => {
    if (n.type !== 'box') return n;
    const active = n.id === targetId;
    if (Boolean((n.data as BoxData).absorbPreview) === active) return n;
    return { ...n, data: { ...n.data, absorbPreview: active } };
  });
}

/* ── Exported component ── */
export interface CanvasNodeEditorRef { addCard: () => void }

export const CanvasNodeEditor = forwardRef<CanvasNodeEditorRef, { docId: string; dark: boolean; onViewportChange?: (vp: Viewport) => void }>(
  ({ docId, dark, onViewportChange }, ref) => {
    const initial = loadGraph(docId);
    const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleSave = useCallback((ns: Node[], es: Edge[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() =>
        canvasStore.update(docId, { content: JSON.stringify(toObsidian(ns, es)) }), 600);
    }, [docId]);

    const onConnect = useCallback((conn: Connection) => {
      setEdges(es => {
        const next = addEdge({ ...conn, id: `edge-${Date.now()}`, ...EDGE_DEFAULTS }, es);
        scheduleSave(nodes, next);
        return next;
      });
    }, [nodes, scheduleSave, setEdges]);

    useEffect(() => {
      scheduleSave(nodes, edges);
    }, [nodes, edges, scheduleSave]);

    const addCardNode = useCallback((pos: { x: number; y: number }, size: CardSize, border: CardBorder) => {
      const id = `card-${Date.now()}`;
      const { w, h } = SIZE_DIM[size];
      const data: CardData = {
        cardType: 'solid', cardSize: size, contentType: 'note',
        text: '', entityName: '', entitySub: 'NOTE',
        status: '草稿', statusColor: 'gray',
        cardBorder: border, cardElevation: 'flat', cardOpacity: 'solid',
        cardCorner: 'sm', cardDensity: 'compact', cardState: 'normal',
        width: w, height: h,
      };
      setNodes(ns => { const next = [...ns, { id, type: 'card', position: pos, data }];
        scheduleSave(next, edges); return next; });
    }, [setNodes, scheduleSave, edges]);

    const addA = useCallback((pos: { x: number; y: number }, size: CardSize) => {
      addCardNode(pos, size, 'solid');
    }, [addCardNode]);

    const absorbPreviewRef = useRef<string | null>(null);

    const handleNodeDrag = useCallback((_event: React.MouseEvent, node: Node) => {
      setNodes(ns => {
        const targetId = absorbCandidateId(ns, node, ABSORB_PREVIEW_RATIO);
        if (targetId === absorbPreviewRef.current) return ns;
        absorbPreviewRef.current = targetId;
        return markAbsorbPreview(ns, targetId);
      });
    }, [setNodes]);

    const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
      absorbPreviewRef.current = null;
      setNodes(ns => {
        const next = clearAbsorbPreview(attachToCollection(ns, node));
        scheduleSave(next, edges);
        return next;
      });
    }, [setNodes, scheduleSave, edges]);

    // backward compat: double-click creates A·S
    const addCard = useCallback(() => {
      addA({ x: 80 + Math.random() * 200, y: 80 + Math.random() * 120 }, 'S');
    }, [addA]);

    useImperativeHandle(ref, () => ({ addCard }), [addCard]);

    return (
      <ReactFlowProvider>
        <CanvasFlowInner
          nodes={nodes} edges={edges}
          onNodesChange={e => { onNodesChange(e); scheduleSave(nodes, edges); }}
          onEdgesChange={e => { onEdgesChange(e); scheduleSave(nodes, edges); }}
          onConnect={onConnect}
          onNodeDrag={handleNodeDrag} onNodeDragStop={handleNodeDragStop}
          onViewportChange={onViewportChange} dark={dark} />
      </ReactFlowProvider>
    );
  }
);

CanvasNodeEditor.displayName = 'CanvasNodeEditor';



