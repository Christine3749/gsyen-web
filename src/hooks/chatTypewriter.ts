const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>(resolve => {
    if (signal?.aborted) { resolve(); return; }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      resolve();
    }, { once: true });
  });

const jitter = (base: number, spread: number) => base + Math.random() * spread;
const FIRST_TOKEN_DELAY = 130;
const IDLE_POLL_DELAY = 24;

function charDelay(char: string, backlog = 0): number {
  if ('。！？…'.includes(char)) return jitter(320, 220);
  if ('，、；：'.includes(char)) return jitter(150, 120);
  if (char === '\n') return jitter(240, 190);
  if (backlog > 360) return jitter(18, 16);
  if (backlog > 160) return jitter(26, 18);
  if (Math.random() < 0.04) return jitter(95, 110);
  return jitter(38, 26);
}

export async function typewrite(
  text: string,
  onToken: (t: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let displayed = '';
  if (text) await sleep(FIRST_TOKEN_DELAY, signal);
  for (const char of text) {
    if (signal?.aborted) return;
    displayed += char;
    onToken(displayed);
    await sleep(charDelay(char), signal);
  }
}

export async function streamWithTypewriter(
  source: AsyncIterable<string>,
  onToken: (t: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  let fullText = '';
  let displayed = '';
  let queue = '';
  let done = false;
  let producerError: unknown = null;

  const producer = (async () => {
    try {
      for await (const delta of source) {
        fullText += delta;
        queue += delta;
      }
    } catch (err) {
      producerError = err;
    } finally {
      done = true;
    }
  })();

  while (!done || queue.length > 0) {
    if (signal?.aborted) {
      await producer.catch(() => undefined);
      return fullText || displayed;
    }
    if (!queue.length) {
      await sleep(IDLE_POLL_DELAY, signal);
      continue;
    }

    const backlog = queue.length;
    if (!displayed) await sleep(FIRST_TOKEN_DELAY, signal);
    const take = 1;
    const chunk = queue.slice(0, take);
    queue = queue.slice(take);
    displayed += chunk;
    onToken(displayed);
    await sleep(charDelay(chunk[chunk.length - 1], backlog), signal);
  }

  await producer;
  if (producerError) throw producerError;
  return fullText || displayed;
}
