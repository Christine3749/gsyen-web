import type { ModelHealth } from '../hooks/useModelHealth';

const LOCAL_BRIDGE_BASES = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
];

export interface LocalBridgeProbe {
  base: string;
  health: ModelHealth;
}

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

export async function probeLocalChatGptBridge(timeoutMs = 2500): Promise<LocalBridgeProbe | null> {
  for (const base of LOCAL_BRIDGE_BASES) {
    try {
      const data = await fetchJsonWithTimeout(`${base}/api/health`, timeoutMs);
      const model = data.models?.['chatgpt-pro'];
      if (!model || typeof model !== 'object') continue;
      return {
        base,
        health: model.available
          ? { status: 'online', authMode: model.authMode ?? 'chatgpt' }
          : { status: 'offline', error: model.error ?? 'LOCAL BRIDGE OFFLINE' },
      };
    } catch {
      // Try the next localhost alias.
    }
  }
  return null;
}

export async function localChatGptGatewayBase(): Promise<string> {
  const probe = await probeLocalChatGptBridge(1800);
  return probe?.health.status === 'online' ? probe.base : '';
}

export async function startLocalChatGptBind(): Promise<Response | null> {
  for (const base of LOCAL_BRIDGE_BASES) {
    try {
      const res = await fetch(`${base}/api/codex/login/start`, {
        method: 'POST',
        mode: 'cors',
      });
      if (res.status !== 404) return res;
    } catch {
      // Try the next localhost alias.
    }
  }
  return null;
}
