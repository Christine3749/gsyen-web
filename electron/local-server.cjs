const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

let serverProcess = null;
let appRef = null;
let stopping = false;
let restartTimer = null;
let restartAttempts = 0;

function isReady(timeoutMs = 1200) {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:3000/api/codex/health', res => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

async function waitUntilReady() {
  for (let i = 0; i < 30; i++) {
    if (await isReady(1000)) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

function warmChatGptBridge() {
  const req = http.get('http://127.0.0.1:3000/api/codex/health', res => res.resume());
  req.setTimeout(1800, () => req.destroy());
  req.on('error', () => {});
}

function clearRestartTimer() {
  if (!restartTimer) return;
  clearTimeout(restartTimer);
  restartTimer = null;
}

function scheduleRestart() {
  if (stopping || !appRef?.isPackaged || restartTimer) return;
  const delay = Math.min(1000 * 2 ** restartAttempts, 15000);
  restartAttempts += 1;
  restartTimer = setTimeout(() => {
    restartTimer = null;
    startLocalServer(appRef).catch(e => console.error('local server restart failed:', e));
  }, delay);
}

async function startLocalServer(app) {
  appRef = app ?? appRef;
  if (!appRef?.isPackaged || serverProcess) return;
  stopping = false;
  if (await isReady()) {
    restartAttempts = 0;
    warmChatGptBridge();
    return;
  }

  const serverPath = path.join(__dirname, '../dist/server.cjs');
  if (!fs.existsSync(serverPath)) {
    console.error('local API server missing:', serverPath);
    return;
  }

  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      API_ONLY: 'true',
      NODE_ENV: 'production',
      NO_COLOR: '1',
    },
    windowsHide: true,
    stdio: 'ignore',
  });

  serverProcess.on('exit', () => {
    serverProcess = null;
    scheduleRestart();
  });

  if (await waitUntilReady()) {
    restartAttempts = 0;
    warmChatGptBridge();
  } else {
    console.error('local API server did not become ready');
    scheduleRestart();
  }
}

function stopLocalServer() {
  stopping = true;
  clearRestartTimer();
  if (!serverProcess) return;
  serverProcess.kill();
  serverProcess = null;
}

module.exports = { startLocalServer, stopLocalServer };
