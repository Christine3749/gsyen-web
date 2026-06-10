import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/electron/renderer';
import App from './App.tsx';
import './index.css';

Sentry.init({
  dsn: 'https://a7b7176417e2f24b54156ef4ff01e8b2@o4511541959720960.ingest.us.sentry.io/4511541969551360',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
