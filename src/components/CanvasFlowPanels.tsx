import { useEffect } from 'react';
import { Panel, useReactFlow, useViewport } from '@xyflow/react';

/* ── Zoom / fit controls (top-right) ── */
export function CanvasRightControls({ dark }: { dark: boolean }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const bg  = dark ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)';
  const bdr = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const ic  = dark ? '#888' : '#666';

  const btn = (onClick: () => void, title: string, svg: React.ReactNode) => (
    <button title={title} onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.65'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      style={{
        width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: bg, border: `0.5px solid ${bdr}`, borderRadius: 7, cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)', color: ic, transition: 'opacity 0.12s',
      }}>{svg}</button>
  );

  return (
    <Panel position="top-right" style={{ display: 'flex', flexDirection: 'column', gap: 5, margin: '14px 14px 0 0' }}>
      {btn(() => zoomIn({ duration: 200 }), 'Zoom In',
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="6.5" y1="2" x2="6.5" y2="11"/><line x1="2" y1="6.5" x2="11" y2="6.5"/></svg>)}
      {btn(() => fitView({ duration: 300, padding: 0.15 }), 'Fit View',
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M1.5 4V1.5H4M9 1.5h2.5V4M11.5 9v2.5H9M4 11.5H1.5V9"/></svg>)}
      {btn(() => zoomOut({ duration: 200 }), 'Zoom Out',
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="2" y1="6.5" x2="11" y2="6.5"/></svg>)}
    </Panel>
  );
}

/* ── Bottom hint: H key + double-click tip ── */
export function CanvasHint({ dark }: { dark: boolean }) {
  const { fitView } = useReactFlow();
  const { x, y, zoom } = useViewport();
  const hasMoved = Math.abs(x) > 30 || Math.abs(y) > 30 || Math.abs(zoom - 1) > 0.08;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'h' && e.key !== 'H') return;
      if (['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement).tagName)) return;
      fitView({ duration: 350, padding: 0.15 });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fitView]);

  const txt: React.CSSProperties = {
    fontSize: 11, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em',
    color: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)',
    transition: 'opacity 0.3s',
  };
  const kbd: React.CSSProperties = {
    padding: '1px 5px', borderRadius: 4, fontSize: 10,
    background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    border: dark ? '0.5px solid rgba(255,255,255,0.14)' : '0.5px solid rgba(0,0,0,0.14)',
  };

  return (
    <Panel position="bottom-center" style={{ pointerEvents: 'none', textAlign: 'center', paddingBottom: 16 }}>
      {hasMoved && (
        <div style={{ ...txt, marginBottom: 5 }}>
          按 <kbd style={kbd}>H</kbd> 回到中心
        </div>
      )}
      <div style={txt}>右键新建卡片 · 双击新建文本卡</div>
    </Panel>
  );
}
