import { NextResponse } from 'next/server';

const MODEL_CHECKS: Record<string, { envKey: string; testUrl?: string }> = {
  kimi:     { envKey: 'MOONSHOT_API_KEY',  testUrl: 'https://api.moonshot.cn/v1/models' },
  deepseek: { envKey: 'DEEPSEEK_API_KEY',  testUrl: 'https://api.deepseek.com/v1/models' },
  gemini:   { envKey: 'GEMINI_API_KEY',    testUrl: 'https://generativelanguage.googleapis.com/v1beta/models' },
  ethan:    { envKey: 'OLLAMA_BASE_URL' },
  fast:     { envKey: 'OLLAMA_BASE_URL' },
};

async function checkModel(testUrl: string, apiKey: string) {
  try {
    const r = await fetch(testUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok)            return { available: true };
    if (r.status === 401) return { available: false, error: 'INVALID API KEY' };
    return { available: false, error: `SERVICE ERROR ${r.status}` };
  } catch {
    return { available: false, error: 'CONNECTION TIMEOUT' };
  }
}

export async function GET() {
  const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  let ollamaAlive = false;
  try {
    const r = await fetch(`${ollamaBase}/api/tags`, { signal: AbortSignal.timeout(5000) });
    ollamaAlive = r.ok;
  } catch {}

  const models: Record<string, { available: boolean; error?: string }> = {};
  await Promise.all(
    Object.entries(MODEL_CHECKS).map(async ([id, cfg]) => {
      if (id === 'ethan' || id === 'fast') {
        models[id] = ollamaAlive ? { available: true } : { available: false, error: 'MODEL UNAVAILABLE' };
        return;
      }
      const key = process.env[cfg.envKey];
      if (!key) { models[id] = { available: false, error: 'API KEY MISSING' }; return; }
      models[id] = cfg.testUrl ? await checkModel(cfg.testUrl, key) : { available: true };
    }),
  );

  return NextResponse.json({ status: 'ok', ollamaAlive, models });
}
