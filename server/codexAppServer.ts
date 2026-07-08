import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { buildPrompt, getCodexBridgeHealth, resolveCodexCliPath, type CodexBridgeInput } from './codexBridge';

type PendingRpc = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const PORT = Number(process.env.CODEX_APP_SERVER_PORT || 37139);
const HTTP_BASE = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;

let child: ChildProcess | null = null;
let booting: Promise<void> | null = null;

async function isReady(): Promise<boolean> {
  try {
    const res = await fetch(`${HTTP_BASE}/readyz`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitUntilReady(): Promise<void> {
  for (let i = 0; i < 50; i++) {
    if (await isReady()) return;
    await delay(100);
  }
  throw new Error('CODEX APP SERVER NOT READY');
}

export async function ensureCodexAppServer(): Promise<void> {
  if (await isReady()) return;
  if (booting) return booting;

  booting = (async () => {
    const codexPath = resolveCodexCliPath();
    if (!codexPath) throw new Error('CODEX CLI MISSING');

    child = spawn(codexPath, [
      'app-server',
      '--listen', WS_URL,
      '-c', 'service_tier="default"',
    ], {
      env: { ...process.env, NO_COLOR: '1' },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.on('exit', () => {
      child = null;
    });
    child.stderr?.on('data', chunk => {
      const text = String(chunk);
      if (/ERROR|WARN/.test(text)) process.stderr.write(text);
    });

    await waitUntilReady();
  })().finally(() => {
    booting = null;
  });

  return booting;
}

function chatGptModelName(model?: string | null): string {
  if (model === 'gpt-5-5-mini' || model === 'mini') return 'gpt-5.5-mini';
  return 'gpt-5.5';
}

function connect(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const timer = setTimeout(() => reject(new Error('APP SERVER WS TIMEOUT')), 5000);
    ws.onopen = () => {
      clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error('APP SERVER WS ERROR'));
    };
  });
}

function rpc(ws: WebSocket, pending: Map<string, PendingRpc>, method: string, params: any): Promise<any> {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timeout`));
    }, 20_000);
    pending.set(id, { resolve, reject, timer });
  });
}

function readMessageData(event: MessageEvent): string {
  const data = event.data as any;
  if (typeof data === 'string') return data;
  if (data instanceof Buffer) return data.toString('utf8');
  return String(data);
}

export async function streamCodexAppServer(
  input: CodexBridgeInput,
  onDelta: (delta: string) => void,
): Promise<string> {
  const health = await getCodexBridgeHealth();
  if (!health.available) throw new Error(health.error || 'CODEX LOGIN REQUIRED');
  await ensureCodexAppServer();

  const ws = await connect();
  const pending = new Map<string, PendingRpc>();
  let fullText = '';
  let lastError = '';

  try {
    const completed = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('CODEX APP SERVER TIMEOUT')), input.timeoutMs ?? 120_000);
      ws.onmessage = event => {
        const msg = JSON.parse(readMessageData(event));
        if (msg.id && pending.has(String(msg.id))) {
          const call = pending.get(String(msg.id))!;
          pending.delete(String(msg.id));
          clearTimeout(call.timer);
          if (msg.error) call.reject(new Error(JSON.stringify(msg.error)));
          else call.resolve(msg.result);
          return;
        }

        if (msg.method === 'item/agentMessage/delta') {
          const delta = msg.params?.delta || '';
          fullText += delta;
          if (delta) onDelta(delta);
        } else if (msg.method === 'error') {
          lastError = msg.params?.error?.message || 'CODEX APP SERVER ERROR';
        } else if (msg.method === 'turn/completed') {
          clearTimeout(timeout);
          const status = msg.params?.turn?.status;
          if (status === 'failed' && !fullText.trim()) {
            reject(new Error(lastError || msg.params?.turn?.error?.message || 'CODEX TURN FAILED'));
          } else {
            resolve(fullText.trim());
          }
        }
      };
      ws.onerror = () => reject(new Error('APP SERVER WS ERROR'));
    });

    await rpc(ws, pending, 'initialize', {
      clientInfo: { name: 'gsyen-web', title: 'GSYEN', version: '1.0.0' },
      capabilities: null,
    });

    const model = chatGptModelName(input.chatGptModel);
    const thread = await rpc(ws, pending, 'thread/start', {
      model,
      serviceTier: 'default',
      cwd: process.cwd(),
      approvalPolicy: 'never',
      sandbox: 'read-only',
      baseInstructions: '你是 GSYEN 的本地 ChatGPT 桥。只回答用户问题，不使用工具，不修改文件。',
      developerInstructions: '中文默认简洁、稳、带一点审美判断。',
      personality: 'pragmatic',
      ephemeral: true,
      sessionStartSource: 'startup',
    });

    await rpc(ws, pending, 'turn/start', {
      threadId: thread.thread.id,
      input: [{ type: 'text', text: buildPrompt(input), text_elements: [] }],
      approvalPolicy: 'never',
      model,
      serviceTier: 'default',
      effort: 'low',
      personality: 'pragmatic',
    });

    const text = await completed;
    return text || '我在，但这次没有生成有效回复。';
  } finally {
    for (const call of pending.values()) clearTimeout(call.timer);
    ws.close();
  }
}
