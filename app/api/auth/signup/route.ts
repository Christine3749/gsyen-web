import { type NextRequest, NextResponse } from 'next/server';

const GSYEN_API =
  process.env.GSYEN_API_URL ||
  'https://gsyen-api-827638954410.asia-east1.run.app';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const upstream = await fetch(`${GSYEN_API}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  const res = NextResponse.json(data, { status: upstream.status });

  const setCookie = upstream.headers.get('set-cookie');
  if (setCookie) res.headers.set('set-cookie', setCookie);

  return res;
}
