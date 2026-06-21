import { memo, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { CardData, CardSize, ContentType, StatusColor } from './CanvasCardData';
import { STATUS_COLORS } from './CanvasCardData';
import { CanvasCardPanel } from './CanvasCardPanel';

const SIZE_W: Record<CardSize, number> = { S: 220, M: 300, L: 380 };
const SIZE_H: Record<CardSize, number> = { S: 170, M: 230, L: 320 };
const TITLE_SIZE: Record<CardSize, number> = { S: 15.5, M: 18, L: 22 };
const BODY_SIZE: Record<CardSize, number> = { S: 11.5, M: 13, L: 14.5 };
const EMPTY_BULLETS: Record<CardSize, number> = { S: 3, M: 4, L: 5 };
const HANDLE_NEAR_PX = 36;
const HANDLE_SIZE = 10.4;
const HANDLE_HIT_SIZE = 24;

const SIDES = [
  { pos: Position.Top, id: 't' }, { pos: Position.Right, id: 'r' },
  { pos: Position.Bottom, id: 'b' }, { pos: Position.Left, id: 'l' },
] as const;
type HandleSide = typeof SIDES[number]['id'];

function visualHandlePosition(side: HandleSide, width: number, height: number): CSSProperties {
  const offset = -HANDLE_SIZE / 2;
  const centerX = width / 2 - HANDLE_SIZE / 2;
  const centerY = height / 2 - HANDLE_SIZE / 2;
  if (side === 't') return { top: offset, left: centerX };
  if (side === 'r') return { right: offset, top: centerY };
  if (side === 'b') return { bottom: offset, left: centerX };
  return { left: offset, top: centerY };
}

const ACCENT_HEX: Record<string, { border: string; bg: string; ink: string; muted: string }> = {
  blue:   { border: 'rgba(77, 137, 220, 0.38)', bg: 'rgba(235, 243, 255, 0.96)', ink: '#1F4F8E', muted: 'rgba(31,79,142,0.52)' },
  green:  { border: 'rgba(87, 157, 112, 0.38)', bg: 'rgba(236, 249, 241, 0.96)', ink: '#22663B', muted: 'rgba(34,102,59,0.52)' },
  amber:  { border: 'rgba(188, 150, 57, 0.38)', bg: 'rgba(255, 248, 224, 0.96)', ink: '#795914', muted: 'rgba(121,89,20,0.52)' },
  red:    { border: 'rgba(195, 86, 92, 0.38)', bg: 'rgba(255, 238, 240, 0.96)', ink: '#8C2D32', muted: 'rgba(140,45,50,0.52)' },
  purple: { border: 'rgba(145, 101, 205, 0.38)', bg: 'rgba(244, 237, 255, 0.96)', ink: '#5A3894', muted: 'rgba(90,56,148,0.52)' },
  cyan:   { border: 'rgba(67, 151, 169, 0.38)', bg: 'rgba(235, 249, 252, 0.96)', ink: '#236B78', muted: 'rgba(35,107,120,0.52)' },
  black:  { border: 'rgba(38, 42, 48, 0.28)', bg: 'rgba(248, 248, 249, 0.96)', ink: '#22262E', muted: 'rgba(34,38,46,0.48)' },
};

const SCRINTAL_DEFAULT = {
  border: 'rgba(135, 146, 166, 0.36)',
  bg: 'rgba(237, 240, 246, 0.96)',
  ink: '#20232B',
  muted: 'rgba(62, 70, 86, 0.48)',
};

const CT_LABEL: Record<ContentType, string> = {
  note: 'note', code: 'code', image: 'image', link: 'link',
  task: 'task', table: 'table', math: 'math', quote: 'quote',
};

const UI_FONT = '"HarmonyOS Sans SC","HarmonyOS Sans","Inter","PingFang SC","Microsoft YaHei UI",system-ui,sans-serif';
const LATIN_FONT = '"Inter","HarmonyOS Sans",system-ui,sans-serif';

export interface SolidCardProps { id: string; data: CardData; selected: boolean }

function normalizeContentType(data: CardData): ContentType {
  const raw = String(data.contentType ?? data.entitySub ?? 'note').toLowerCase();
  return (raw in CT_LABEL ? raw : 'note') as ContentType;
}

function renderLines(text: string, fontSize: number, muted: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  return lines.map((line, i) => {
    const bullet = /^[-*]\s+/.test(line);
    const ordered = /^\d+[.)]\s+/.test(line);
    const heading = /^#{1,3}\s+/.test(line);
    const clean = line.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, '').replace(/^#{1,3}\s+/, '');
    if (heading) {
      return <div key={i} style={{ margin: i ? '7px 0 4px' : '0 0 4px', fontSize, fontWeight: 700, color: 'rgba(24,28,38,0.86)' }}>{clean}</div>;
    }
    return (
      <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: i ? 4 : 0, color: 'rgba(34,39,52,0.72)' }}>
        {(bullet || ordered) && <span style={{ width: 3.5, height: 3.5, marginTop: fontSize * 0.58, borderRadius: '50%', background: muted, flexShrink: 0 }} />}
        <span>{clean}</span>
      </div>
    );
  });
}

