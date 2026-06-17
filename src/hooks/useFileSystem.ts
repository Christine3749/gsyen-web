/**
 * useFileSystem — Web (File System Access API) / Electron (fs IPC) 统一抽象层
 * 上层组件只调用 fsAdapter，平台差异完全隔离在此文件内。
 *
 * Electron 文件夹选择：用 <input webkitdirectory> 原生控件，不走 IPC，
 * 彻底规避 dialog.showOpenDialog 在 file:// 协议下的兼容问题。
 * 文件读写仍走 IPC（main.cjs fs:readFile / fs:writeFile）。
 */

export interface FileEntry {
  name:          string;
  path:          string;
  handle?:       FileSystemFileHandle; // Web FSA
  isMarkdown:    boolean;
  lastModified?: number;
}

export interface FolderSource {
  id:      string;                      // Electron = path; Web = name+ts
  name:    string;
  path?:   string;                      // Electron 绝对路径
  handle?: FileSystemDirectoryHandle;   // Web FSA
  env:     'web' | 'electron';
}

const _isElectron = !!(window as any).electronAPI?.isElectron;

// ── Web: File System Access API ───────────────────────────────────────────────

async function _webPickFolder(): Promise<FolderSource | null> {
  if (!('showDirectoryPicker' in window)) {
    alert('此浏览器不支持 File System Access API，请改用 Chrome 或 Edge。');
    return null;
  }
  try {
    const h = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    return { id: `web_${h.name}_${Date.now()}`, name: h.name, handle: h, env: 'web' };
  } catch { return null; }
}

async function _webReadDir(src: FolderSource): Promise<FileEntry[]> {
  if (!src.handle) return [];
  const out: FileEntry[] = [];
  for await (const [name, h] of (src.handle as any).entries()) {
    if (h.kind !== 'file') continue;
    if (!/\.(md|txt|excalidraw|canvas)$/i.test(name)) continue;
    const f = await h.getFile();
    out.push({ name, path: name, handle: h, isMarkdown: /\.md$/i.test(name), lastModified: f.lastModified });
  }
  return out.sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0));
}

async function _webReadFile(e: FileEntry): Promise<string> {
  if (!e.handle) return '';
  return (await (e.handle as FileSystemFileHandle).getFile()).text();
}

async function _webWriteFile(e: FileEntry, content: string): Promise<void> {
  if (!e.handle) return;
  const w = await (e.handle as any).createWritable();
  await w.write(content); await w.close();
}

// ── Electron: dialog.showOpenDialog IPC 选文件夹 ─────────────────────────────
// 走主进程 dialog，弹出原生 "Select Folder" 对话框（非 Upload）。

async function _elPickFolderViaDialog(): Promise<FolderSource | null> {
  const api = (window as any).electronAPI;
  try {
    const r = await api?.showOpenDialog?.({ properties: ['openDirectory'] });
    if (!r || r.canceled || !r.filePaths?.[0]) return null;
    const p = r.filePaths[0];
    const name = p.split(/[\\/]/).pop() ?? p;
    return { id: p, name, path: p, env: 'electron' };
  } catch (e) {
    console.error('[fsAdapter] showOpenDialog IPC error:', e);
    return null;
  }
}

async function _elReadDir(src: FolderSource): Promise<FileEntry[]> {
  const api = (window as any).electronAPI;
  if (!src.path) return [];
  try {
    const entries: { name: string; lastModified: number; isDir: boolean }[] =
      await api?.readDir?.(src.path) ?? [];
    return entries
      .filter(e => !e.isDir && /\.(md|txt|excalidraw|canvas)$/i.test(e.name))
      .map(e => ({
        name: e.name,
        path: `${src.path}/${e.name}`,
        isMarkdown: /\.md$/i.test(e.name),
        lastModified: e.lastModified,
      }))
      .sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0));
  } catch { return []; }
}

async function _elReadFile(e: FileEntry): Promise<string> {
  if (!e.path) return '';
  try {
    // 优先用 fetch file:// URL（无需 IPC）
    const url = 'file:///' + e.path.replace(/\\/g, '/');
    const r = await fetch(url);
    if (r.ok) return r.text();
  } catch {}
  // 回退到 IPC
  return (window as any).electronAPI?.readFile?.(e.path) ?? '';
}

async function _elWriteFile(e: FileEntry, content: string): Promise<void> {
  if (!e.path) return;
  await (window as any).electronAPI?.writeFile?.(e.path, content);
}

// ── 统一接口 ──────────────────────────────────────────────────────────────────

export const fsAdapter = {
  env:        _isElectron ? 'electron' : 'web' as 'electron' | 'web',
  pickFolder: _isElectron ? _elPickFolderViaDialog : _webPickFolder,
  readDir:    _isElectron ? _elReadDir            : _webReadDir,
  readFile:   _isElectron ? _elReadFile           : _webReadFile,
  writeFile:  _isElectron ? _elWriteFile          : _webWriteFile,
};
