/**
 * getServerUser — 服务端读取 gsyen_rt cookie，向 gsyen-api 换取用户信息。
 * 只在 Next.js Server Components / Route Handlers 中调用，不可在客户端使用。
 *
 * SSR 关键优势：服务器直接注入用户数据到 HTML，浏览器收到页面时用户已在，零 flash。
 */
import { cookies } from 'next/headers';

// 服务端用私有 env var（不带 NEXT_PUBLIC_ 前缀，不暴露到客户端）
const GSYEN_API =
  process.env.GSYEN_API_URL ||
  'https://gsyen-api-827638954410.asia-east1.run.app';

export interface ServerUser {
  id: string;
  email: string;
  tier: string | null;
  emailVerified: boolean;
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export async function getServerUser(): Promise<ServerUser | null> {
  const store = await cookies();
  const rt = store.get('gsyen_rt')?.value;
  if (!rt) return null;

  try {
    // 服务端以 Cookie 头转发 refresh_token，gsyen-api 负责刷新并返回新 access_token
    const res = await fetch(`${GSYEN_API}/api/auth/me`, {
      headers: { Cookie: `gsyen_rt=${rt}` },
      cache: 'no-store', // 每次请求都要最新 session，不可缓存
    });
    if (!res.ok) return null;

    const data = await res.json();
    const user = data.user;
    if (!user?.id) return null;

    const tier = user.app_metadata?.tier ?? user.user_metadata?.tier ?? null;
    const emailVerified = user.email_confirmed_at != null;

    return {
      id: user.id,
      email: user.email ?? '',
      tier,
      emailVerified,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };
  } catch {
    return null;
  }
}
