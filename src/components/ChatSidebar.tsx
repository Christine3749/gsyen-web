/**
 * ChatSidebar — 往来会话列表侧栏
 * 从 ChatModule.tsx 拆出（保持核心壳文件精简、稳定）。
 * 底部状态栏：平时显示存储状态，有更新时切换为更新提示。
 */
import { useState, useEffect } from 'react';
import { MessageSquare, Terminal, X, Download } from 'lucide-react';
import { StoredSession } from '../types/chat';

interface ChatSidebarProps {
  lang: 'zh' | 'en';
  open: boolean;
  recentsOpen: boolean;
  setRecentsOpen: (fn: (o: boolean) => boolean) => void;
  sessions: StoredSession[];
  currentSessionId: string | null;
  loadSession: (s: StoredSession) => void;
  deleteSession: (id: string) => void;
}

export function ChatSidebar({
  lang, open, recentsOpen, setRecentsOpen,
  sessions, currentSessionId, loadSession, deleteSession,
}: ChatSidebarProps) {
  const updaterApi = (window as any).electronAPI?.updater;
  const [updateReady,    setUpdateReady]    = useState(false);
  const [updateVersion,  setUpdateVersion]  = useState('');
  const [downloading,    setDownloading]    = useState(false);
  const [downloadPct,    setDownloadPct]    = useState(0);

  useEffect(() => {
    if (!updaterApi) return;
    updaterApi.onAvailable((info: any) => {
      setUpdateVersion(info.version ?? '');
      setDownloading(true);
    });
    updaterApi.onProgress((p: any) => {
      setDownloadPct(Math.round(p.percent ?? 0));
    });
    updaterApi.onDownloaded((info: any) => {
      setUpdateVersion(info.version ?? '');
      setDownloading(false);
      setUpdateReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside className={`bg-[#F4F2EE] border-[#1A1A1A]/10 flex flex-col justify-between transition-all duration-300 overflow-hidden shrink-0 ${open ? 'w-full md:w-[320px] p-6 border-r opacity-100' : 'w-0 p-0 border-r-0 opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col h-full min-w-[272px] gap-4">
        <button onClick={() => setRecentsOpen(o => !o)} className="flex items-center justify-between w-full group">
          <h2 className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#1A1A1A]/70 group-hover:text-[#1A1A1A] transition-colors">
            {lang === 'zh' ? '往来' : 'Recents'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono text-[#1A1A1A]/25">{sessions.length}</span>
            <span className={`text-[#1A1A1A]/30 text-[10px] transition-transform duration-200 ${recentsOpen ? 'rotate-90' : ''}`}>›</span>
          </div>
        </button>

        <div className={`overflow-y-auto space-y-1.5 pr-0.5 transition-all duration-200 ${recentsOpen ? 'flex-1' : 'hidden'}`}>
          {sessions.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <MessageSquare className="w-6 h-6 text-[#1A1A1A]/15 mx-auto" />
              <p className="text-[9px] font-mono text-[#1A1A1A]/30 uppercase tracking-widest">{lang === 'zh' ? '暂无记录' : 'No history yet'}</p>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} onClick={() => loadSession(s)}
              className={`group relative flex items-start gap-2.5 p-3 border cursor-pointer transition-all ${currentSessionId === s.id ? 'border-[#1A1A1A]/30 bg-white shadow-xs' : 'border-transparent hover:border-[#1A1A1A]/10 hover:bg-white/60'}`}>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[11px] font-sans text-[#1A1A1A]/80 leading-snug line-clamp-2">{s.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-[#1A1A1A]/30 uppercase">{new Date(s.updatedAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="text-[8px] font-mono text-[#1A1A1A]/25 uppercase">{s.model}</span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 hover:text-red-500 text-[#1A1A1A]/30 transition-all">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* 底部状态栏：空闲 → 下载中 → 就绪 */}
        {updateReady ? (
          /* ── 就绪：黑底，点击重启 ── */
          <div className="space-y-2.5 bg-[#1A1A1A] p-3.5 border border-[#1A1A1A] font-mono text-[9px] uppercase tracking-wider shadow-xs shrink-0">
            <div className="inline-flex items-center gap-1.5 text-white/80 font-bold">
              <Download className="w-3 h-3" />
              {updateVersion ? `v${updateVersion} READY` : 'UPDATE READY'}
            </div>
            <p className="text-[8px] text-white/50 leading-normal normal-case tracking-normal">
              {lang === 'zh' ? '新版本已下载完成，重启即可安装。' : 'New version downloaded. Restart to install.'}
            </p>
            <button
              onClick={() => updaterApi?.install()}
              className="w-full py-1.5 bg-white text-[#1A1A1A] text-[9px] font-mono font-bold uppercase tracking-wider hover:bg-white/90 transition-colors">
              {lang === 'zh' ? '重启以升级' : 'Restart to update'}
            </button>
          </div>
        ) : downloading ? (
          /* ── 下载中：红点呼吸 + 进度条 ── */
          <div className="space-y-2.5 bg-white p-3.5 border border-[#1A1A1A]/15 font-mono text-[9px] uppercase tracking-wider shadow-xs shrink-0">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[#1A1A1A]/80 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" style={{ animation: 'gsyen-breathe 1.2s ease-in-out infinite' }} />
                {updateVersion ? `v${updateVersion}` : 'NEW VERSION'}
              </div>
              <span className="text-[8px] text-[#1A1A1A]/40">{downloadPct}%</span>
            </div>
            <div className="w-full h-0.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#1A1A1A] transition-all duration-300 rounded-full" style={{ width: `${downloadPct}%` }} />
            </div>
            <p className="text-[8px] text-[#1A1A1A]/40 leading-normal normal-case tracking-normal">
              {lang === 'zh' ? '正在后台下载，完成后点击升级。' : 'Downloading in background…'}
            </p>
          </div>
        ) : (
          /* ── 空闲：正常存储状态 ── */
          <div className="space-y-1.5 bg-white p-3.5 border border-[#1A1A1A]/10 font-mono text-[9px] uppercase tracking-wider text-neutral-500 shadow-xs shrink-0">
            <div className="inline-flex items-center gap-1.5 text-[#1A1A1A]/60 font-bold">
              <Terminal className="w-3 h-3" />
              {lang === 'zh' ? '本地存储 · Supabase 就绪' : 'LOCAL · SUPABASE READY'}
            </div>
            <p className="text-[8px] text-[#1A1A1A]/40 leading-normal normal-case tracking-normal">
              {lang === 'zh' ? '记录保存于本设备。配置 Supabase 后自动云同步。' : 'Sessions stored locally. Cloud sync activates once Supabase is configured.'}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
