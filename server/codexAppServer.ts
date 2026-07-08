import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { buildPrompt, getCodexBridgeHealth, resolveCodexCliPath, type CodexBridgeInput } from './codexBridge';
type PendingRpc = { resolve: (value: any) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };
interface CodexSession {
  ws: WebSocket;
  pending: Map<string, PendingRpc>;
  model: string;
  threadId: string;
  busy: boolean;
  stale: boolean;
}
interface StreamOptions { signal?: AbortSignal }
const PORT = Number(process.env.CODEX_APP_SERVER_PORT || 37139);
const HTTP_BASE = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const TURN_TIMEOUT_MS = 90_000;
let child: ChildProcess | null = null;
let booting: Promise<void> | null = null;
const sessions = new Map<string, CodexSession>();
const creating = new Map<string, Promise<CodexSession>>();
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

function clearSession(session: CodexSession) {
  session.stale = true;
  if (sessions.get(session.model) === session) sessions.delete(session.model);
  for (const call of session.pending.values()) {
    clearTimeout(call.timer);
    call.reject(new Error('CODEX SESSION CLOSED'));
  }
  session.pending.clear();
  try { session.ws.close(); } catch {}
}

function clearAllSessions() {
  for (const session of sessions.values()) clearSession(session);
  sessions.clear();
}

export async function ensureCodexAppServer(forceRestart = false): Promise<void> {
  if (!forceRestart && await isReady()) return;
  if (booting) return booting;

  booting = (async () => {
    if (forceRestart) {
      clearAllSessions();
      child?.kill();
      child = null;
      await delay(250);
    }

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
      clearAllSessions();
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
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error('APP SERVER WS TIMEOUT'));
    }, 5000);
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

function rpc(session: CodexSession, method: string, params: any, timeoutMs = 20_000): Promise<any> {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  session.ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      session.pending.delete(id);
      reject(new Error(`${method} timeout`));
    }, timeoutMs);
    session.pending.set(id, { resolve, reject, timer });
  });
}

function readMessageData(event: MessageEvent): string {
  const data = event.data as any;
  if (typeof data === 'string') return data;
  if (data instanceof Buffer) return data.toString('utf8');
  return String(data);
}

function handleRpcMessage(session: CodexSession, msg: any): boolean {
  if (!msg.id || !session.pending.has(String(msg.id))) return false;
  const call = session.pending.get(String(msg.id))!;
  session.pending.delete(String(msg.id));
  clearTimeout(call.timer);
  if (msg.error) call.reject(new Error(JSON.stringify(msg.error)));
  else call.resolve(msg.result);
  return true;
}

function attachIdleHandlers(session: CodexSession) {
  session.ws.onerror = () => clearSession(session);
  session.ws.onclose = () => clearSession(session);
  session.ws.onmessage = event => {
    try { handleRpcMessage(session, JSON.parse(readMessageData(event))); }
    catch (err) { console.error('Codex app-server message parse failed:', err); }
  };
}

async function createSession(model: string): Promise<CodexSession> {
  await ensureCodexAppServer();
  const ws = await connect();
  const session: CodexSession = { ws, pending: new Map(), model, threadId: '', busy: false, stale: false };
  attachIdleHandlers(session);

  await rpc(session, 'initialize', {
    clientInfo: { name: 'gsyen-web', title: 'GSYEN', version: '1.0.0' },
    capabilities: null,
  });

  const thread = await rpc(session, 'thread/start', {
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
  session.threadId = thread.thread.id;
  sessions.set(model, session);
  return session;
}

async function getSession(model: string): Promise<CodexSession> {
  const existing = sessions.get(model);
  if (existing && !existing.stale && !existing.busy) return existing;
  const pending = creating.get(model);
  if (pending) return pending;
  const task = createSession(model).finally(() => creating.delete(model));
  creating.set(model, task);
  return task;
}

export function warmCodexAppServer(modelHint = 'gpt-5-5'): void {
  const model = chatGptModelName(modelHint);
  if (sessions.has(model) || creating.has(model)) return;
  getCodexBridgeHealth()
    .then(health => health.available ? getSession(model) : null)
    .catch(err => console.warn('Codex warm-up skipped:', err?.message || err));
}

async function interruptTurn(session: CodexSession, turnId: string | null) {
  if (!turnId || session.stale) return;
  await rpc(session, 'turn/interrupt', { threadId: session.threadId, turnId }, 3000).catch(() => {});
}

async function runTurn(
  session: CodexSession,
  input: CodexBridgeInput,
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  let fullText = '';
  let turnId: string | null = null;
  let lastError = '';

  const completed = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(async () => {
      await interruptTurn(session, turnId);
      reject(new Error('CODEX APP SERVER TIMEOUT'));
    }, input.timeoutMs ?? TURN_TIMEOUT_MS);

    const abort = async () => {
      clearTimeout(timeout);
      await interruptTurn(session, turnId);
      reject(new Error('CLIENT ABORTED'));
    };
    signal?.addEventListener('abort', abort, { once: true });

    session.ws.onmessage = event => {
      const msg = JSON.parse(readMessageData(event));
      if (handleRpcMessage(session, msg)) return;

      if (msg.method === 'item/agentMessage/delta') {
        const delta = msg.params?.delta || '';
        fullText += delta;
        if (delta) onDelta(delta);
      } else if (msg.method === 'error') {
        lastError = msg.params?.error?.message || 'CODEX APP SERVER ERROR';
      } else if (msg.method === 'turn/completed') {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
        const status = msg.params?.turn?.status;
        if ((status === 'failed' || status === 'interrupted') && !fullText.trim()) {
          reject(new Error(lastError || msg.params?.turn?.error?.message || 'CODEX TURN FAILED'));
        } else {
          resolve(fullText.trim());
        }
      }
    };
    session.ws.onerror = () => {
      clearSession(session);
      reject(new Error('APP SERVER WS ERROR'));
    };
    session.ws.onclose = () => reject(new Error('APP SERVER WS CLOSED'));
  });

  const turn = await rpc(session, 'turn/start', {
    threadId: session.threadId,
    input: [{ type: 'text', text: buildPrompt(input), text_elements: [] }],
    approvalPolicy: 'never',
    model: session.model,
    serviceTier: 'default',
    effort: 'low',
    personality: 'pragmatic',
  });
  turnId = turn.turn.id;

  return completed;
}

export async function streamCodexAppServer(
  input: CodexBridgeInput,
  onDelta: (delta: string) => void,
  options: StreamOptions = {},
): Promise<string> {
  const health = await getCodexBridgeHealth();
  if (!health.available) throw new Error(health.error || 'CODEX LOGIN REQUIRED');

  const model = chatGptModelName(input.chatGptModel);
  for (let attempt = 0; attempt < 2; attempt++) {
    const session = await getSession(model);
    session.busy = true;
    try {
      const text = await runTurn(session, input, onDelta, options.signal);
      attachIdleHandlers(session);
      return text || '我在，但这次没有生成有效回复。';
    } catch (err) {
      clearSession(session);
      if (options.signal?.aborted || attempt === 1) throw err;
      await ensureCodexAppServer(true);
    } finally {
      session.busy = false;
    }
  }
  throw new Error('CODEX APP SERVER UNAVAILABLE');
}
