import type { AuthChangeEvent, Session, User } from '../types/account';
import { gsyenRequest, resolveGsyenApiBase } from '../protocol/gsyenProtocol';
type Membership = { tier: string; email_verified: boolean };
type Profile = { user: User; membership: Membership; access_token?: string;
  refresh_token?: string; expires_at?: number;
  gcp_session?: { access_token: string; refresh_token: string; expires_at: number } };
type Listener = (event: AuthChangeEvent, session: Session | null) => void | Promise<void>;
type SessionResult = { data: { user: User | null; session: Session | null }; error: { message: string; status?: number } | null };
const base = resolveGsyenApiBase(import.meta.env.VITE_GSYEN_API_URL as string | undefined);
let session: Session | null = null;
let membership: Membership | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let refreshing: Promise<SessionResult> | null = null;
let generation = 0;
const listeners = new Set<Listener>();
if (new URLSearchParams(window.location.search).get('mode') === 'signIn') {
  const callbackUrl = new URL(window.location.href);
  callbackUrl.hash = 'type=magiclink';
  window.history.replaceState(window.history.state, '', callbackUrl);
}
let recovery: { code: string; user: User } | null = null;
let emailAction: Promise<void> | null = null;
function claims(token: string): { iss?: string; exp?: number } {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part));
  } catch { return {}; }
}
function isGcpToken(token: string) {
  const issuer = claims(token).iss;
  return issuer === 'halfsphere-account';
}
function emit(event: AuthChangeEvent) {
  for (const listener of listeners) {
    try { void Promise.resolve(listener(event, session)).catch(() => {}); } catch {}
  }
}
function clear() {
  generation += 1;
  clearTimeout(timer);
  session = null;
  membership = null;
  recovery = null;
}
async function profile(token?: string, refreshToken?: string): Promise<Profile> {
  const response = await gsyenRequest<Profile>({
    path: '/api/auth/me', base, method: refreshToken ? 'POST' : 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: refreshToken ? { refresh_token: refreshToken } : undefined,
  });
  if (response.ok === false) throw Object.assign(new Error(response.error.message), { status: response.status });
  if (!response.data.user?.id) throw new Error('账号服务返回的数据不完整');
  return response.data;
}
function schedule(delay?: number) {
  clearTimeout(timer);
  if (!session) return;
  timer = setTimeout(() => { void refresh(); }, delay ?? Math.max(1000, ((session.expires_at || 0) * 1000) - Date.now() - 30_000));
}
function apply(data: Profile, tokens: { access_token: string; refresh_token: string }, event: AuthChangeEvent) {
  const accessToken = data.access_token || tokens.access_token;
  const expiresAt = data.expires_at || claims(accessToken).exp || Math.floor(Date.now() / 1000) + 3600;
  session = { user: data.user, access_token: accessToken,
    refresh_token: data.refresh_token || tokens.refresh_token, token_type: 'bearer',
    expires_at: expiresAt, expires_in: Math.max(0, expiresAt - Math.floor(Date.now() / 1000)) };
  membership = data.membership;
  schedule();
  emit(event);
  return { data: { user: session.user, session }, error: null };
}
function failed(error: unknown): SessionResult {
  return { data: { user: session?.user || null, session }, error: {
    message: error instanceof Error ? error.message : '账号服务暂不可用',
    status: (error as { status?: number })?.status,
  } };
}
function refresh(): Promise<SessionResult> {
  if (refreshing) return refreshing;
  const current = session;
  if (!current) return Promise.resolve(failed(new Error('no session')));
  const version = generation;
  refreshing = (async () => {
    try {
      const data = await profile(undefined, current.refresh_token);
      if (generation !== version) return { data: { user: session?.user || null, session }, error: null };
      return apply(data, current, 'TOKEN_REFRESHED');
    } catch (error) {
      if (generation === version) {
        if ((error as { status?: number })?.status === 401) { clear(); emit('SIGNED_OUT'); }
        else schedule(60_000);
      }
      return failed(error);
    } finally { refreshing = null; }
  })();
  return refreshing;
}
export const hasGcpSession = () => session !== null;
export async function getGcpAccessToken(): Promise<string | null> {
  if (!session) return null;
  if ((session.expires_at || 0) * 1000 <= Date.now() + 30_000) await refresh();
  return session?.access_token || null;
}
async function authAction<T>(path: string, body: unknown, method: 'POST' | 'PUT' = 'POST') {
  const token = await getGcpAccessToken();
  const result = await gsyenRequest<T>({ path: `/api/gcp/auth/v1/${path}`, base, method, body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (result.ok === false) throw Object.assign(new Error(result.error.message), { status: result.status });
  return result.data;
}
export async function gcpMembership() {
  if (!session) return null;
  const current = session;
  try {
    const data = await profile(current.access_token);
    if (session === current) membership = data.membership;
  } catch { /* Keep the last server-resolved membership during a transient outage. */ }
  return membership ? { tier: membership.tier, emailVerified: membership.email_verified } : null;
}
export function createGcpAuthSession() {
  function recoveryView(): Session | null {
    // A view for the existing recovery modal, with no ordinary login token.
    return recovery ? { user: recovery.user, access_token: '', refresh_token: '',
      token_type: 'bearer', expires_in: 0 } : null;
  }
  function emailCallback() {
    if (emailAction) return;
    const query = new URLSearchParams(window.location.search);
    const mode = query.get('mode'), code = query.get('oobCode');
    if (!code || !['resetPassword', 'verifyEmail', 'signIn'].includes(mode || '')) return;
    emailAction = (async () => {
      const result = await authAction<Partial<Profile> & { email?: string }>('oob', {
        mode, oobCode: code, email: query.get('email') || sessionStorage.getItem('gsyen.gcp.email_hint'),
      });
      if (mode === 'resetPassword' && result.user) {
        recovery = { code, user: result.user };
        for (const callback of listeners) void Promise.resolve(callback('PASSWORD_RECOVERY', recoveryView())).catch(() => {});
      } else if (result.access_token && result.refresh_token) {
        apply(await profile(result.access_token), { access_token: result.access_token, refresh_token: result.refresh_token }, 'SIGNED_IN');
      } else if (session) apply(await profile(session.access_token), session, 'USER_UPDATED');
      const url = new URL(window.location.href);
      for (const key of ['mode', 'oobCode', 'email', 'apiKey', 'lang']) url.searchParams.delete(key);
      window.history.replaceState(window.history.state, '', url);
    })().catch(() => {});
  }
  const overrides = {
    async signInWithOAuth(credentials: { provider: string; options?: { redirectTo?: string; skipBrowserRedirect?: boolean } }) {
      const result = await gsyenRequest<{ url: string }>({ path: '/api/gcp/oauth/start', base,
        method: 'POST', body: { provider: credentials.provider, redirectTo: credentials.options?.redirectTo } });
      if (result.ok === false) return { data: { provider: credentials.provider, url: null }, error: { message: result.error.message } };
      if (!credentials.options?.skipBrowserRedirect) window.location.assign(result.data.url);
      return { data: { provider: credentials.provider, url: result.data.url }, error: null };
    },
    async getUser(jwt?: string) {
      const token = jwt || await getGcpAccessToken();
      if (!token) return { data: { user: null }, error: { message: 'no session', status: 401 } };
      try { return { data: { user: (await profile(token)).user }, error: null }; }
      catch (error) { return { data: { user: null }, error: failed(error).error }; }
    },
    async updateUser(attributes: { data?: Record<string, unknown>; password?: string; email?: string; phone?: string }) {
      if (recovery && attributes.password) {
        try {
          const result = await authAction<Profile>('oob', { mode: 'resetPassword', oobCode: recovery.code, password: attributes.password });
          recovery = null;
          return apply(await profile(result.access_token), { access_token: result.access_token!, refresh_token: result.refresh_token! }, 'PASSWORD_RECOVERY');
        } catch (error) { return { data: { user: recovery?.user || null }, error: failed(error).error }; }
      }
      const current = session;
      if (!current) return { data: { user: null }, error: { message: 'no session', status: 401 } };
      const version = generation;
      try {
        const result = await authAction<Partial<Profile> & Partial<User>>('user', attributes, 'PUT');
        if (generation !== version || session?.user.id !== current.user.id) return failed(new Error('登录状态已更新'));
        const user = result.user || (result.id ? result as User : (await profile(current.access_token)).user);
        if (user.id !== current.user.id) return failed(new Error('登录状态已更新'));
        return apply({ user, membership: result.membership || membership!,
          access_token: result.gcp_session?.access_token || result.access_token,
          refresh_token: result.gcp_session?.refresh_token || result.refresh_token,
          expires_at: result.gcp_session?.expires_at || result.expires_at }, current, 'USER_UPDATED');
      } catch (error) { return { data: { user: current.user }, error: failed(error).error }; }
    },
    async signInWithOtp(credentials: { email?: string; phone?: string; options?: Record<string, unknown> }) {
      try {
        if (credentials.email) sessionStorage.setItem('gsyen.gcp.email_hint', credentials.email);
        await authAction('otp', credentials);
        return { data: { user: null, session: null }, error: null };
      } catch (error) { return { data: { user: null, session: null }, error: failed(error).error }; }
    },
    async setSession(tokens: { access_token: string; refresh_token: string }) {
      if (!isGcpToken(tokens.access_token)) return failed(new Error('账号会话无效'));
      const version = ++generation;
      try {
        const data = await profile(tokens.access_token);
        if (version !== generation) return failed(new Error('登录状态已更新'));
        return apply(data, tokens, 'SIGNED_IN');
      } catch (error) { return failed(error); }
    },
    async getSession() {
      if (!session) {
        return { data: { session: null }, error: null };
      }
      if ((session.expires_at || 0) * 1000 <= Date.now()) await refresh();
      return { data: { session }, error: null };
    },
    async refreshSession() {
      return session ? refresh() : failed(new Error('no session'));
    },
    async signOut(options?: { scope?: 'global' | 'local' | 'others' }) {
      clear();
      emit('SIGNED_OUT');
      return { error: null };
    },
    onAuthStateChange(callback: Listener) {
      listeners.add(callback);
      emailCallback();
      queueMicrotask(() => {
        if (!listeners.has(callback)) return;
        void overrides.getSession().then(({ data }) => callback(recovery ? 'PASSWORD_RECOVERY' : 'INITIAL_SESSION', recoveryView() || data.session)).catch(() => {});
      });
      return { data: { subscription: { id: crypto.randomUUID(), callback,
        unsubscribe: () => { listeners.delete(callback); } } } };
    },
  };
  return overrides;
}
