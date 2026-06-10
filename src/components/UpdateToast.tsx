/**
 * UpdateToast — Figma 风格自动更新提示
 * 后台静默下载，完成后才弹出，一个按钮。
 * 仅在 Electron 环境下渲染。
 */
import { useState, useEffect } from 'react';

export function UpdateToast() {
  const api = (window as any).electronAPI?.updater;
  const [version,   setVersion]   = useState('');
  const [ready,     setReady]     = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!api) return;
    // 静默下载，不向用户暴露进度
    api.onDownloaded((info: any) => {
      setVersion(info.version ?? '');
      setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!api || !ready || dismissed) return null;

  return (
    <div style={{
      position:   'fixed',
      bottom:     24,
      right:      24,
      zIndex:     9999,
      background: '#1A1A1A',
      color:      '#F9F8F6',
      borderRadius: 10,
      padding:    '16px 18px',
      boxShadow:  '0 8px 32px rgba(0,0,0,0.55)',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
      fontSize:   13,
      width:      300,
      display:    'flex',
      flexDirection: 'column',
      gap:        12,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
            Update available
          </div>
          <div style={{ color: 'rgba(249,248,246,0.55)', fontSize: 12, lineHeight: 1.5 }}>
            Restart GSYEN to update{version ? ` to version ${version}` : ''}.
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background:  'transparent',
            border:      'none',
            color:       'rgba(249,248,246,0.4)',
            cursor:      'pointer',
            fontSize:    18,
            lineHeight:  1,
            padding:     '0 0 0 8px',
            flexShrink:  0,
          }}>
          ×
        </button>
      </div>

      {/* Action */}
      <button
        onClick={() => api.install()}
        style={{
          background:   '#4A90D9',
          color:        '#fff',
          border:       'none',
          borderRadius: 6,
          padding:      '8px 0',
          fontSize:     13,
          fontWeight:   600,
          cursor:       'pointer',
          width:        '100%',
          transition:   'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
        Restart to update
      </button>

    </div>
  );
}
