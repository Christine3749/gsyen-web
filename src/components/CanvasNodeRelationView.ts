import { MarkerType, type Edge, type Node } from '@xyflow/react';

const EDGE_COLOR = 'rgba(126,136,154,0.26)';
const EDGE_STYLE = { stroke: EDGE_COLOR, strokeWidth: 2.2, strokeLinecap: 'round' as const };
const EDGE_MARKER = { type: MarkerType.ArrowClosed, color: EDGE_COLOR, width: 14, height: 14 };
const EDGE_CURVATURE = 0.34;
const EDGE_LABEL_BG = '#EEEDF6';
const EDGE_LABEL_PADDING: [number, number] = [6, 4];
const RELATION_EDGE_COLOR = 'rgba(96,108,128,0.46)';
const MUTED_EDGE_COLOR = 'rgba(126,136,154,0.10)';
const RELATED_NODE_OPACITY = 1;
const UNRELATED_NODE_OPACITY = 0.34;

export const EDGE_DEFAULTS = {
  style: EDGE_STYLE,
  markerEnd: EDGE_MARKER,
  pathOptions: { curvature: EDGE_CURVATURE },
  animated: false,
};

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

export function buildRelationView(nodes: Node[], edges: Edge[]) {
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
