import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(409).json({
    started: false,
    localOnly: true,
    url: 'https://chatgpt.com',
    error: 'LOCAL_BRIDGE_REQUIRED',
    message: 'ChatGPT Pro binding requires the desktop app or local bridge.',
  });
}
