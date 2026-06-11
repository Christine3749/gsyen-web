import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  let ollamaAlive = false;
  try {
    const r = await fetch(`${ollamaBase}/api/tags`, { signal: AbortSignal.timeout(5000) });
    ollamaAlive = r.ok;
  } catch {}
  res.json({ status: 'ok', ollamaAlive });
}
