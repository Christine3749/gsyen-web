import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useReactFlow, useViewport } from '@xyflow/react';
import {
  CheckSquare,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FoldVertical,
  Hash,
  History,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  ListChecks,
  ListTree,
  Map,
  Maximize2,
  Minimize,
  PanelLeft,
  Quote,
  Sigma,
  Square,
  Table2,
  Trash2,
  XSquare,
} from 'lucide-react';
import type {
  CardAccent,
  CardBorder,
  CardData,
  CardSize,
  CardState,
  ContentType,
  StatusColor,
} from './CanvasCardData';
import { CT_STATUS } from './CanvasCardData';

const FONT = '"HarmonyOS Sans SC","HarmonyOS Sans","Inter","PingFang SC","Microsoft YaHei UI",system-ui,sans-serif';
const LATIN = '"Inter","HarmonyOS Sans",system-ui,sans-serif';
const BLUE = '#5F74C4';
const PANEL_BG = 'rgba(248, 249, 252, 0.96)';
const INK = 'rgba(24, 27, 35, 0.82)';
const MUTED = 'rgba(24, 27, 35, 0.38)';
const DIVIDER = 'rgba(24, 27, 35, 0.075)';
const HOVER = 'rgba(255, 255, 255, 0.76)';
const PANEL_WIDTH = 344;
const PANEL_GAP = 14;
const PANEL_EDGE = 12;
const PANEL_TOP_OFFSET = -4;
const PANEL_RADIUS = 6;
const PANEL_PADDING = '10px 0';
const PANEL_BORDER = '1px solid rgba(112,121,138,0.18)';
const PANEL_SHADOW = '0 5px 16px rgba(38,36,52,0.08), 0 1px 2px rgba(38,36,52,0.045), inset 0 1px 0 rgba(255,255,255,0.86)';

const ACCENTS: { v: CardAccent; bg: string; label: string; empty?: true }[] = [
  { v: '', bg: '#EDF0F6', label: 'none', empty: true },
  { v: 'red', bg: '#B7657A', label: 'red' },
  { v: 'amber', bg: '#B49A50', label: 'amber' },
  { v: 'green', bg: '#779B85', label: 'green' },
  { v: 'blue', bg: '#5F74C4', label: 'blue' },
  { v: 'purple', bg: '#8978BD', label: 'purple' },
  { v: 'black', bg: '#2A2C31', label: 'black' },
];

const SIZES: { v: CardSize; dim: string }[] = [
  { v: 'S', dim: '220×170' },
  { v: 'M', dim: '300×230' },
  { v: 'L', dim: '380×320' },
];

const CT: { v: ContentType; label: string; icon: ReactNode }[] = [
  { v: 'note', label: 'Note', icon: <FileText /> },
  { v: 'code', label: 'Code', icon: <Code2 /> },
  { v: 'image', label: 'Image', icon: <ImageIcon /> },
  { v: 'link', label: 'Link', icon: <LinkIcon /> },
  { v: 'task', label: 'Task', icon: <ListChecks /> },
  { v: 'table', label: 'Table', icon: <Table2 /> },
  { v: 'math', label: 'Math', icon: <Sigma /> },
  { v: 'quote', label: 'Quote', icon: <Quote /> },
];

interface Props {
  nodeId: string;
  data: CardData;
  anchorRef: RefObject<HTMLElement>;
  onClose: () => void;
}

function stopPress(e: PointerEvent<HTMLElement>, action?: () => void) {
  e.preventDefault();
  e.stopPropagation();
  action?.();
}

function Divider() {
  return <div style={{ height: 1, margin: '9px 26px', background: DIVIDER }} />;
}

