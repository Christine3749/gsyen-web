/**
 * UpdateToast — Electron 自动更新通知条
 * 仅在 Electron 环境下挂载，web 版不渲染。
 */
import { useState, useEffect } from 'react';

type Phase = 'idle' | 'available' | 'downloading' | 'ready';

export function UpdateToast() {
  const api = (window as any).electronAPI?.updater;
  const [phase,    setPhase]    = useState<Phase>('idle');
  const [version,  setVersion]  = useState('');
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismiss] = useState(false);

  useEffect(() => {
    if (!api) return;
    api.onAvailable((info: any) => { setVersion(info.version ?? ''); setPhase('available'); });
    api.onProgress((p: any)    => { setProgress(Math.round(p.percent ?? 0)); setPhase('downloading'); });
    api.onDownloaded((info: any) => { setVersion(info.version ?? ''); setPhase('ready'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!api || dismissed || phase === 'idle') return null;

  const bg    = '#1A1A1A';
  const fg    = '#F9F8F6';
  const muted = 'rgba(249,248,246,0.55)';
  const blue  = '#4A90D9';

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: fg,
      borderRadius: 8, padding: '14px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
      fontSize: 13, minWidth: 280, maxWidth: 360,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          {phase === 'available' && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>新版本可用 {version && `v${version}`}</div>
              <div style={{ color: muted, fontSize: 12 }}>正在后台下载，完成后通知你。</div>
            </>
          )}
          {phase === 'downloading' && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>正在下载更新… {progress}%</div>
              <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: blue, borderRadius: 99, transition: 'width 0.3s' }} />
              </div>
            </>
          )}
          {phase === 'ready' && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>更新已就绪 {version && `v${version}`}</div>
              <div style={{ color: muted, fontSize: 12 }}>重启即可完成安装。</div>
            </>
          )}
        </div>
        <button onClick={() => setDismiss(true)}
          style={{ background: 'transparent', border: 'none', color: muted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>
          ×
        </button>
      </div>

      {phase === 'ready' && (
        <button onClick={() => api.install()}
          style={{ background: blue, color: '#fff', border: 'none', borderRadius: 5,
            padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            alignSelf: 'flex-start', transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
          立即重启安装
        </button>
      )}
    </div>
  );
}
