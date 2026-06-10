/**
 * CanvasMenuBar — iA Writer 风格双行标题栏
 * 上行：居中文件名 + Electron 窗口控制
 * 下行：File Edit Format Focus Authors View Help + ▷
 */
import { useState, useEffect } from 'react';

type EditorMode = 'write' | 'preview' | 'split';

interface Props {
  title:    string;
  onTitle:  (t: string) => void;
  dark:     boolean;
  onDark:   () => void;
  focus:    boolean;
  onFocus:  () => void;
  tw:       boolean;
  onTw:     () => void;
  mode:     EditorMode;
  onMode:   (m: EditorMode) => void;
  onImport: () => void;
  onExport: () => void;
  onClose:  () => void;
  onWrap:   (b: string, a: string) => void;
}

const MONO = '"iA Writer Mono","Courier New","Consolas",monospace';
const isEl = () => !!(window as any).electronAPI?.isElectron;

export function CanvasMenuBar({ title, onTitle, dark, onDark, focus, onFocus, tw, onTw, mode, onMode, onImport, onExport, onClose, onWrap }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const fg   = dark ? 'rgba(255,255,255,1.0)'  : 'rgba(26,26,26,1.0)';
  const dim  = dark ? 'rgba(255,255,255,0.72)' : 'rgba(26,26,26,0.65)';
  const bdr  = dark ? '#2A2A2A' : '#D8D8D8';
  const bg   = dark ? '#1A1A1A' : '#FFFFFF';
  const mBg  = dark ? '#242424' : '#F5F5F5';
  const hvr  = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const wFg  = dark ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,26,0.45)';
  const wBdr = dark ? 'rgba(255,255,255,0.15)' : 'rgba(26,26,26,0.15)';
  const wBg  = dark ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,26,0.04)';

  useEffect(() => {
    const close = () => setOpen(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const toggle = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setOpen(o => o === name ? null : name);
  };

  const Item = ({ label, shortcut, onClick, check, disabled, arrow }: {
    label: string; shortcut?: string; onClick?: () => void;
    check?: boolean; disabled?: boolean; arrow?: boolean;
  }) => (
    <div onClick={e => { e.stopPropagation(); if (!disabled && onClick) { onClick(); setOpen(null); } }}
      style={{ padding: '7px 16px', fontSize: '13px', fontFamily: MONO,
        color: disabled ? (dark ? 'rgba(255,255,255,0.25)' : 'rgba(26,26,26,0.25)') : fg,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = hvr; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        {check !== undefined && <span style={{ width: 14, color: '#4488CC', fontSize: 12 }}>{check ? '✓' : ''}</span>}
        {label}
      </span>
      <span style={{ fontSize: 11, color: dim, whiteSpace: 'nowrap' }}>{arrow ? '›' : (shortcut ?? '')}</span>
    </div>
  );

  const Sep = () => <div style={{ margin: '4px 0', borderTop: `1px solid ${bdr}` }} />;

  const fullscreen = () => {
    if (isEl()) (window as any).electronAPI.window.fullscreen();
    // web 版不做全屏（防止浏览器强占全屏）
  };

  const MENUS: Record<string, React.ReactNode> = {
    File: <>
      <Item label="新建"           shortcut="Ctrl+N"       onClick={() => {}} />
      <Item label="打开本地文件"   shortcut="Ctrl+O"       onClick={onImport} />
      <Sep />
      <Item label="保存"           shortcut="Ctrl+S"       onClick={() => {}} />
      <Item label="导出 Markdown"  arrow                   onClick={onExport} />
      <Sep />
      <Item label="关闭编辑器"     shortcut="Esc"          onClick={onClose} />
    </>,
    Edit: <>
      <Item label="撤销"   shortcut="Ctrl+Z" onClick={() => document.execCommand('undo')} />
      <Item label="重做"   shortcut="Ctrl+Y" onClick={() => document.execCommand('redo')} />
      <Sep />
      <Item label="剪切"   shortcut="Ctrl+X" onClick={() => document.execCommand('cut')} />
      <Item label="复制"   shortcut="Ctrl+C" onClick={() => document.execCommand('copy')} />
      <Item label="粘贴"   shortcut="Ctrl+V" onClick={() => document.execCommand('paste')} />
      <Sep />
      <Item label="全选"   shortcut="Ctrl+A" onClick={() => document.execCommand('selectAll')} />
    </>,
    Format: <>
      <Item label="标题 1" shortcut="Ctrl+1" onClick={() => onWrap('# ', '')} />
      <Item label="标题 2" shortcut="Ctrl+2" onClick={() => onWrap('## ', '')} />
      <Item label="标题 3" shortcut="Ctrl+3" onClick={() => onWrap('### ', '')} />
      <Sep />
      <Item label="加粗"   shortcut="Ctrl+B" onClick={() => onWrap('**', '**')} />
      <Item label="斜体"   shortcut="Ctrl+I" onClick={() => onWrap('_', '_')} />
      <Item label="行内代码" shortcut="Ctrl+K" onClick={() => onWrap('`', '`')} />
      <Sep />
      <Item label="无序列表" onClick={() => onWrap('- ', '')} />
      <Item label="有序列表" onClick={() => onWrap('1. ', '')} />
      <Item label="引用块"   onClick={() => onWrap('> ', '')} />
    </>,
    Focus: <>
      <Item label="专注模式"   check={focus} onClick={onFocus} />
      <Item label="打字机模式" check={tw}    onClick={onTw} />
    </>,
    Authors: <>
      <Item label="AI 助手" disabled />
    </>,
    View: <>
      <Item label="全屏"       shortcut="F11"         onClick={fullscreen} />
      <Item label="深色模式"   check={dark}           onClick={onDark} />
      <Sep />
      <Item label="分屏预览"   check={mode === 'split'} shortcut="Ctrl+Shift+P"
        onClick={() => onMode(mode === 'split' ? 'write' : 'split')} />
    </>,
    Help: <>
      <Item label="键盘快捷键" disabled />
      <Sep />
      <Item label="关于 CANVAS" disabled />
    </>,
  };

  return (
    <div style={{ background: bg, borderBottom: `1px solid ${bdr}`, fontFamily: MONO, userSelect: 'none' }}>
      {/* 上行：标题 + 窗口控制 */}
      <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', borderBottom: `1px solid ${bdr}` }}>
        <input value={title} onChange={e => onTitle(e.target.value)} placeholder="无标题" maxLength={80}
          style={{ background: 'transparent', border: 'none', outline: 'none', textAlign: 'center',
            fontFamily: MONO, fontSize: '13px', fontWeight: 600, color: fg, width: 320 }} />
        {isEl() && (
          <div style={{ position: 'absolute', right: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            {(['—', '□', '×'] as const).map((c, i) => (
              <div key={i}
                onClick={() => { const w = (window as any).electronAPI?.window; [w?.minimize, w?.maximize, w?.close][i]?.(); }}
                style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: c === '□' ? '11px' : '13px', lineHeight: '1', color: wFg,
                  border: `1px solid ${wBdr}`, background: wBg, cursor: 'pointer' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = hvr; el.style.color = fg; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = wBg; el.style.color = wFg; }}
              >{c}</div>
            ))}
          </div>
        )}
      </div>

      {/* 下行：菜单 + ▷ */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
        {Object.keys(MENUS).map(name => (
          <div key={name} style={{ position: 'relative' }}>
            <div onClick={e => toggle(name, e)}
              style={{ padding: '0 11px', height: 36, display: 'flex', alignItems: 'center',
                fontSize: '13px', cursor: 'pointer',
                color: open === name ? fg : dim,
                background: open === name ? hvr : 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hvr; }}
              onMouseLeave={e => { if (open !== name) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >{name}</div>
            {open === name && (
              <div onClick={e => e.stopPropagation()}
                style={{ position: 'absolute', top: 36, left: 0, minWidth: 210, background: mBg,
                  border: `1px solid ${bdr}`, borderRadius: 6, padding: '4px 0',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.45)', zIndex: 200 }}>
                {MENUS[name]}
              </div>
            )}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', paddingRight: 12 }}>
          <div onClick={() => onMode(mode === 'split' ? 'write' : 'split')}
            style={{ fontSize: 14, color: mode === 'split' ? fg : dim, cursor: 'pointer', padding: '4px 8px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = fg; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = mode === 'split' ? fg : dim; }}
          >▷</div>
        </div>
      </div>
    </div>
  );
}
