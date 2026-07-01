/**
 * ChatEmptyState — 灵阁待命态
 * 空会话不是欢迎页，而是当前工作台的低噪声状态面板。
 */
import { motion } from 'motion/react';
import { Send, Sparkles } from 'lucide-react';
import VintageCar from './VintageCar';
import { PRESET_QUERIES, PRESET_SHORT_LABELS } from '../config/presets';

interface ChatEmptyStateProps {
  lang: 'zh' | 'en';
  inputVal: string;
  setInputVal: (v: string) => void;
  onSend: (text: string) => void;
}

export function ChatEmptyState({ lang, inputVal, setInputVal, onSend }: ChatEmptyStateProps) {
  const zh = lang === 'zh';
  const standbyRows = [
    { label: zh ? '上下文' : 'CONTEXT', value: zh ? '灵阁 / 创意灵感' : 'Muse / Creative Signal' },
    { label: zh ? '今日焦点' : 'FOCUS', value: zh ? 'GyenBox + Prism-Edge' : 'GyenBox + Prism-Edge', tone: 'primary' },
    { label: zh ? '待裁决' : 'UNRESOLVED', value: zh ? <>DGWM 3 个 canonical <em>候选</em></> : <>DGWM 3 canonical <em>candidates</em></>, tone: 'warn' },
    { label: zh ? '本地' : 'LOCAL', value: zh ? '档案可写入 / 云同步就绪' : 'archive writable / sync ready' },
  ];
  const liveSignals = [
    { label: 'GYENBOX', value: zh ? '3 文件未提交' : '3 files pending', tone: 'primary' },
    { label: 'PRISM', value: zh ? 'V2 冻结' : 'V2 frozen', tone: 'warn' },
    { label: 'TEMPORA', value: zh ? '7D 停滞' : '7D idle' },
  ];

  return (
    <motion.div key="empty" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}
      className="gsyen-standby-shell h-full px-4 pt-8 md:px-8 md:pt-10">
      <div className="gsyen-standby-frame">
        <div className="gsyen-standby-header">
          <div className="gsyen-standby-mark">
            <VintageCar size={30} strokeWidth={1.5} className="text-[#1A1A1A]/90" />
          </div>
          <div className="min-w-0">
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
              <span>LIVE</span>
            </div>
            {liveSignals.map(signal => (
              <div key={signal.label} className={`gsyen-standby-signal ${signal.tone ? `is-${signal.tone}` : ''}`}>
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSend(inputVal); }} className="gsyen-standby-input">
          <textarea autoFocus rows={3} value={inputVal} onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(inputVal); } }}
            placeholder={zh ? '输入一个想法、任务、判断或需要缈缈处理的信号...' : 'Enter a thought, task, decision, or signal for Muse...'}
            className="w-full resize-none bg-transparent px-4 py-3 font-sans text-sm leading-relaxed text-[#1A1A1A] outline-none placeholder:text-[#1A1A1A]/28" />
          <div className="gsyen-standby-input-footer">
            <span>{zh ? 'ENTER 发送 / SHIFT 换行' : 'ENTER SEND / SHIFT NEW LINE'}</span>
            <button type="submit" disabled={!inputVal.trim()} aria-label={zh ? '发送消息' : 'Send message'}>
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


