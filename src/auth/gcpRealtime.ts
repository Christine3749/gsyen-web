import type { RealtimeChannel } from '../types/account';
import { getGcpAccessToken } from './gcpAuthSession';
import { gcpDataBase } from './gcpDataTransport';

type Filter = { event?: string; schema?: string; table?: string; filter?: string };
type Handler = { type: string; filter: Filter; callback: (payload: any) => void };
type Status = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'CLOSED';
type Change = { table?: string; schema?: string; eventType?: string; event?: string;
  user_id?: string; userId?: string; new?: Record<string, unknown>; old?: Record<string, unknown> };

function tokenOwner(token: string) {
  try {
    const body = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return String(JSON.parse(atob(body)).sub || '');
  } catch { return ''; }
}

/** The existing stores consume change notifications by pulling their original table again. */
export function createGcpRealtime() {
  const channels = new Set<Channel>();
  let controller: AbortController | null = null;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let run = 0;
  let failures = 0;
  let connected = false;

  class Channel {
    readonly handlers: Handler[] = [];
    active = false;
    callback?: (status: Status, error?: Error) => void;
    constructor(readonly topic: string) {}

    on(type: string, filter: Filter, callback: Handler['callback']) {
      this.handlers.push({ type, filter, callback });
      return this;
    }

    subscribe(callback?: Channel['callback']) {
      this.callback = callback;
      if (!this.active) {
        this.active = true;
        channels.add(this);
        if (connected) queueMicrotask(() => this.status('SUBSCRIBED'));
        else start();
      }
      return this;
    }

    async unsubscribe(): Promise<'ok'> {
      if (this.active) {
        this.active = false;
        channels.delete(this);
        this.status('CLOSED');
        if (!channels.size) stop();
      }
      return 'ok';
    }

    status(status: Status, error?: Error) {
      if (status === 'SUBSCRIBED' && !this.active) return;
      try { this.callback?.(status, error); } catch {}
    }
  }

  function stop() {
    run += 1;
    connected = false;
    clearTimeout(retry);
    retry = undefined;
    controller?.abort();
    controller = null;
  }

  function deliver(change: Change, owner: string) {
    const schema = change.schema || 'public';
    const event = change.eventType || change.event || '*';
    const userId = change.user_id || change.userId || change.new?.user_id || change.old?.user_id || owner;
    for (const channel of channels) {
      for (const handler of channel.handlers) {
        const filter = handler.filter;
        if (handler.type !== 'postgres_changes' || (filter.schema && filter.schema !== schema)
          || (filter.table && filter.table !== change.table)
          || (filter.event && filter.event !== '*' && filter.event !== event)) continue;
        if (filter.filter) {
          const expected = filter.filter.match(/^user_id=eq\.(.+)$/)?.[1];
          if (!expected || expected !== userId) continue;
        }
        try { handler.callback({ ...change, schema, eventType: event }); } catch {}
      }
    }
  }

  function frame(value: string, owner: string) {
    const data = value.split('\n').filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).replace(/^ /, '')).join('\n');
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      const change = parsed.payload || parsed;
      if (change && typeof change.table === 'string') deliver(change, owner);
    } catch { /* Comments and heartbeat frames carry no database change. */ }
  }

  async function connect(version: number, signal: AbortSignal) {
    const token = await getGcpAccessToken();
    if (!token || version !== run || signal.aborted || !channels.size) return false;
    const response = await fetch(`${gcpDataBase}/events`, {
      headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` },
      credentials: 'include', cache: 'no-store', redirect: 'error', signal,
    });
    if (!response.ok || !response.body) throw new Error(`GCP realtime HTTP ${response.status}`);
    if (version !== run || signal.aborted) { await response.body.cancel(); return; }
    connected = true;
    failures = 0;
    for (const channel of channels) channel.status('SUBSCRIBED');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const owner = tokenOwner(token);
    let pending = '';
    try {
      while (!signal.aborted && version === run) {
        const next = await reader.read();
        if (next.done) break;
        pending = (pending + decoder.decode(next.value, { stream: true })).replace(/\r\n/g, '\n');
        let boundary: number;
        while ((boundary = pending.indexOf('\n\n')) >= 0) {
          const value = pending.slice(0, boundary);
          pending = pending.slice(boundary + 2);
          if (version === run && !signal.aborted) frame(value, owner);
        }
      }
    } finally { reader.releaseLock(); }
    return true;
  }

  function start() {
    if (controller || retry || !channels.size) return;
    const connection = new AbortController();
    controller = connection;
    const version = ++run;
    let shouldReconnect = true;
    void connect(version, connection.signal).then(result => {
      shouldReconnect = result !== false;
    }).catch(error => {
      if (version !== run || connection.signal.aborted) return;
      for (const channel of channels) channel.status('CHANNEL_ERROR', error instanceof Error ? error : undefined);
    }).finally(() => {
      if (version !== run) return;
      controller = null;
      connected = false;
      if (shouldReconnect && !connection.signal.aborted && channels.size) {
        retry = setTimeout(() => { retry = undefined; start(); }, Math.min(30_000, 1000 * 2 ** Math.min(failures++, 5)));
      }
    });
  }

  return {
    channel(topic: string) { return new Channel(topic) as unknown as RealtimeChannel; },
    removeChannel(channel: RealtimeChannel) { return (channel as unknown as Channel).unsubscribe(); },
    async removeAllChannels() { return Promise.all([...channels].map(channel => channel.unsubscribe())); },
    getChannels() { return [...channels] as unknown as RealtimeChannel[]; },
    authChanged() {
      stop();
      failures = 0;
      queueMicrotask(start);
    },
  };
}
