import type { Request, Response } from 'express';
import { streamCodexAppServer } from './codexAppServer';
import { runCodexBridge, type CodexBridgeInput } from './codexBridge';

function writeSse(res: Response, content: string) {
  if (res.destroyed || res.writableEnded) return;
  res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
}

function canFallback(message = ''): boolean {
  return /APP SERVER|CODEX SESSION|NOT READY|UNAVAILABLE|WS ERROR|WS TIMEOUT/i.test(message);
}

export async function streamCodexChatResponse(req: Request, res: Response, input: CodexBridgeInput) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const controller = new AbortController();
  let finished = false;
  let wroteAny = false;
  req.on('close', () => {
    if (!finished) controller.abort();
  });

  try {
    const text = await streamCodexAppServer(input, delta => {
      wroteAny = true;
      writeSse(res, delta);
    }, { signal: controller.signal });
    if (!text.trim()) writeSse(res, '我在，但这次没有生成有效回复。');
  } catch (err: any) {
    console.error('Codex app-server stream failed:', err);
    if (!controller.signal.aborted && !wroteAny && canFallback(err?.message)) {
      try {
        const text = await runCodexBridge({ ...input, timeoutMs: 45_000 });
        writeSse(res, text);
      } catch (fallbackErr: any) {
        writeSse(res, `CHATGPT 本地桥接暂时不可用：${fallbackErr?.message || err?.message || 'UNKNOWN ERROR'}`);
      }
    } else if (!controller.signal.aborted && !wroteAny) {
      writeSse(res, `CHATGPT 本地常驻桥接失败：${err?.message || 'UNKNOWN ERROR'}`);
    }
  } finally {
    finished = true;
    if (!res.destroyed && !res.writableEnded) res.end('data: [DONE]\n\n');
  }
}
