import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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
