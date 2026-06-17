import { type NextRequest, NextResponse } from 'next/server';

const GSYEN_API =
  process.env.GSYEN_API_URL ||
  'https://gsyen-api-827638954410.asia-east1.run.app';

export async function GET(req: NextRequest) {
  const rt = req.cookies.get('gsyen_rt')?.value;
  if (!rt) return NextResponse.json({ error: 'no session' }, { status: 401 });

  const upstream = await fetch(`${GSYEN_API}/api/auth/me`, {
    headers: { Cookie: `gsyen_rt=${rt}` },
    cache: 'no-store',
  }).catch(() => null);

  if (!upstream || !upstream.ok) {
    const status = upstream?.status ?? 503;
    const res = NextResponse.json({ error: 'session expired' }, { status });
    if (status === 401) res.cookies.delete('gsyen_rt');
    return res;
  }

  const data = await upstream.json();
  const res = NextResponse.json(data);

  // gsyen-api 会旋转 refresh_token，透传新 cookie
  const setCookie = upstream.headers.get('set-cookie');
  if (setCookie) res.headers.set('set-cookie', setCookie);

  return res;
}
