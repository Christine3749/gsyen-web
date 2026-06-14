import { useState, useEffect } from 'react';
import { ChatMessage } from '../types/chat';

interface Props {
  onSave: () => void;
  onDiscard: () => void;
}

export function ChatSavePrompt({ onSave, onDiscard }: Props) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-[#F9F8F6] px-5 py-3 flex items-center gap-4 shadow-2xl border border-white/10">
      <span className="text-[10px] font-mono tracking-widest uppercase text-[#F9F8F6]/60">
        将此对话保存到账号？
      </span>
      <button onClick={onSave}
        className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-[#F9F8F6] text-[#1A1A1A] hover:bg-white transition-colors rounded-none">
        保存
      </button>
      <button onClick={onDiscard}
        className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase border border-white/20 text-[#F9F8F6]/50 hover:text-[#F9F8F6] transition-colors rounded-none">
        放弃
      </button>
    </div>
  );
}

export function useChatSavePrompt(messages: ChatMessage[]) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => { if (messages.some(m => m.role === 'user')) setShow(true); };
    window.addEventListener('gsyen-user-signed-in', fn);
    return () => window.removeEventListener('gsyen-user-signed-in', fn);
  }, [messages]);
  return { show, dismiss: () => setShow(false) };
}
