/**
 * POST /api/auth/login — 代理到 gsyen-api，透传 HttpOnly cookie。
 *
 * Next.js SSR 的优势：将来可直接在此处用 @supabase/ssr 读写 cookie，
 * 省去 Cloud Run 一跳。骨架阶段先代理，迁移时再替换。
 */
import { type NextRequest, NextResponse } from 'next/server';

const GSYEN_API =
  process.env.GSYEN_API_URL ||
  'https://gsyen-api-827638954410.asia-east1.run.app';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const upstream = await fetch(`${GSYEN_API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  const res = NextResponse.json(data, { status: upstream.status });

  // 透传 gsyen-api 写下的 Set-Cookie（gsyen_rt HttpOnly cookie）
  const setCookie = upstream.headers.get('set-cookie');
  if (setCookie) res.headers.set('set-cookie', setCookie);

  return res;
}
