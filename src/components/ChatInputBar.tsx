import React, { useRef } from 'react';
import { ImagePlus, Send, Trash2, X } from 'lucide-react';
import { ChatAttachment } from '../types/chat';
import { isImageFile } from '../utils/chatAttachments';
import { useImageAttachments } from '../hooks/useImageAttachments';

interface ChatInputBarProps {
  lang: 'zh' | 'en';
  inputVal: string;
  hidden: boolean;
  onInputChange: React.Dispatch<React.SetStateAction<string>>;
  onSend: (text: string, attachments?: ChatAttachment[]) => void;
  onClear: () => void;
}

export function ChatInputBar({ lang, inputVal, hidden, onInputChange, onSend, onClear }: ChatInputBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const compositionGuardUntil = useRef(0);
  const { attachments, addFiles, removeAttachment, clearAttachments } = useImageAttachments();
  const canSend = inputVal.trim().length > 0 || attachments.length > 0;
  const isComposing = () => composingRef.current || Date.now() < compositionGuardUntil.current;

  const submit = () => {
    if (!canSend || isComposing()) return;
    onSend(inputVal, attachments);
    clearAttachments();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const files = Array.from(e.clipboardData.items)
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter((file): file is File => !!file);
    if (files.some(isImageFile)) {
      if (!e.clipboardData.getData('text/plain')) e.preventDefault();
      void addFiles(files);
    }
  };

  return (
    <div className={`gsyen-chat-input-bar shrink-0 p-4 border-t border-[#1A1A1A]/10 bg-white ${hidden ? 'hidden' : ''}`}>
      {attachments.length > 0 && (
        <div className="mb-2 flex items-center gap-2 overflow-x-auto">
          {attachments.map(item => (
            <div key={item.id} className="relative h-14 w-20 shrink-0 border border-[#1A1A1A]/15 bg-[#F9F8F6]">
              <img src={item.dataUrl} alt={item.name} className="h-full w-full object-cover" />
              <button type="button" aria-label={lang === 'zh' ? '移除图片' : 'Remove image'}
                onClick={() => removeAttachment(item.id)}
                className="absolute -right-1.5 -top-1.5 p-0.5 bg-[#1A1A1A] text-white border border-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="gsyen-chat-input-form flex items-center gap-2">
        <button type="button" onClick={onClear} aria-label={lang === 'zh' ? '清空对话' : 'Clear chat'}
          className="gsyen-chat-input-button p-3 border border-[#1A1A1A]/15 hover:bg-[#1A1A1A] hover:text-white transition-colors text-neutral-500 rounded-none shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { void addFiles(Array.from(e.target.files ?? [])); e.currentTarget.value = ''; }} />
        <button type="button" onClick={() => fileRef.current?.click()} aria-label={lang === 'zh' ? '添加图片' : 'Add image'}
          className="gsyen-chat-input-button p-3 border border-[#1A1A1A]/15 hover:bg-[#1A1A1A]/5 transition-colors text-neutral-500 rounded-none shrink-0">
          <ImagePlus className="w-4 h-4" />
        </button>
        <input type="text"
          placeholder={lang === 'zh' ? '向 Atelier AI 咨询任何品牌策划、符号创意、日程安排吧...' : 'Ask Atelier AI anything about brand, design, or schedules...'}
          value={inputVal} onChange={e => onInputChange(e.target.value)} onPaste={handlePaste}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={() => {
            composingRef.current = false;
            compositionGuardUntil.current = Date.now() + 120;
          }}
          onDrop={e => { e.preventDefault(); void addFiles(Array.from(e.dataTransfer.files)); }}
          className="gsyen-chat-input-field flex-grow p-3 bg-[#F9F8F6] border border-[#1A1A1A]/15 focus:border-[#1A1A1A] focus:bg-white rounded-none outline-none font-sans text-xs text-[#1A1A1A]" />
        <button type="submit" disabled={!canSend} aria-label={lang === 'zh' ? '发送消息' : 'Send message'}
          className="gsyen-chat-input-button p-3 bg-[#1A1A1A] text-white disabled:bg-[#1A1A1A]/10 disabled:text-neutral-300 transition-colors rounded-none shrink-0 border border-[#1A1A1A]">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
