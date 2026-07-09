import { useCallback, useState } from 'react';
import type { ChatAttachment } from '../types/chat';
import { imageFileToAttachment, isImageFile, MAX_CHAT_IMAGES } from '../utils/chatAttachments';

export function useImageAttachments() {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const addFiles = useCallback(async (files: File[]) => {
    const images = files.filter(isImageFile);
    if (!images.length) return;
    const results = await Promise.allSettled(images.map(imageFileToAttachment));
    const next = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    if (next.length !== images.length) console.warn('Some pasted images were skipped.');
    setAttachments(prev => [...prev, ...next].slice(0, MAX_CHAT_IMAGES));
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearAttachments = useCallback(() => setAttachments([]), []);

  return { attachments, addFiles, removeAttachment, clearAttachments };
}
