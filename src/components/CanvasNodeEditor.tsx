import { useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Node,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { CardData } from './CanvasNodeCard';
import type { CardBorder, CardSize } from './CanvasCardData';
import { CanvasFlowInner } from './CanvasFlowInner';
import {
  ABSORB_PREVIEW_RATIO,
  SIZE_DIM,
  absorbCandidateId,
  attachToCollection,
  clearAbsorbPreview,
  markAbsorbPreview,
} from './CanvasNodeCollection';
import { EDGE_DEFAULTS } from './CanvasNodeRelationView';
import { canvasStore } from '../stores/canvasStore';
import { toObsidian, loadGraph } from './canvasObsidian';

export interface CanvasNodeEditorRef { addCard: () => void }

export const CanvasNodeEditor = forwardRef<CanvasNodeEditorRef, { docId: string; dark: boolean; onViewportChange?: (vp: Viewport) => void }>(
  ({ docId, dark, onViewportChange }, ref) => {
    const initial = loadGraph(docId);
    const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const absorbPreviewRef = useRef<string | null>(null);

    const scheduleSave = useCallback((ns: Node[], es: typeof edges) => {
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
      setNodes(ns => {
        const next = [...ns, { id, type: 'card', position: pos, data }];
        scheduleSave(next, edges);
        return next;
      });
    }, [setNodes, scheduleSave, edges]);

    const addA = useCallback((pos: { x: number; y: number }, size: CardSize) => {
      addCardNode(pos, size, 'solid');
    }, [addCardNode]);

    const handleNodeDrag = useCallback((_event: globalThis.MouseEvent | TouchEvent, node: Node) => {
      setNodes(ns => {
        const targetId = absorbCandidateId(ns, node, ABSORB_PREVIEW_RATIO);
        if (targetId === absorbPreviewRef.current) return ns;
        absorbPreviewRef.current = targetId;
        return markAbsorbPreview(ns, targetId);
      });
    }, [setNodes]);

    const handleNodeDragStop = useCallback((_event: globalThis.MouseEvent | TouchEvent, node: Node) => {
      absorbPreviewRef.current = null;
      setNodes(ns => {
        const next = clearAbsorbPreview(attachToCollection(ns, node));
        scheduleSave(next, edges);
        return next;
      });
    }, [setNodes, scheduleSave, edges]);

    const addCard = useCallback(() => {
      addA({ x: 80 + Math.random() * 200, y: 80 + Math.random() * 120 }, 'S');
    }, [addA]);

    useImperativeHandle(ref, () => ({ addCard }), [addCard]);

    return (
      <ReactFlowProvider>
        <CanvasFlowInner
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onViewportChange={onViewportChange}
          dark={dark}
        />
      </ReactFlowProvider>
    );
  }
);

CanvasNodeEditor.displayName = 'CanvasNodeEditor';

