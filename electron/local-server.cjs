const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

let serverProcess = null;

function isReady() {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:3000/api/codex/health', res => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.setTimeout(1200, () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

async function startLocalServer(app) {
  if (!app.isPackaged || serverProcess) return;
  if (await isReady()) return;

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
  });
}

function stopLocalServer() {
  if (!serverProcess) return;
  serverProcess.kill();
  serverProcess = null;
}

module.exports = { startLocalServer, stopLocalServer };
