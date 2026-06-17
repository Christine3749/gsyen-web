/**
 * POST /api/chat — Next.js Route Handler（Edge Runtime）
 * 从 api/chat.ts（Vercel Edge Function）直接移植，逻辑完全一致。
 * shared/ 目录是真源，两边共用。
 */
export const runtime = 'edge';

import { SYSTEM_PROMPT } from '../../../shared/systemPrompt';
import {
  todayDateStr,
  scheduleSystemSuffix,
  noScheduleSystemSuffix,
  ledgerSystemSuffix,
  mailSystemSuffix,
  vaultSystemSuffix,
  GEMINI_RESPONSE_SCHEMA,
  MODEL_ROUTES,
  INJECTION_PATTERNS,
} from '../../../shared/chatConfig';

function domainSuffix(domain: string | null, scheduleIntent: unknown, today: string, events: any[]): string {
  if (domain === 'MAIL')   return mailSystemSuffix();
  if (domain === 'VAULT')  return vaultSystemSuffix();
  if (domain === 'LEDGER') return ledgerSystemSuffix(today);
  if (scheduleIntent)      return scheduleSystemSuffix(today, events);
  return noScheduleSystemSuffix();
}

const sse  = (content: string) =>
  new Response(
    `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`,
    { headers: { 'Content-Type': 'text/event-stream' } },
  );
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { messages, model = 'kimi', events = [], clientDate, scheduleIntent = null, domain = null } = body;

    if (!messages || !Array.isArray(messages)) return json({ error: 'Missing messages' }, 400);

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
    if (INJECTION_PATTERNS.some((p: RegExp) => p.test(lastUserMsg))) return sse('我是缈缈，无法执行此指令。');

    const route = MODEL_ROUTES[model];
    if (!route) return json({ error: `Unknown model: ${model}` }, 400);

    const apiKey = process.env[route.envKey];
    if (!apiKey) return sse(`后台未检测到 \`${route.envKey}\` 密钥，请在环境变量中配置后重新部署。`);

    const today = clientDate || todayDateStr();

    // ── Gemini ────────────────────────────────────────────────────────────────
    if (model === 'gemini') {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages.map((m: any) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content }] })),
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT + domainSuffix(domain, scheduleIntent, today, events) }] },
            generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_RESPONSE_SCHEMA },
          }),
        },
      );
      if (!geminiRes.ok) return json({ error: `Gemini error: ${await geminiRes.text().catch(() => geminiRes.statusText)}` }, 502);
      const raw = (await geminiRes.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      try {
        const p = JSON.parse(raw);
        return json({ text: p.reply ?? raw, action: p.action ?? 'none', event: p.event?.title ? p.event : null });
      } catch { return json({ text: raw, event: null }); }
    }

    // ── Ollama (ethan / fast) ─────────────────────────────────────────────────
    if (model === 'ethan' || model === 'fast') {
      const ollamaRes = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: route.modelId,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + domainSuffix(domain, scheduleIntent, today, events) },
            ...messages.map((m: any) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
          ],
          stream: false, format: 'json', options: { temperature: 0.3 },
        }),
      });
      if (!ollamaRes.ok) return json({ error: `${model} error: ${await ollamaRes.text().catch(() => '')}` }, 502);
      const raw = (await ollamaRes.json()).message?.content ?? '{}';
      try {
        const p = JSON.parse(raw);
        const action = p.action ?? (p.shouldCreateEvent ? 'create' : 'none');
        const hasPayload = p.event?.title || p.event?.description || p.event?.amount !== undefined;
        const ev = (action !== 'none' && hasPayload) ? p.event : null;
        if (ev && domain !== 'LEDGER') {
          const lastMsg = [...messages].reverse().find((m: any) => m.role !== 'model')?.content ?? '';
          const hasDateRef = /明天|后天|大后天|下周|下个月|\d{1,2}[月\/-]\d{1,2}|星期[一二三四五六日天]|周[一二三四五六日天]/.test(lastMsg);
          const diff = Math.abs(new Date(today).getTime() - new Date(ev.date || '').getTime());
          if (!hasDateRef || !ev.date || diff > 30 * 86400_000) ev.date = today;
        }
        return json({ text: p.reply ?? raw, action, event: ev });
      } catch { return json({ text: raw, event: null }); }
    }

    // ── OpenAI-compat SSE (kimi / deepseek / claude / chatgpt) ───────────────
    const upstream = await fetch(route.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: route.modelId,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
        ],
        stream: true,
      }),
    });
    if (!upstream.ok) return sse(`⚠️ ${model} 错误：${await upstream.text().catch(() => upstream.statusText)}`);
    return new Response(upstream.body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
    });

  } catch (err: any) {
    return json({ error: err?.message || 'Gateway error' }, 500);
  }
}
