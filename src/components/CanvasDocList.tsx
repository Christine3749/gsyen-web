/**
 * CanvasDocList — iA Writer 风格文档列表
 * Header: ← folder + | Sort By Date | items: icon + name + date
 */
import { useState, useCallback } from 'react';
import { useLibraryStore, libraryStore } from '../stores/canvasLibraryStore';
import { fsAdapter } from '../hooks/useFileSystem';
import type { FileEntry } from '../hooks/useFileSystem';
import { SYS_FONT } from './CanvasEditorTypes';
import type { Palette } from './CanvasEditorTypes';
import { DocIcon, DrawIcon, NodeIcon } from '../gsyen-designer';

interface Props { open: boolean; onFileSelect: (e: FileEntry, c: string) => void; P: Palette; }

function relativeDate(ts?: number): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 86_400_000)  return '今天';
  if (diff < 172_800_000) return '昨天';
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function fileIcon(name: string) {
  if (/\.excalidraw$/i.test(name)) return DrawIcon;
  if (/\.canvas$/i.test(name))     return NodeIcon;
  return DocIcon;
}

export function CanvasDocList({ open, onFileSelect, P }: Props) {
  const { selectedFolder, files, selectedFile, loading } = useLibraryStore();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const handleSelect = useCallback(async (file: FileEntry) => {
    libraryStore.setSelectedFile(file);
    const content = await fsAdapter.readFile(file);
    onFileSelect(file, content);
  }, [onFileSelect]);

  const handleNew = useCallback(async () => {
    if (!selectedFolder) return;
    const name = `新文档-${Date.now()}.md`;
    const blank: FileEntry = {
      name,
      path: selectedFolder.path ? `${selectedFolder.path}/${name}` : name,
      isMarkdown: true,
    };
    if (selectedFolder.handle) {
      const fh = await (selectedFolder.handle as any).getFileHandle(name, { create: true });
      const w  = await fh.createWritable(); await w.write(''); await w.close();
      blank.handle = fh;
    }
    onFileSelect(blank, '');
    libraryStore.setSelectedFile(blank);
    await libraryStore.selectFolder(selectedFolder);
  }, [selectedFolder, onFileSelect]);

  return (
    <div style={{ width: open && selectedFolder ? 200 : 0, overflow: 'hidden', flexShrink: 0,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      borderRight: `0.5px solid ${P.border}`, display: 'flex', flexDirection: 'column',
      background: P.chrome }}>
      <div style={{ width: 200, height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Header: ← name + */}
        <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 8px 0 6px', borderBottom: `0.5px solid ${P.border}`, flexShrink: 0 }}>
          <button onClick={() => libraryStore.clearFolder()}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '6px 4px', display: 'flex', alignItems: 'center', color: P.menuFg, flexShrink: 0 }}>
            <svg width="7" height="11" viewBox="0 0 7 11" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 1L1 5.5L6 10" />
            </svg>
          </button>
          <span style={{ flex: 1, fontSize: 12, color: P.fg, fontWeight: 500, fontFamily: SYS_FONT,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedFolder?.name ?? ''}
          </span>
          <button onClick={handleNew}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '4px', fontSize: 20, lineHeight: 1, color: P.menuFg,
              fontFamily: SYS_FONT, flexShrink: 0 }}>+</button>
        </div>

        {/* Sort By Date row */}
        <div style={{ height: 28, display: 'flex', alignItems: 'center', gap: 4,
          padding: '0 12px', borderBottom: `0.5px solid ${P.border}`, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: P.dim, fontFamily: SYS_FONT }}>Sort By Date</span>
          <svg width="7" height="4" viewBox="0 0 7 4" fill="none" stroke={P.dim}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1L3.5 3.5L6 1"/>
          </svg>
        </div>

        {/* File list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '12px', fontSize: 11, color: P.dim, fontFamily: SYS_FONT }}>
              读取中...
            </div>
          )}
          {files.map(file => {
            const active  = selectedFile?.path === file.path;
            const hovered = hoveredPath === file.path;
            return (
              <div key={file.path} onClick={() => handleSelect(file)}
                onMouseEnter={() => setHoveredPath(file.path)}
                onMouseLeave={() => setHoveredPath(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0 10px', height: 36, cursor: 'pointer',
                  borderBottom: `0.5px solid ${P.border}`,
                  borderLeft: active ? '2px solid #55AAFF' : '2px solid transparent',
                  background: active ? `${P.fg}0A` : hovered ? `${P.fg}06` : 'transparent',
                  transition: 'background 0.12s' }}>
                <span style={{ color: active ? P.fg : P.menuFg, display:'flex', flexShrink:0 }}>
                  {(() => { const Icon = fileIcon(file.name); return <Icon />; })()}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: active ? P.fg : P.menuFg,
                  fontWeight: active ? 500 : 400, fontFamily: SYS_FONT,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name.replace(/\.(md|txt)$/i, '')}
                </span>
                <span style={{ fontSize: 10, color: P.dim, fontFamily: SYS_FONT, flexShrink: 0 }}>
                  {relativeDate(file.lastModified)}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
