export const GSYEN_PROTOCOL = 'GSYEN/1' as const;

export function resolveGsyenApiBase(
  configured?: string,
  protocol = typeof window !== 'undefined' ? window.location.protocol : '',
): string {
  if (protocol !== 'file:') return '';
  const value = configured?.trim().replace(/\/+$/, '') || 'https://gsyen.com';
  if (!value) throw new Error('VITE_GSYEN_API_URL is required for packaged Electron');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_GSYEN_API_URL must be a clean HTTPS origin');
  }
  return url.origin;
}

export type GsyenErrorKind =
  | 'network' | 'timeout' | 'protocol' | 'auth'
  | 'validation' | 'rate_limit' | 'upstream' | 'server';

export type GsyenProtocolError = {
  code: string;
  serverCode?: string;
  kind: GsyenErrorKind;
  message: string;
  retryable: boolean;
  status: number;
  requestId: string;
};

export type GsyenProtocolResult<T> =
  | { ok: true; status: number; data: T; requestId: string }
  | { ok: false; status: number; error: GsyenProtocolError; requestId: string };

type ProtocolRequest = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  base?: string;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrerPolicy?: ReferrerPolicy;
};

function makeRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `gsyen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function classify(status: number): Pick<GsyenProtocolError, 'code' | 'kind' | 'retryable'> {
  if (status === 401 || status === 403) return { code: 'AUTH_REJECTED', kind: 'auth', retryable: false };
  if ([400, 404, 409, 422].includes(status)) {
    return { code: 'REQUEST_REJECTED', kind: 'validation', retryable: false };
  }
  if (status === 429) return { code: 'RATE_LIMITED', kind: 'rate_limit', retryable: true };
  if (status >= 502 && status <= 504) return { code: 'UPSTREAM_UNAVAILABLE', kind: 'upstream', retryable: true };
  return { code: 'SERVER_ERROR', kind: 'server', retryable: status >= 500 };
}

function serverMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const value = (data as Record<string, unknown>).error ?? (data as Record<string, unknown>).message;
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/** The only browser-to-server JSON transport. Feature code must not classify fetch failures itself. */
export async function gsyenRequest<T>({
  path, method = 'GET', body, timeoutMs = 15_000, base = '',
  headers: customHeaders, credentials = 'include', cache, redirect, referrerPolicy,
}: ProtocolRequest): Promise<GsyenProtocolResult<T>> {
  const id = makeRequestId();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${base}${path}`, {
      method,
      credentials, cache, redirect, referrerPolicy,
      headers: {
        ...Object.fromEntries(new Headers(customHeaders).entries()),
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-GSYEN-Protocol': GSYEN_PROTOCOL,
        'X-GSYEN-Request-ID': id,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const responseId = response.headers.get('x-gsyen-request-id') || id;
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    let data: unknown;

    if (text) {
      if (!contentType.toLowerCase().includes('application/json')) {
        return failure(response.status, responseId, 'INVALID_RESPONSE', 'protocol', '服务响应格式错误', response.status >= 500);
      }
      try {
        data = JSON.parse(text);
      } catch {
        return failure(response.status, responseId, 'INVALID_JSON', 'protocol', '服务响应数据损坏', response.status >= 500);
      }
    }

    if (!response.ok) {
      const category = classify(response.status);
      const payload = data && typeof data === 'object' ? data as Record<string, unknown> : {};
      return {
        ok: false, status: response.status, requestId: responseId,
        error: {
          ...category,
          serverCode: typeof payload.error === 'string' ? payload.error : undefined,
          message: typeof payload.message === 'string' ? payload.message
            : serverMessage(data, response.statusText || '请求失败'),
          status: response.status,
          requestId: responseId,
        },
      };
    }
    return { ok: true, status: response.status, data: data as T, requestId: responseId };
  } catch {
    const timedOut = controller.signal.aborted;
    return failure(
      0, id,
      timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_UNREACHABLE',
      timedOut ? 'timeout' : 'network',
      timedOut ? '连接超时，请稍后重试' : '网络错误，请检查连接',
      true,
    );
  } finally {
    clearTimeout(timer);
  }
}

function failure(
  status: number,
  requestId: string,
  code: string,
  kind: GsyenErrorKind,
  message: string,
  retryable: boolean,
): GsyenProtocolResult<never> {
  return {
    ok: false, status, requestId,
    error: { code, kind, message, retryable, status, requestId },
  };
}
