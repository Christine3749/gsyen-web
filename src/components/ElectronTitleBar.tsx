import React from 'react';

const isElectron = !!(window as any).electronAPI?.isElectron;

export default function ElectronTitleBar() {
  if (!isElectron) return null;

  const { minimize, maximize, close } = (window as any).electronAPI.window;

  return (
    <div
      className="w-full flex items-center justify-end bg-[#F9F8F6]"
      style={{ height: 28, WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className="flex items-stretch h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={minimize}
          className="w-10 h-full flex items-center justify-center text-[#1A1A1A]/35 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/6 transition-colors text-[12px] select-none"
        >―</button>
        <button
          onClick={maximize}
          className="w-10 h-full flex items-center justify-center text-[#1A1A1A]/35 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/6 transition-colors text-[10px] select-none"
        >□</button>
        <button
          onClick={close}
          className="w-10 h-full flex items-center justify-center text-[#1A1A1A]/35 hover:text-white hover:bg-[#CC3333] transition-colors text-[14px] select-none"
        >×</button>
      </div>
    </div>
  );
}