function MenuRow({ icon, label, shortcut, children, danger, active, onPress }: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  children?: ReactNode;
  danger?: boolean;
  active?: boolean;
  onPress?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const isAction = Boolean(onPress);
  const rowStyle: CSSProperties = {
    width: 'calc(100% - 36px)',
    margin: '0 18px',
    height: 45,
    display: 'grid',
    gridTemplateColumns: '26px 1fr auto',
    alignItems: 'center',
    columnGap: 10,
    padding: '0 12px',
    border: 0,
    borderRadius: 12,
    outline: 'none',
    cursor: isAction ? 'pointer' : 'default',
    background: active || (hover && isAction) ? HOVER : 'transparent',
    boxShadow: active || (hover && isAction) ? '0 1px 0 rgba(255,255,255,0.82) inset, 0 1px 5px rgba(38,36,52,0.055)' : 'none',
    fontFamily: FONT,
    boxSizing: 'border-box',
    transition: 'background 0.12s, box-shadow 0.12s',
  };
  const content = (
    <>
      <span style={{
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: danger ? 'rgba(178, 35, 48, 0.78)' : 'rgba(24,27,35,0.50)',
      }}>
        {icon}
      </span>
      <span style={{
        minWidth: 0,
        color: danger ? '#B42330' : INK,
        fontSize: 15.5,
        lineHeight: 1,
        fontWeight: 520,
        letterSpacing: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <span style={{
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        color: danger ? 'rgba(178,35,48,0.44)' : MUTED,
        fontFamily: LATIN,
        fontSize: 15,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        {children}
        {shortcut && <span>{shortcut}</span>}
      </span>
    </>
  );

  if (!isAction) {
    return (
      <div
        className="nodrag nopan"
        onPointerDown={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        style={rowStyle}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="nodrag nopan"
      onPointerDown={e => stopPress(e, onPress)}
      onClick={e => e.stopPropagation()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={rowStyle}
    >
      {content}
    </button>
  );
}

function Toggle({ active, onChange }: { active: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      className="nodrag nopan"
      onPointerDown={e => stopPress(e, () => onChange(!active))}
      onClick={e => e.stopPropagation()}
      style={{
        width: 48,
        height: 28,
        padding: 3,
        border: 0,
        borderRadius: 999,
        background: active ? 'rgba(95,116,196,0.42)' : 'rgba(24,27,35,0.16)',
        boxShadow: 'inset 0 1px 2px rgba(38,36,52,0.12), 0 1px 0 rgba(255,255,255,0.72)',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <span style={{
        display: 'block',
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 1px 3px rgba(38,36,52,0.18)',
        transform: active ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.14s',
      }} />
    </button>
  );
}

function Swatches({ data, up }: { data: CardData; up: (p: Partial<CardData>) => void }) {
  return (
    <div style={{ height: 42, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 0 56px' }}>
      {ACCENTS.map(a => {
        const active = (data.cardAccent ?? '') === a.v;
        return (
          <button
            key={a.label}
            type="button"
            className="nodrag nopan"
            aria-label={a.label}
            onPointerDown={e => stopPress(e, () => up({ cardAccent: a.v }))}
            onClick={e => e.stopPropagation()}
            style={{
              width: 27,
              height: 27,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: active ? `3px solid ${BLUE}` : '1px solid rgba(24,27,35,0.10)',
              background: a.bg,
              boxShadow: active ? '0 0 0 2px rgba(255,255,255,0.72), 0 2px 8px rgba(38,36,52,0.16)' : '0 1px 4px rgba(38,36,52,0.12)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {a.empty && <span style={{ width: 14, height: 2, borderRadius: 2, background: 'rgba(178,35,48,0.42)', transform: 'rotate(-38deg)' }} />}
          </button>
        );
      })}
    </div>
  );
}

function Segment({ options, value, onChange, compact }: {
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <span style={{
      display: 'inline-flex',
      gap: 2,
      padding: 3,
      borderRadius: compact ? 9 : 11,
      background: 'rgba(24,27,35,0.075)',
      boxShadow: 'inset 0 1px 2px rgba(38,36,52,0.06)',
    }}>
      {options.map(([label, val]) => {
        const active = value === val;
        return (
          <button
            key={val}
            type="button"
            className="nodrag nopan"
            onPointerDown={e => stopPress(e, () => onChange(val))}
            onClick={e => e.stopPropagation()}
            style={{
              minWidth: compact ? 44 : 58,
              height: compact ? 26 : 30,
              padding: '0 10px',
              border: 0,
              borderRadius: compact ? 7 : 9,
              background: active ? 'rgba(255,255,255,0.78)' : 'transparent',
              boxShadow: active ? '0 1px 3px rgba(38,36,52,0.07), inset 0 1px 0 rgba(255,255,255,0.82)' : 'none',
              color: active ? INK : MUTED,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: FONT,
              fontSize: compact ? 12 : 13,
              fontWeight: active ? 620 : 510,
            }}
          >
            {label}
          </button>
        );
      })}
    </span>
  );
}

function TypePicker({ data, up }: { data: CardData; up: (p: Partial<CardData>) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '6px 20px 4px 56px' }}>
      {CT.map(ct => {
        const active = (data.contentType ?? 'note') === ct.v;
        return (
          <button
            key={ct.v}
            type="button"
            className="nodrag nopan"
            onPointerDown={e => stopPress(e, () => up({ contentType: ct.v }))}
            onClick={e => e.stopPropagation()}
            style={{
              height: 38,
              border: 0,
              borderRadius: 10,
              background: active ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.06)',
              boxShadow: active ? '0 1px 3px rgba(38,36,52,0.055), inset 0 1px 0 rgba(255,255,255,0.72)' : 'inset 0 1px 0 rgba(255,255,255,0.16)',
              color: active ? BLUE : 'rgba(24,27,35,0.48)',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: LATIN,
              fontSize: 11,
              fontWeight: 680,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <span style={{ width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {ct.icon}
            </span>
            {ct.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusPicker({ data, up }: { data: CardData; up: (p: Partial<CardData>) => void }) {
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState('');
  const presets = CT_STATUS[data.contentType ?? 'note'];
  const pick = (label: string, color: StatusColor) =>
    up(data.status === label ? { status: '', statusColor: undefined } : { status: label, statusColor: color });

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '5px 20px 4px 56px' }}>
      {presets.map(p => {
        const active = data.status === p.label;
        return (
          <button
            key={p.label}
            type="button"
            className="nodrag nopan"
            onPointerDown={e => stopPress(e, () => pick(p.label, p.color))}
            onClick={e => e.stopPropagation()}
            style={{
              height: 30,
              padding: '0 12px',
              border: 0,
              borderRadius: 10,
              background: active ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.06)',
              boxShadow: active ? '0 1px 3px rgba(38,36,52,0.055), inset 0 1px 0 rgba(255,255,255,0.72)' : 'inset 0 1px 0 rgba(255,255,255,0.16)',
              color: active ? INK : 'rgba(24,27,35,0.50)',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: active ? 620 : 510,
            }}
          >
            {p.label}
          </button>
        );
      })}
      {!editing ? (
        <button
          type="button"
          className="nodrag nopan"
          onPointerDown={e => stopPress(e, () => setEditing(true))}
          onClick={e => e.stopPropagation()}
          style={{
            height: 30,
            padding: '0 12px',
            border: 0,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            color: MUTED,
            cursor: 'pointer',
            outline: 'none',
            fontFamily: FONT,
            fontSize: 14,
          }}
        >
          + Custom
        </button>
      ) : (
        <input
          autoFocus
          value={custom}
          className="nodrag nopan"
          onPointerDown={e => e.stopPropagation()}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && custom.trim()) {
              up({ status: custom.trim(), statusColor: 'gray' });
              setCustom('');
              setEditing(false);
            }
            if (e.key === 'Escape') setEditing(false);
          }}
          onBlur={() => { if (!custom.trim()) setEditing(false); }}
          placeholder="Status"
          style={{
            width: 94,
            height: 30,
            boxSizing: 'border-box',
            border: 0,
            borderRadius: 10,
            outline: 'none',
            padding: '0 10px',
            background: HOVER,
            color: INK,
            fontFamily: FONT,
            fontSize: 14,
          }}
        />
      )}
    </div>
  );
}

function selectedType(data: CardData) {
  return CT.find(ct => ct.v === (data.contentType ?? 'note'))?.label ?? 'Note';
}

export function CanvasCardPanel({ nodeId, data, anchorRef, onClose }: Props) {
  const { updateNodeData, deleteElements, fitView } = useReactFlow();
  useViewport();
  const ref = useRef<HTMLDivElement>(null);
  const up = (patch: Partial<CardData>) => updateNodeData(nodeId, patch as Record<string, unknown>);

  const fitContent = () => {
    const raw = String(data.text ?? '').trim();
    const lines = raw ? raw.split('\n').length : 0;
    const len = raw.length;
    const next: CardSize = !raw ? 'S' : (len > 180 || lines > 7) ? 'L' : (len > 70 || lines > 3) ? 'M' : 'S';
    up({ cardSize: next });
  };

  const copyCard = async () => {
    const title = String(data.entityName || data.connectorName || 'Untitled');
    const body = String(data.text || '');
    try {
      await navigator.clipboard?.writeText([title, body].filter(Boolean).join('\n\n'));
    } catch {
      // Clipboard can be blocked in some embedded Electron contexts.
    }
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', h, { capture: true });
    return () => window.removeEventListener('mousedown', h, { capture: true });
  }, [onClose]);

  const anchor = anchorRef.current?.getBoundingClientRect();
  if (!anchor) return null;
  const hasRoomRight = anchor.right + PANEL_GAP + PANEL_WIDTH <= window.innerWidth - PANEL_EDGE;
  const rawLeft = hasRoomRight ? anchor.right + PANEL_GAP : anchor.left - PANEL_WIDTH - PANEL_GAP;
  const left = Math.max(PANEL_EDGE, Math.min(rawLeft, window.innerWidth - PANEL_WIDTH - PANEL_EDGE));
  const rawTop = anchor.top + PANEL_TOP_OFFSET;
  const top = Math.max(16, Math.min(rawTop, window.innerHeight - 120));

  const stateOptions: [string, CardState, string][] = [
    ['Normal', 'normal', BLUE],
    ['Highlight', 'highlight', '#B8861F'],
    ['Fade', 'fade', 'rgba(18,20,24,0.28)'],
  ];

  const panel = (
    <>
      <style>
        {`.gsyen-card-panel-scroll::-webkit-scrollbar{width:4px}.gsyen-card-panel-scroll::-webkit-scrollbar-track{background:transparent}.gsyen-card-panel-scroll::-webkit-scrollbar-thumb{background:rgba(28,32,42,.11);border-radius:999px}.gsyen-card-panel-scroll::-webkit-scrollbar-thumb:hover{background:rgba(28,32,42,.17)}.gsyen-card-panel-scroll::-webkit-scrollbar-button{display:none;width:0;height:0}`}
      </style>
      <div
        ref={ref}
        className="nodrag nopan gsyen-card-panel-scroll"
        onPointerDown={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          left,
          top,
          width: PANEL_WIDTH,
          zIndex: 9999,
          maxHeight: 'calc(100vh - 36px)',
          overflowY: 'auto',
          boxSizing: 'border-box',
          padding: PANEL_PADDING,
          background: PANEL_BG,
          border: PANEL_BORDER,
          borderRadius: PANEL_RADIUS,
          boxShadow: PANEL_SHADOW,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          fontFamily: FONT,
          color: INK,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(28,32,42,.11) transparent',
        }}
      >
      <MenuRow icon={<Minimize size={22} />} label="Fit to content" onPress={fitContent} />
      <MenuRow icon={<FoldVertical size={22} />} label="Fold" shortcut="Cmd+Option+Enter" onPress={() => up({ cardSize: 'S' })} />
      <MenuRow icon={<Maximize2 size={22} />} label="Draw connection">
        <Segment
          compact
          options={[['Solid', 'solid'], ['Dash', 'dashed']]}
          value={data.cardBorder ?? 'solid'}
          onChange={v => up({ cardBorder: v as CardBorder })}
        />
      </MenuRow>
      <Swatches data={data} up={up} />
      <MenuRow icon={<ListTree size={22} />} label="Mindmap">
        <Toggle active={data.cardState === 'highlight'} onChange={next => up({ cardState: next ? 'highlight' : 'normal' })} />
      </MenuRow>

      <Divider />

      <MenuRow icon={<FileText size={22} />} label="Content type">
        <span style={{ color: INK, fontSize: 15, fontWeight: 560 }}>{selectedType(data)}</span>
      </MenuRow>
      <TypePicker data={data} up={up} />
      <MenuRow icon={<Hash size={22} />} label="Status">
        <span style={{ color: INK, fontSize: 15, fontWeight: 560 }}>{data.status || 'Draft'}</span>
      </MenuRow>
      <StatusPicker data={data} up={up} />
      <MenuRow icon={<Square size={22} />} label="Size">
        <Segment
          compact
          options={SIZES.map(s => [s.v, s.v] as [string, string])}
          value={data.cardSize ?? 'S'}
          onChange={v => up({ cardSize: v as CardSize })}
        />
      </MenuRow>

      <MenuRow icon={<Info size={22} />} label="Display state">
        <Segment
          compact
          options={stateOptions.map(([label, val]) => [label, val] as [string, string])}
          value={data.cardState ?? 'normal'}
          onChange={v => up({ cardState: v as CardState })}
        />
      </MenuRow>

      <Divider />

      <MenuRow icon={<Copy size={22} />} label="Copy" shortcut="Cmd+C" active onPress={copyCard} />
      <MenuRow icon={<XSquare size={22} />} label="Remove" shortcut="Del" onPress={() => { deleteElements({ nodes: [{ id: nodeId }] }); onClose(); }} />
      <MenuRow icon={<PanelLeft size={22} />} label="Add to sidebar" shortcut="Opt+Click" />
      <MenuRow icon={<Square size={22} />} label="Open in popup" />
      <MenuRow icon={<ExternalLink size={22} />} label="Open in new tab" shortcut="Cmd+Enter" />

      <Divider />

      <MenuRow icon={<Download size={22} />} label="Export as Markdown" />
      <MenuRow icon={<Download size={22} />} label="Export as PDF">
        <span style={{
          height: 22,
          padding: '0 9px',
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 8,
          background: 'rgba(24,27,35,0.07)',
          color: 'rgba(24,27,35,0.34)',
          fontSize: 12.5,
          fontWeight: 700,
        }}>
          BETA
        </span>
      </MenuRow>

      <Divider />

      <MenuRow icon={<Info size={22} />} label="Show info" shortcut="Option+Shift+I" />
      <MenuRow icon={<History size={22} />} label="Version history" />

      <Divider />

      <MenuRow icon={<LinkIcon size={22} />} label="Copy link" shortcut="Cmd+L" />
      <MenuRow icon={<Hash size={22} />} label="Manage tags" shortcut="Cmd+T" />
      <MenuRow icon={<Map size={22} />} label="Move to" shortcut="Cmd+M" />

      <Divider />

      <MenuRow
        icon={<Trash2 size={22} />}
        label="Delete from card library"
        danger
        onPress={() => { deleteElements({ nodes: [{ id: nodeId }] }); onClose(); }}
      />
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