function splitDashedLeadHeading(text: string) {
  const lines = text.split('\n');
  const idx = lines.findIndex(line => line.trim().length > 0);
  if (idx < 0) return { leadHeading: null as string | null, bodyText: text };

  const first = lines[idx].trim();
  if (!/^#{1,3}\s+/.test(first)) return { leadHeading: null as string | null, bodyText: text };

  const leadHeading = first.replace(/^#{1,3}\s+/, '');
  const rest = [...lines.slice(0, idx), ...lines.slice(idx + 1)].join('\n');
  return { leadHeading, bodyText: rest };
}

function cleanTag(value: unknown) {
  return String(value ?? '').trim().replace(/^#+/, '');
}

function buildHeaderTags(data: CardData, contentType: ContentType, status: string) {
  const rawTags = Array.isArray(data.tags)
    ? data.tags
    : typeof data.tag === 'string'
      ? data.tag.split(/[,\s#]+/)
      : [];
  const blocked = new Set([contentType, 'board', status].map(v => cleanTag(v).toLowerCase()));
  const extra = rawTags
    .map(cleanTag)
    .filter(tag => tag && !blocked.has(tag.toLowerCase()));

  return [`#${CT_LABEL[contentType]} board`, ...extra.map(tag => `#${tag}`)].join(' ');
}

export const CanvasCardSolid = memo(({ id, data: d, selected }: SolidCardProps) => {
  const { updateNodeData } = useReactFlow();
  const sz: CardSize = d.cardSize ?? 'S';
  const [hovered, setHovered] = useState(false);
  const [activeHandleSide, setActiveHandleSide] = useState<HandleSide | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const rawTitle = String(d.entityName || d.connectorName || '').trim();
  const title = rawTitle || '未命名';
  const hasExplicitTitle = rawTitle.length > 0;
  const text = typeof d.text === 'string' ? d.text : '';
  const [titleDraft, setTitleDraft] = useState(title);
  const [bodyDraft, setBodyDraft] = useState(text);

  useEffect(() => { if (!editingTitle) setTitleDraft(title); }, [editingTitle, title]);
  useEffect(() => { if (!editingBody) setBodyDraft(text); }, [editingBody, text]);

  const openPanel = (e: MouseEvent) => {
    e.stopPropagation();
    setPanelOpen(true);
  };

  const updateActiveHandleSide = (e: MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const distances: Array<{ side: HandleSide; value: number }> = [
      { side: 't', value: y },
      { side: 'r', value: rect.width - x },
      { side: 'b', value: rect.height - y },
      { side: 'l', value: x },
    ];
    const nearest = distances.sort((a, b) => a.value - b.value)[0];
    setActiveHandleSide(nearest.value <= HANDLE_NEAR_PX ? nearest.side : null);
  };

  const commitTitle = () => {
    setEditingTitle(false);
    const next = titleDraft.trim();
    if (next !== (d.entityName ?? '')) updateNodeData(id, { cardType: 'solid', entityName: next });
  };

  const commitBody = () => {
    setEditingBody(false);
    if (bodyDraft !== text) updateNodeData(id, { cardType: 'solid', text: bodyDraft });
  };

  const onTitleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitTitle();
    if (e.key === 'Escape') { setTitleDraft(title); setEditingTitle(false); }
  };

  const onBodyKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') { setBodyDraft(text); setEditingBody(false); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') commitBody();
  };

  const contentType = normalizeContentType(d);
  const tone = d.cardAccent ? ACCENT_HEX[d.cardAccent] : SCRINTAL_DEFAULT;
  const isDashed = d.cardBorder === 'dashed';
  const isFrosted = d.cardOpacity === 'frosted';
  const isFade = d.cardState === 'fade';
  const isHighlight = d.cardState === 'highlight';
  const isFloat = d.cardElevation === 'float';
  const isLoose = d.cardDensity === 'loose';
  const cornerR = d.cardCorner === 'none' ? 4 : 6;
  const statusColor = (STATUS_COLORS[(d.statusColor ?? 'gray') as StatusColor] ? (d.statusColor ?? 'gray') : 'gray') as StatusColor;
  const status = d.status || '草稿';
  const statusTone = STATUS_COLORS[statusColor];
  const headerTags = buildHeaderTags(d, contentType, status);
  const showActions = hovered || selected || panelOpen;

  const padX = isLoose ? 17 : 14;
  const padY = isLoose ? 15 : 12;
  const titleSize = TITLE_SIZE[sz];
  const bodySize = BODY_SIZE[sz];
  const borderColor = isHighlight ? 'rgba(185, 134, 32, 0.46)' : tone.border;
  const actionColor = panelOpen ? tone.ink : tone.muted;
  const actionRing = panelOpen ? `0 0 0 2px ${tone.border}` : '0 4px 9px rgba(53,39,78,0.055)';
  const cardBg = isDashed ? SCRINTAL_DEFAULT.bg : tone.bg;
  const headerBg = isDashed ? tone.bg : undefined;
  const dashedSplit = isDashed && !editingBody ? splitDashedLeadHeading(text) : { leadHeading: null, bodyText: text };
  const displayText = dashedSplit.bodyText;
  const displayHasBody = displayText.trim().length > 0;
  const shadow = selected
    ? '0 5px 12px rgba(53,39,78,0.085), 0 1px 2px rgba(53,39,78,0.05)'
    : (hovered || isFloat)
      ? '0 5px 12px rgba(53,39,78,0.08), 0 1px 2px rgba(53,39,78,0.05)'
      : '0 3px 8px rgba(53,39,78,0.06), 0 1px 2px rgba(53,39,78,0.035)';

  return (
    <div style={{ position: 'relative', opacity: isFade ? 0.42 : 1, transition: 'opacity 0.16s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={updateActiveHandleSide}
      onMouseLeave={() => { setHovered(false); setActiveHandleSide(null); }}>

      {panelOpen && (
        <CanvasCardPanel nodeId={id} data={{ ...d, cardType: 'solid', contentType }} anchorRef={cardRef}
          onClose={() => setPanelOpen(false)} />
      )}

      <div ref={cardRef} style={{
        position: 'relative', width: SIZE_W[sz], height: SIZE_H[sz], overflow: 'hidden', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', padding: `${padY}px ${padX}px 10px`,
        background: isFrosted ? `${cardBg.replace('0.96', '0.74')}` : cardBg,
        backdropFilter: isFrosted ? 'blur(18px)' : undefined,
        WebkitBackdropFilter: isFrosted ? 'blur(18px)' : undefined,
        border: `1.5px ${isDashed ? 'dashed' : 'solid'} ${borderColor}`,
        backgroundClip: 'padding-box',
        borderRadius: cornerR, boxShadow: shadow,
        transition: 'box-shadow 0.14s, border-color 0.14s, background 0.14s, opacity 0.14s',
        outline: isHighlight ? '2px solid rgba(185,134,32,0.16)' : 'none', outlineOffset: 2,
        fontFamily: UI_FONT,
      }}>
        <button onClick={openPanel} className="nodrag nopan" aria-label="Card options"
          style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: panelOpen ? 'rgba(255,255,255,0.66)' : 'rgba(255,255,255,0.36)',
            border: '1px solid rgba(72,61,88,0.12)', borderRadius: 7, cursor: 'pointer', padding: 0, outline: 'none',
            boxShadow: actionRing,
            color: actionColor,
            opacity: showActions ? 0.95 : 0, pointerEvents: showActions ? 'auto' : 'none', zIndex: 3,
            transition: 'opacity 0.1s, background 0.12s, color 0.12s, box-shadow 0.12s' }}>
          <svg width="13" height="4" viewBox="0 0 13 4" fill="currentColor">
            <circle cx="2" cy="2" r="1.55"/><circle cx="6.5" cy="2" r="1.55"/><circle cx="11" cy="2" r="1.55"/>
          </svg>
        </button>

        <div style={{
          margin: headerBg ? `-${padY}px -${padX}px 0` : undefined,
          padding: headerBg ? `${padY}px ${padX}px 10px` : undefined,
          background: headerBg ? (isFrosted ? headerBg.replace('0.96', '0.74') : headerBg) : undefined,
          borderBottom: headerBg ? `1px solid ${tone.border}` : undefined,
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ paddingRight: 30 }}>
            {editingTitle ? (
              <input autoFocus value={titleDraft} className="nodrag nopan"
                onChange={e => setTitleDraft(e.target.value)} onBlur={commitTitle} onKeyDown={onTitleKey}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent',
                  padding: 0, fontFamily: UI_FONT, fontSize: titleSize, fontWeight: 720,
                  lineHeight: 1.18, color: tone.ink }} />
            ) : (
              <div onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); }}
                style={{ fontSize: titleSize, fontWeight: hasExplicitTitle ? 720 : 680, lineHeight: 1.18,
                  color: hasExplicitTitle ? tone.ink : 'rgba(32,35,43,0.74)', letterSpacing: 0, overflowWrap: 'anywhere' }}>
                {title}
              </div>
            )}
          </div>

          <div style={{ marginTop: 8, fontFamily: LATIN_FONT, fontSize: 9.5, lineHeight: 1.25,
            color: tone.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {headerTags}
          </div>

          {dashedSplit.leadHeading && (
            <div style={{ marginTop: 13, fontSize: bodySize, fontWeight: 700, color: 'rgba(24,28,38,0.86)' }}>
              {dashedSplit.leadHeading}
            </div>
          )}
        </div>

        <div onDoubleClick={e => { e.stopPropagation(); setEditingBody(true); }}
          style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden', marginTop: dashedSplit.leadHeading ? 0 : 13,
            fontSize: bodySize, lineHeight: 1.42, color: 'rgba(34,39,52,0.72)', position: 'relative', zIndex: 1 }}>
          {editingBody ? (
            <textarea autoFocus value={bodyDraft} className="nodrag nopan"
              onChange={e => setBodyDraft(e.target.value)} onBlur={commitBody} onKeyDown={onBodyKey}
              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none',
                background: 'transparent', padding: 0, fontFamily: UI_FONT, fontSize: bodySize,
                lineHeight: 1.42, color: 'rgba(34,39,52,0.78)' }} />
          ) : displayHasBody ? (
            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{renderLines(displayText, bodySize, tone.muted)}</div>
          ) : (
            <div aria-hidden>
              <div style={{ marginBottom: 6, fontSize: bodySize, fontWeight: 720, color: 'rgba(32,35,43,0.48)' }}>Schedule</div>
              {Array.from({ length: EMPTY_BULLETS[sz] }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 5 }}>
                  <span style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: 'rgba(32,35,43,0.25)', flexShrink: 0 }} />
                  <span style={{ width: `${68 - i * 10}%`, height: 6, borderRadius: 3, background: 'rgba(32,35,43,0.055)' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 10, flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 7,
          fontFamily: LATIN_FONT, color: 'rgba(54,60,74,0.48)', fontSize: 10.5, lineHeight: 1, position: 'relative', zIndex: 1 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: d.status ? statusTone.fg : 'rgba(54,60,74,0.32)', opacity: 0.58 }} />
          <span>{status}</span>
          <span style={{ opacity: 0.45 }}>·</span>
          <span>edited</span>
        </div>
      </div>

      {SIDES.map(({ id: hid }) => {
        const active = activeHandleSide === hid;
        return (
          <span key={`visual-${hid}`} aria-hidden
            style={{
              ...visualHandlePosition(hid, SIZE_W[sz], SIZE_H[sz]),
              position: 'absolute',
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              borderRadius: '50%',
              background: tone.muted,
              border: '2px solid rgba(255,255,255,0.78)',
              boxSizing: 'border-box',
              opacity: active ? 0.72 : 0,
              scale: active ? 1.04 : 0.92,
              boxShadow: active
                ? '0 1px 5px rgba(47,37,71,0.10), 0 0 0 1px rgba(255,255,255,0.26)'
                : '0 1px 3px rgba(47,37,71,0.06)',
              pointerEvents: 'none',
              zIndex: 4,
              transition: 'opacity 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, scale 0.18s ease',
            }} />
        );
      })}
      {SIDES.map(({ pos, id: hid }) => (
        <Handle key={hid} className="gsyen-side-aware-handle" id={`src-${hid}`} type="source" position={pos}
          style={{
            opacity: 0,
            width: HANDLE_HIT_SIZE,
            height: HANDLE_HIT_SIZE,
            background: 'transparent',
            border: 'none',
          }} />
      ))}
      {SIDES.map(({ pos, id: hid }) => (
        <Handle key={`t-${hid}`} id={`tgt-${hid}`} type="target" position={pos}
          style={{ opacity: 0, width: HANDLE_HIT_SIZE, height: HANDLE_HIT_SIZE, background: 'transparent', border: 'none' }} />
      ))}
    </div>
  );
});

CanvasCardSolid.displayName = 'CanvasCardSolid';
