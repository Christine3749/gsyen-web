import { type NextRequest, NextResponse } from 'next/server';

const GSYEN_API =
  process.env.GSYEN_API_URL ||
  'https://gsyen-api-827638954410.asia-east1.run.app';

export async function POST(req: NextRequest) {
  const rt = req.cookies.get('gsyen_rt')?.value;

  await fetch(`${GSYEN_API}/api/auth/logout`, {
    method: 'POST',
    headers: rt ? { Cookie: `gsyen_rt=${rt}` } : {},
  }).catch(() => {});

  // 无论 gsyen-api 是否成功，本地都清掉 cookie
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('gsyen_rt');
  return res;
}
