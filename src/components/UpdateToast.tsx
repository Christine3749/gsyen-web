/**
 * UpdateToast — 自动更新提示
 * Windows: 后台下载完成后弹出，一键重启安装。
 * Mac:     发现新版本立即弹出（无签名无法自动安装），引导前往 GitHub 下载 DMG。
 */
import { useState, useEffect } from 'react';

const RELEASES_URL = 'https://github.com/Christine2031/gsyen-web/releases/latest';

export function UpdateToast() {
  const api      = (window as any).electronAPI?.updater;
  const platform = (window as any).electronAPI?.platform as string | undefined;
  const isMac    = platform === 'darwin';

  const [version,   setVersion]   = useState('');
  const [ready,     setReady]     = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!api) return;

    if (isMac) {
      // Mac: 签名缺失无法自动安装，发现新版本就直接提示下载
      api.onAvailable((info: any) => {
        setVersion(info.version ?? '');
        setReady(true);
      });
    } else {
      // Windows: 静默后台下载完成后才弹出
      api.onDownloaded((info: any) => {
        setVersion(info.version ?? '');
        setReady(true);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!api || !ready || dismissed) return null;

  const card: React.CSSProperties = {
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    background: '#1A1A1A', color: '#F9F8F6',
    borderRadius: 10, padding: '16px 18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
    fontSize: 13, width: 300,
    display: 'flex', flexDirection: 'column', gap: 12,
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
            {isMac ? '发现新版本' : 'Update ready'}
          </div>
          <div style={{ color: 'rgba(249,248,246,0.55)', fontSize: 12, lineHeight: 1.5 }}>
            {isMac
              ? `v${version} 已发布，下载 DMG 重新安装即可升级。`
              : `Restart GSYEN to update${version ? ` to v${version}` : ''}.`}
          </div>
        </div>
        <button onClick={() => setDismissed(true)} style={{
          background: 'transparent', border: 'none',
          color: 'rgba(249,248,246,0.4)', cursor: 'pointer',
          fontSize: 18, lineHeight: 1, padding: '0 0 0 8px', flexShrink: 0,
        }}>×</button>
      </div>

      {isMac ? (
        <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center',
            background: '#4A90D9', color: '#fff', textDecoration: 'none',
            borderRadius: 6, padding: '8px 0', fontSize: 13, fontWeight: 600,
          }}>
          前往下载 →
        </a>
      ) : (
        <button onClick={() => api.install()} style={{
          background: '#4A90D9', color: '#fff', border: 'none',
          borderRadius: 6, padding: '8px 0', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', width: '100%', transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
          Restart to update
        </button>
      )}
    </div>
  );
}
