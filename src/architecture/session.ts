/**
 * 疆域 GSYEN · Session 信息流
 * 环形缓冲存储 + 指数退避重连（解决 50 卡片惊群效应）。
 */

import type { GsyenStreamMessage, UserRole } from './types';

export class GsyenSessionStream {
  private messages:  GsyenStreamMessage[]                    = [];
  private ws:        WebSocket | null                        = null;
  private wsUrl:     string                                  = '';
  private retries:   number                                  = 0;
  private closed:    boolean                                 = false;
  private listeners: Set<(m: GsyenStreamMessage[]) => void> = new Set();

  private static readonly MAX_BUFFER = 2000;
  private static readonly BASE_DELAY = 1000;
  private static readonly MAX_DELAY  = 30_000;

  constructor(
    public readonly sessionId: string,
    public readonly teamId:    string,
  ) {}

  connect(wsUrl: string): void {
    this.wsUrl  = wsUrl;
    this.closed = false;
    let sock: WebSocket;
    try { sock = new WebSocket(wsUrl); }
    catch { this.scheduleReconnect(); return; }
    this.ws = sock;

    sock.onopen  = () => { this.retries = 0; };
    sock.onerror = () => { sock.close(); };
    sock.onclose = () => { if (!this.closed) this.scheduleReconnect(); };

    sock.onmessage = ({ data }) => {
      try {
        const raw = JSON.parse(data as string);
        if (!raw.id || !raw.content || !raw.sessionId) throw new Error('schema');
        const ROLES: UserRole[] = ['user', 'assistant', 'system'];
        const msg: GsyenStreamMessage = {
          id:        String(raw.id),
          sessionId: String(raw.sessionId),
          senderId:  String(raw.senderId ?? 'system'),
          role:      ROLES.includes(raw.role) ? raw.role : 'user',
          content:   String(raw.content),
          timestamp: Number(raw.timestamp ?? Date.now()),
          entityId:  raw.entityId ? String(raw.entityId) : undefined,
        };
        this.messages.push(msg);
        // 环形淘汰：超出上限时丢弃最旧帧，防 OOM
        if (this.messages.length > GsyenSessionStream.MAX_BUFFER) this.messages.shift();
        this.emit();
      } catch { /* 丢弃格式非法的帧，不影响流稳定性 */ }
    };
  }

  /**
   * 指数退避 + 随机抖动。
   * 50 个卡片同时断线时，各自随机分散在不同时间窗口重连，
   * 避免同一时刻 50 条连接冲击网关（Thundering Herd）。
   */
  private scheduleReconnect(): void {
    this.retries++;
    const exp    = Math.min(GsyenSessionStream.MAX_DELAY,
                            GsyenSessionStream.BASE_DELAY * 2 ** this.retries);
    const jitter = Math.random() * 1500;
    setTimeout(() => { if (!this.closed) this.connect(this.wsUrl); }, exp + jitter);
  }

  /** 订阅消息流，返回取消订阅函数。 */
  subscribe(cb: (m: GsyenStreamMessage[]) => void): () => void {
    this.listeners.add(cb);
    cb(this.tail(6));
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    const t = this.tail(6);
    this.listeners.forEach(cb => cb(t));
  }

  /** 返回最近 n 条消息的浅拷贝（供只读渲染，不修改原数组）。 */
  tail(n: number): GsyenStreamMessage[] {
    const len = this.messages.length;
    return len === 0 ? [] : this.messages.slice(Math.max(0, len - n));
  }

  /** 彻底释放：清空缓冲、注销所有监听器，防止组件销毁后内存悬挂。 */
  disconnect(): void {
    this.closed = true;
    this.ws?.close();
    this.ws       = null;
    this.messages = [];
    this.listeners.clear();
    this.retries  = 0;
  }
}
