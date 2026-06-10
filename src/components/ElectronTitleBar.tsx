import React from 'react';

const isElectron = !!(window as any).electronAPI?.isElectron;

const MinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <line x1="2" y1="5.5" x2="9" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const MaxIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <line x1="2" y1="2" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="2" x2="2" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function ElectronTitleBar() {
  if (!isElectron) return null;

  const { minimize, maximize, close } = (window as any).electronAPI.window;
  const idle = 'rgba(0,0,0,0.18)';

  const btn = (Icon: React.FC, onClick: () => void, danger = false) => (
    <button onClick={onClick}
      style={{
        width: 40, height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: idle, background: 'transparent', border: 'none',
        cursor: 'pointer', transition: 'background 0.18s, color 0.18s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = danger ? '#C42B1C' : 'rgba(0,0,0,0.07)';
        el.style.color = danger ? '#FFFFFF' : 'rgba(0,0,0,0.75)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = idle;
      }}>
      <Icon />
    </button>
  );

  return (
    <div className="w-full flex items-center justify-end bg-[#F9F8F6]"
      style={{ height: 28, WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex items-stretch h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {btn(MinIcon, minimize)}
        {btn(MaxIcon, maximize)}
        {btn(CloseIcon, close, true)}
      </div>
    </div>
  );
}
