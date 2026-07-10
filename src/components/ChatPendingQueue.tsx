import { AnimatePresence, motion } from 'motion/react';
import { Clock3, Image as ImageIcon } from 'lucide-react';
import { ChatQueuedPrompt } from '../types/chat';

interface ChatPendingQueueProps {
  lang: 'zh' | 'en';
  prompts: ChatQueuedPrompt[];
}

export function ChatPendingQueue({ lang, prompts }: ChatPendingQueueProps) {
  const zh = lang === 'zh';

  return (
    <AnimatePresence initial={false}>
      {prompts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 8, height: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="gsyen-chat-pending-queue shrink-0 overflow-hidden border-t border-[#1A1A1A]/10 bg-[#F4F2EE]"
        >
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/55">
              <Clock3 className="h-3.5 w-3.5" />
              <span>{zh ? '等待发送' : 'Queued'}</span>
              <span className="text-[#1A1A1A]/35">{prompts.length}</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              {prompts.slice(0, 3).map((prompt, index) => (
                <div key={prompt.id}
                  className="flex min-w-0 max-w-[34%] items-center gap-2 border border-[#1A1A1A]/12 bg-white px-2.5 py-1.5">
                  <span className="shrink-0 font-mono text-[10px] font-bold tracking-widest text-[#1A1A1A]/35">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate text-xs font-medium text-[#1A1A1A]/72">
                    {prompt.text.trim() || (zh ? '图片信号' : 'Image signal')}
                  </span>
                  {prompt.attachments.length > 0 && (
                    <span className="ml-auto flex shrink-0 items-center gap-1 font-mono text-[10px] font-bold text-[#1A1A1A]/38">
                      <ImageIcon className="h-3 w-3" />
                      {prompt.attachments.length}
                    </span>
                  )}
                </div>
              ))}
              {prompts.length > 3 && (
                <span className="shrink-0 font-mono text-[10px] font-bold tracking-widest text-[#1A1A1A]/38">
                  +{prompts.length - 3}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
