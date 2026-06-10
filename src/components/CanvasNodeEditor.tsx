import { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  type Node, type Edge, type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CanvasNodeCard, type CardData } from './CanvasNodeCard';
import { canvasStore } from '../stores/canvasStore';

const NODE_TYPES = { card: CanvasNodeCard };

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
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleSave = useCallback((ns: Node[], es: Edge[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        canvasStore.update(docId, { content: JSON.stringify({ nodes: ns, edges: es }) });
      }, 600);
    }, [docId]);

    useEffect(() => { scheduleSave(nodes, edges); }, [nodes, edges, scheduleSave]);

    const onConnect = useCallback((conn: Connection) => {
      setEdges(es => addEdge({ ...conn, animated: false }, es));
    }, [setEdges]);

    const addCard = useCallback(() => {
      const id = `card-${Date.now()}`;
      setNodes(ns => [...ns, {
        id, type: 'card',
        position: { x: 80 + Math.random() * 240, y: 80 + Math.random() * 160 },
        data: { text: '', color: '' } satisfies CardData,
      }]);
    }, [setNodes]);

    useImperativeHandle(ref, () => ({ addCard }), [addCard]);

    // CSS 变量注入 — 节点只读变量，不存 dark prop
    const vars = dark
      ? { '--cn-bg': '#242424', '--cn-fg': '#cccccc', '--cn-border': '#383838', '--cn-dim': '#666' }
      : { '--cn-bg': '#ffffff', '--cn-fg': '#1a1a1a', '--cn-border': '#e0e0e0', '--cn-dim': '#aaa' };

    const bg  = dark ? '#1a1a1a' : '#f6f5f2';
    const dot = dark ? '#2e2e2e' : '#dddbd5';

    return (
      <div style={{ width: '100%', height: '100%', background: bg, ...vars } as React.CSSProperties}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          colorMode={dark ? 'dark' : 'light'}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background color={dot} gap={20} size={1.2} />
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>
    );
  }
);

CanvasNodeEditor.displayName = 'CanvasNodeEditor';
