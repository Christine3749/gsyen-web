import type { Response } from 'express';
import { streamCodexAppServer } from './codexAppServer';
import type { CodexBridgeInput } from './codexBridge';

function writeSse(res: Response, content: string) {
  res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
}

export async function streamCodexChatResponse(res: Response, input: CodexBridgeInput) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const text = await streamCodexAppServer(input, delta => writeSse(res, delta));
    if (!text.trim()) writeSse(res, '我在，但这次没有生成有效回复。');
  } catch (err: any) {
    console.error('Codex app-server stream failed:', err);
    writeSse(res, `CHATGPT 本地常驻桥接失败：${err?.message || 'UNKNOWN ERROR'}`);
  } finally {
    res.end('data: [DONE]\n\n');
  }
}
