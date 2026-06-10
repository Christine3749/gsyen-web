/**
 * UpdateToast — gd-ia 风格更新提示
 * Windows: 下载完成后弹出，一键静默重启安装。
 * Mac:     发现新版本立即弹出，引导前往 GitHub 下载 DMG。
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const RELEASES_URL = 'https://github.com/Christine2031/gsyen-web/releases/latest';
const MONO = 'var(--font-mono, "SF Mono", "Cascadia Code", monospace)';

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
      api.onAvailable((info: any) => { setVersion(info.version ?? ''); setReady(true); });
    } else {
      api.onDownloaded((info: any) => { setVersion(info.version ?? ''); setReady(true); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {api && ready && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: 8,  scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9998,
            width: 280,
            background: '#1A1A1A',
            border: '1px solid rgba(249,248,246,0.12)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* 顶部细线 accent */}
          <div style={{ height: 2, background: '#4A90D9', flexShrink: 0 }} />

          <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontFamily: MONO, fontSize: 9, letterSpacing: '0.25em',
                  textTransform: 'uppercase', color: 'rgba(249,248,246,0.4)',
                  marginBottom: 4,
                }}>
                  {isMac ? 'NEW RELEASE' : 'UPDATE READY'}
                </div>
                <div style={{
                  fontFamily: MONO, fontSize: 13, fontWeight: 600,
                  color: 'rgba(249,248,246,0.92)', letterSpacing: '0.02em',
                }}>
                  GSYEN {version ? `v${version}` : ''}
                </div>
              </div>
              <button onClick={() => setDismissed(true)} style={{
                background: 'transparent', border: 'none',
                color: 'rgba(249,248,246,0.25)', cursor: 'pointer',
                fontSize: 16, lineHeight: 1, padding: '2px 0 0 10px',
                transition: 'color 0.15s', flexShrink: 0,
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(249,248,246,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(249,248,246,0.25)')}>
                ×
              </button>
            </div>

            {/* Description */}
            <p style={{
              fontFamily: MONO, fontSize: 10, lineHeight: 1.6,
              color: 'rgba(249,248,246,0.38)', margin: 0, letterSpacing: '0.03em',
            }}>
              {isMac
                ? '新版本已发布，下载 DMG 重新安装即可升级。'
                : '已在后台下载完成，重启后生效。'}
            </p>

            {/* Action */}
            {isMac ? (
              <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center',
                  padding: '8px 0',
                  background: 'transparent',
                  border: '1px solid rgba(249,248,246,0.2)',
                  color: 'rgba(249,248,246,0.7)',
                  fontFamily: MONO, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'border-color 0.18s, color 0.18s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,248,246,0.45)'; (e.currentTarget as HTMLElement).style.color = 'rgba(249,248,246,0.95)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,248,246,0.2)'; (e.currentTarget as HTMLElement).style.color = 'rgba(249,248,246,0.7)'; }}>
                前往下载 →
              </a>
            ) : (
              <button onClick={() => api.install()} style={{
                padding: '8px 0', width: '100%',
                background: '#4A90D9', border: 'none',
                color: '#fff',
                fontFamily: MONO, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'opacity 0.18s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                RESTART TO UPDATE
              </button>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
