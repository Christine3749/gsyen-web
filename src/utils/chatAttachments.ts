import type { ChatAttachment } from '../types/chat';

export const MAX_CHAT_IMAGES = 4;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.9;

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export async function imageFileToAttachment(file: File): Promise<ChatAttachment> {
  if (!isImageFile(file)) throw new Error('NOT_IMAGE');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('IMAGE_TOO_LARGE');

  const rawDataUrl = await readDataUrl(file);
  const dataUrl = await optimizeImage(rawDataUrl, file.type).catch(() => rawDataUrl);
  const mimeType = dataUrl.match(/^data:([^;]+);base64,/)?.[1] ?? file.type ?? 'image/png';

  return {
    id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: 'image',
    name: file.name || `clipboard-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`,
    mimeType,
    dataUrl,
  };
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('READ_IMAGE_FAILED'));
    reader.readAsDataURL(file);
  });
}

async function optimizeImage(dataUrl: string, mimeType: string): Promise<string> {
  if (/svg|gif/i.test(mimeType)) return dataUrl;

  const img = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale >= 1 && dataUrl.length < 1_200_000) return dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
