import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildPrompt, type CodexBridgeInput } from './codexBridge';
import { imageAttachments } from '../shared/providerMessages';

interface CodexTurnInputPayload {
  parts: any[];
  cleanup: () => void;
}

function imageExtension(dataUrl: string): string {
  const mime = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)?.[1]?.toLowerCase();
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

function dataUrlToLocalImage(dataUrl: string, dir: string, index: number): string | null {
  const base64 = dataUrl.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i)?.[1];
  if (!base64) return null;
  const filePath = path.join(dir, `image-${index}.${imageExtension(dataUrl)}`);
  writeFileSync(filePath, Buffer.from(base64, 'base64'));
  return filePath;
}

export function buildCodexTurnInput(input: CodexBridgeInput): CodexTurnInputPayload {
  const parts: any[] = [{ type: 'text', text: buildPrompt(input), text_elements: [] }];
  const images = input.messages.flatMap(message => imageAttachments(message)).slice(-4);
  const tempDir = images.length ? mkdtempSync(path.join(tmpdir(), 'gsyen-codex-images-')) : null;

  images.forEach((image, index) => {
    const filePath = tempDir ? dataUrlToLocalImage(image.dataUrl || '', tempDir, index) : null;
    if (!filePath) return;
    parts.push({
      type: 'localImage',
      path: filePath,
    });
  });

  return {
    parts,
    cleanup: () => {
      if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    },
  };
}
