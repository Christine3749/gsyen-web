import type { ModelHealth } from '../hooks/useModelHealth';

const LOCAL_BRIDGE_BASES = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
];
const DEFAULT_PROBE_TIMEOUT_MS = 1200;
const PROBE_CACHE_MS = 2500;

export interface LocalBridgeProbe {
  base: string;
  health: ModelHealth;
}
let cachedProbe: { value: LocalBridgeProbe | null; timestamp: number } | null = null;
let pendingProbe: Promise<LocalBridgeProbe | null> | null = null;

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      mode: 'cors',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    window.clearTimeout(timer);
  }
}

export async function probeLocalChatGptBridge(
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
  force = false,
): Promise<LocalBridgeProbe | null> {
  const now = Date.now();
  if (!force && cachedProbe && now - cachedProbe.timestamp < PROBE_CACHE_MS) {
    return cachedProbe.value;
  }
  if (!force && pendingProbe) return pendingProbe;

  pendingProbe = (async () => {
    for (const base of LOCAL_BRIDGE_BASES) {
      try {
        const model = await fetchJsonWithTimeout(`${base}/api/codex/health`, timeoutMs);
        if (!model || typeof model !== 'object') continue;
        const health: ModelHealth = model.available
          ? { status: 'online', authMode: model.authMode ?? 'chatgpt' }
          : { status: 'offline', error: model.error ?? 'LOCAL BRIDGE OFFLINE' };
        return { base, health };
      } catch {
        // Try the next localhost alias.
      }
    }
    return null;
  })().finally(() => {
    pendingProbe = null;
  });

  const value = await pendingProbe;
  cachedProbe = { value, timestamp: Date.now() };
  return value;
}

export async function localChatGptGatewayBase(): Promise<string> {
  const probe = await probeLocalChatGptBridge();
  return probe?.health.status === 'online' ? probe.base : '';
}

export async function startLocalChatGptBind(timeoutMs = 2500): Promise<Response | null> {
  for (const base of LOCAL_BRIDGE_BASES) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base}/api/codex/login/start`, {
        method: 'POST',
        mode: 'cors',
        signal: controller.signal,
      });
      if (res.status !== 404) return res;
    } catch {
      // Try the next localhost alias.
    } finally {
      window.clearTimeout(timer);
    }
  }
  return null;
}