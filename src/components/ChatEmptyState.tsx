/**
 * ChatEmptyState — 灵阁待命态
 * 空会话不是欢迎页，而是当前工作台的低噪声状态面板。
 */
import { useRef, type ClipboardEvent } from 'react';
import { motion } from 'motion/react';
import { ImagePlus, Send, Sparkles, X } from 'lucide-react';
import VintageCar from './VintageCar';
import { PRESET_QUERIES, PRESET_SHORT_LABELS } from '../config/presets';
import { PULSE_FOCUS_LABEL, getPulseSignal, getStandbyPulseSignals } from '../config/pulseSignals';
import type { ChatAttachment } from '../types/chat';
import { useImageAttachments } from '../hooks/useImageAttachments';
import { isImageFile } from '../utils/chatAttachments';

interface ChatEmptyStateProps {
  lang: 'zh' | 'en';
  inputVal: string;
  setInputVal: (v: string) => void;
  onSend: (text: string, attachments?: ChatAttachment[]) => void;
}

export function ChatEmptyState({ lang, inputVal, setInputVal, onSend }: ChatEmptyStateProps) {
  const zh = lang === 'zh';
  const fileRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const compositionGuardUntil = useRef(0);
  const { attachments, addFiles, removeAttachment, clearAttachments } = useImageAttachments();
  const canSend = inputVal.trim().length > 0 || attachments.length > 0;
  const isComposing = () => composingRef.current || Date.now() < compositionGuardUntil.current;
  const dgwmSignal = getPulseSignal(lang, 'DGWM');
  const standbyRows = [
    { label: zh ? '上下文' : 'CONTEXT', value: zh ? '灵阁 / 创意灵感' : 'Muse / Creative Signal' },
    { label: zh ? '今日焦点' : 'FOCUS', value: PULSE_FOCUS_LABEL, tone: 'primary' },
    { label: zh ? '待裁决' : 'UNRESOLVED', value: dgwmSignal.summary, tone: 'warn' },
    { label: zh ? '本地' : 'LOCAL', value: zh ? '档案可写入 / 云同步就绪' : 'archive writable / sync ready' },
  ];
  const standbySignals = getStandbyPulseSignals(lang);

  const submit = () => {
    if (!canSend || isComposing()) return;
    onSend(inputVal, attachments);
    clearAttachments();
  };
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
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
    <motion.div key="empty" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}
      className="gsyen-standby-shell h-full px-4 pt-8 md:px-8 md:pt-10">
      <div className="gsyen-standby-frame">
        <div className="gsyen-standby-header">
          <div className="gsyen-standby-mark">
            <VintageCar size={30} strokeWidth={1.5} className="text-[#1A1A1A]/90" />
          </div>
          <div className="gsyen-standby-copy min-w-0">
            <p className="gsyen-standby-kicker">{zh ? 'ATELIER AI / SIGNAL READY' : 'ATELIER AI / SIGNAL READY'}</p>
            <h2 className="gsyen-standby-title">{zh ? '灵阁待命' : 'Muse Standby'}</h2>
          </div>
          <div className="gsyen-standby-index">
            <span>03</span>
            <small>{zh ? '未处理信号' : 'OPEN SIGNALS'}</small>
          </div>
        </div>

        <div className="gsyen-standby-grid">
          <div className="gsyen-standby-ledger">
            {standbyRows.map(row => (
              <div key={row.label} className={`gsyen-standby-row ${row.tone ? `is-${row.tone}` : ''}`}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>

          <div className="gsyen-standby-feed">
            <div className="gsyen-standby-feed-title">
              <span>{zh ? '疆域信号' : 'GYEN SIGNALS'}</span>
              <span>{zh ? '静态' : 'STATIC'}</span>
            </div>
            {standbySignals.map(signal => (
              <div key={signal.label} className={`gsyen-standby-signal ${signal.tone ? `is-${signal.tone}` : ''}`}>
                <span>{signal.label}</span>
                <strong>{signal.summary}</strong>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="gsyen-standby-input">
          {attachments.length > 0 && (
            <div className="flex gap-2 px-4 pt-3">
              {attachments.map(item => (
                <div key={item.id} className="relative h-16 w-24 border border-[#1A1A1A]/15 bg-[#F9F8F6]">
                  <img src={item.dataUrl} alt={item.name} className="h-full w-full object-cover" />
                  <button type="button" aria-label={zh ? '移除图片' : 'Remove image'}
                    onClick={() => removeAttachment(item.id)}
                    className="absolute -right-1.5 -top-1.5 p-0.5 bg-[#1A1A1A] text-white border border-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <textarea autoFocus rows={3} value={inputVal} onChange={e => setInputVal(e.target.value)}
            onPaste={handlePaste}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={() => {
              composingRef.current = false;
              compositionGuardUntil.current = Date.now() + 120;
            }}
            onDrop={e => { e.preventDefault(); void addFiles(Array.from(e.dataTransfer.files)); }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.nativeEvent.isComposing || isComposing())) return;
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            placeholder={zh ? '输入一个想法、任务、判断或需要缈缈处理的信号...' : 'Enter a thought, task, decision, or signal for Muse...'}
            className="w-full resize-none bg-transparent px-4 py-3 font-sans text-sm leading-relaxed text-[#1A1A1A] outline-none placeholder:text-[#1A1A1A]/28" />
          <div className="gsyen-standby-input-footer">
            <span>{zh ? 'ENTER 发送 / SHIFT 换行' : 'ENTER SEND / SHIFT NEW LINE'}</span>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => { void addFiles(Array.from(e.target.files ?? [])); e.currentTarget.value = ''; }} />
            <button type="button" onClick={() => fileRef.current?.click()} aria-label={zh ? '添加图片' : 'Add image'}>
              <ImagePlus className="w-3.5 h-3.5" />
            </button>
            <button type="submit" disabled={!canSend} aria-label={zh ? '发送消息' : 'Send message'}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="gsyen-standby-actions">
          {PRESET_QUERIES.map((q, idx) => (
            <button key={idx} onClick={() => onSend(zh ? q.zh : q.en)}>
              <Sparkles className="w-2.5 h-2.5" strokeWidth={1.6} />
              <span>{zh ? PRESET_SHORT_LABELS[idx].zh : PRESET_SHORT_LABELS[idx].en}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}


