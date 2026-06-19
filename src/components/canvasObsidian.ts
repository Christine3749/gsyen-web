import type { Node, Edge } from '@xyflow/react';
import type { CardData } from './CanvasCardData';
import { canvasStore } from '../stores/canvasStore';

export interface SavedGraph { nodes: Node[]; edges: Edge[] }

const SIDE:   Record<string, string> = { top: 't', right: 'r', bottom: 'b', left: 'l' };
const SIDE_R: Record<string, string> = { t: 'top', r: 'right', b: 'bottom', l: 'left' };

const EDGE_STYLE = { stroke: 'rgba(0,0,0,0.15)', strokeWidth: 1.5 };

function obsidianNodeText(n: any): string {
  if (n.type === 'file')  return `📎 ${n.file ?? ''}`;
  if (n.type === 'link')  return `🔗 ${n.url ?? ''}`;
  if (n.type === 'group') return `▣ ${n.label ?? 'Group'}`;
  return n.text ?? '';
}

export function fromObsidian(raw: any): SavedGraph {
  const nodes: Node[] = (raw.nodes ?? []).map((n: any) => ({
    id: n.id, type: 'card',
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    style: n.width ? { width: n.width } : undefined,
    data: {
      text: obsidianNodeText(n),
      color: n.color ?? '',
      width: n.width ?? 250, height: n.height ?? 100,
      _obs: n,
    },
  }));
  const edges: Edge[] = (raw.edges ?? []).map((e: any) => ({
    id: e.id, source: e.fromNode, target: e.toNode,
    sourceHandle: `src-${SIDE[e.fromSide] ?? 'r'}`,
    targetHandle: `tgt-${SIDE[e.toSide] ?? 'l'}`,
    label: e.label,
    style: { ...EDGE_STYLE, ...(e.color ? { stroke: e.color } : {}) },
    data: { _obs: e },
  }));
  return { nodes, edges };
}

export function toObsidian(nodes: Node[], edges: Edge[]) {
  return {
    nodes: nodes.map(n => {
      const d = n.data as CardData & { _obs?: any };
      const x = Math.round(n.position.x);
      const y = Math.round(n.position.y);
      if (d._obs && d._obs.type !== 'text') return { ...d._obs, x, y };
      const obj: any = { id: n.id, type: 'text', x, y,
        width: d.width ?? 250, height: d.height ?? 100, text: d.text ?? '' };
      if (d.color) obj.color = d.color;
      return obj;
    }),
    edges: edges.map(e => {
      const obs = (e.data as any)?._obs ?? {};
      return {
        ...obs,
        id: e.id,
        fromNode: e.source,
        fromSide: SIDE_R[e.sourceHandle?.replace('src-', '') ?? 'r'] ?? 'right',
        toNode: e.target,
        toSide: SIDE_R[e.targetHandle?.replace('tgt-', '') ?? 'l'] ?? 'left',
      };
    }),
  };
}

export function loadGraph(docId: string): SavedGraph {
  try {
    const doc = canvasStore.getById(docId);
    if (!doc?.content) return { nodes: [], edges: [] };
    const raw = JSON.parse(doc.content);
    return fromObsidian(raw);
  } catch { return { nodes: [], edges: [] }; }
}
