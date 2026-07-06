import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/index-layers/01-command-bus-foundation.css';
import './styles/index-layers/02-workbench-base.css';
import './styles/index-layers/03-archive-standby.css';
import './styles/index-layers/04-system-status.css';
import './styles/index-layers/05-command-cohesion.css';
import './styles/index-layers/06-motion-refinement.css';
import './styles/index-layers/07-workbench-detail.css';
import './styles/index-layers/08-responsive-command-rail.css';
import './styles/index-layers/09-header-auth-shell.css';
import './styles/index-layers/10-brand-logo-motion.css';
import './styles/index-layers/11-pulse-readout.css';
import './styles/index-layers/12-pulse-panel-polish.css';
import './styles/index-layers/13-precision-v7-foundation.css';
import './styles/index-layers/14-precision-v7-pulse.css';
import './styles/index-layers/15-precision-v7-status.css';
import './styles/index-layers/16-scoped-module-vi.css';
import './styles/index-layers/17-module-mail-kanban.css';
import './styles/index-layers/18-module-ledger-citadel.css';
import './styles/index-layers/19-member-responsive.css';
import './styles/index-layers/20-final-overrides.css';
import './styles/index-layers/21-final-overrides.css';
import './styles/index-layers/22-shell-layout.css';
import './styles/index-layers/22-shell-responsive.css';
import './styles/index-layers/23-pulse-dock.css';
import './styles/index-layers/24-surface-harmony.css';

// 同步应用字体偏好，避免首屏闪烁
const _savedFont = localStorage.getItem('gsyen_font_size');
if (_savedFont === 'ji' || _savedFont === 'compact' || _savedFont === 'large') {
  document.documentElement.setAttribute('data-font', _savedFont);
}

// 仅 Electron 桌面客户端才初始化 Electron Sentry —— 网页端无 IPC 桥，sentry-ipc:// 不可用
const isElectronEnv =
  (window as any).electronAPI?.isElectron ||
  navigator.userAgent.toLowerCase().includes('electron');

if (isElectronEnv) {
  import('@sentry/electron/renderer').then((Sentry) => {
    Sentry.init({
      dsn: 'https://a7b7176417e2f24b54156ef4ff01e8b2@o4511541959720960.ingest.us.sentry.io/4511541969551360',
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
