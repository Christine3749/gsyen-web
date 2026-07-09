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

function charDelay(char: string, backlog = 0): number {
  if (backlog > 220) return jitter(4, 8);
  if (backlog > 90 && char !== '\n') return jitter(8, 14);
  if ('。！？…'.includes(char)) return jitter(260, 190);
  if ('，、；：'.includes(char)) return jitter(110, 90);
  if (char === '\n') return jitter(190, 180);
  if (Math.random() < 0.04) return jitter(70, 95);
  return jitter(24, 18);
}

export async function typewrite(
  text: string,
  onToken: (t: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let displayed = '';
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
      await sleep(18, signal);
      continue;
    }

    const backlog = queue.length;
    const take = backlog > 220 ? 3 : backlog > 120 ? 2 : 1;
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
