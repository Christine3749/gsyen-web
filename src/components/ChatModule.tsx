/**
 * ChatModule — UI shell only (~280 lines).
 * Business logic lives in:
 *   hooks/useChatSession   — session persistence
 *   hooks/useChatStream    — streaming + schedule bridge
 *   hooks/useModelScroll   — drag-to-scroll model selector
 *   hooks/useTeams         — Supabase team list
 *   hooks/useTeamPanel     — team panel state + event listener
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronUp, MessageSquare, PanelLeft, Plus, Sparkles } from 'lucide-react';

import { ChatMessage, ActionCard } from '../types/chat';
import { ModelId, MODELS } from '../config/models';
import { useChatSession } from '../hooks/useChatSession';
import { useChatStream } from '../hooks/useChatStream';
import { useModelScroll } from '../hooks/useModelScroll';
import { useTeams } from '../hooks/useTeams';
import { useTeamPanel } from '../hooks/useTeamPanel';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatSidebar } from './ChatSidebar';
import { ChatEmptyState } from './ChatEmptyState';
import { CanvasEditorContent } from './CanvasEditorContent';
import { ModelStatusLight } from './ModelStatusLight';
import { ModelStatusPanel } from './ModelStatusPanel';
import { TeamMembersPanel } from './TeamMembersPanel';
import { FriendsPanel } from './FriendsPanel';
import { ChatCreateTeamModal } from './ChatCreateTeamModal';
import { useFriends } from '../hooks/useFriends';
import { canvasStore } from '../stores/canvasStore';
import { ChatSavePrompt, useChatSavePrompt } from './ChatSavePrompt';
import { ChatInputBar } from './ChatInputBar';

interface ChatModuleProps { lang: 'zh' | 'en'; onTeamChange?: (active: boolean) => void }

export default function ChatModule({ lang, onTeamChange }: ChatModuleProps) {
  const [inputVal, setInputVal]       = useState('');
  const [isCopiedId, setIsCopiedId]   = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [pulseOpen, setPulseOpen]     = useState(false);
  const [modelPanelOpen, setModelPanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('ethan');
  const [toast, setToast]             = useState<string | null>(null);
  const [creativeDocId, setCreativeDocId]   = useState<string | null>(null);
  const [createTeamOpen, setCreateTeamOpen]   = useState(false);
  const [showFriends,    setShowFriends]       = useState(false);
  const { friends } = useFriends();

  const { teams }                                                  = useTeams();
  const { selectedTeam, showPanel, members, selectTeam, clearTeam } = useTeamPanel(onTeamChange);
  const { modelScrollRef, onMsDragStart, onMsDragMove, onMsDragEnd } = useModelScroll();

  useEffect(() => {
    const toggle = () => setShowFriends(v => !v);
    window.addEventListener('gsyen-toggle-friends-panel', toggle);
    return () => window.removeEventListener('gsyen-toggle-friends-panel', toggle);
  }, []);

  const openCreativeKingdom = () => {
    const now = new Date().toISOString();
    const doc = { id: `canvas-${Date.now()}`, title: '无标题', content: '', type: 'doc' as const,
      scope: 'self' as const, createdAt: now, updatedAt: now };
    canvasStore.add(doc);
    setCreativeDocId(doc.id);
  };

  const { messages, sessions, currentSessionId, currentTeamId, setMessages, saveChat, loadSession, deleteSession, newChat, openTeamSession } =
    useChatSession(lang);
  const { show: savePrompt, dismiss: dismissSavePrompt } = useChatSavePrompt(messages);

  const handleLoadSession = (s: Parameters<typeof loadSession>[0]) => { loadSession(s); clearTeam(); };
  const handleNewChat = () => { newChat(selectedModel); clearTeam(); };
  const handleSelectTeam = (team: Parameters<typeof selectTeam>[0]) => {
    selectTeam(team);
    openTeamSession(team.id);
  };
  const { isLoading, send } = useChatStream();
  const pendingCard = useRef<ActionCard | null>(null);

  const chatEndRef       = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottom       = useRef(true);

  useEffect(() => {
    if (isAtBottom.current) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const history = [...messages, userMsg];

    saveChat(history, selectedModel);
    setInputVal('');

    // 团队 session：只有 @缈缈 才触发 AI
    if (currentTeamId && !/^@缈缈|^@miaomiao/i.test(text.trimStart())) return;

    const aiId   = `ai-${Date.now()}`;
    const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages([...history, { id: aiId, role: 'model', content: '▍', timestamp: aiTime }]);

    await send({
      text, model: selectedModel, history: messages, lang,
      onToken: (partial) => {
        setMessages([...history, {
          id: aiId, role: 'model', content: partial, timestamp: aiTime,
          card: pendingCard.current ?? undefined,
        }]);
      },
      onActionCard: (card) => {
        pendingCard.current = card;
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, card } : m));
      },
      onDone: (full) => {
        const card = pendingCard.current ?? undefined;
        pendingCard.current = null;
        saveChat([...history, { id: aiId, role: 'model', content: full, timestamp: aiTime, card }], selectedModel);
      },
      onError: (errMsg) => {
        pendingCard.current = null;
        saveChat([...history, { id: `err-${Date.now()}`, role: 'model', content: errMsg, timestamp: aiTime }], selectedModel);
      },
      onScheduleAction: (action, title) => {
        const zh: Record<string, string> = {
          create: `✅ 日程已创建：${title}`,
          update: `✏️ 日程已更新：${title}`,
          delete: `🗑️ 日程已删除：${title}`,
          query:  `📅 已查询今日日程`,
        };
        const en: Record<string, string> = {
          create: `✅ Event created: ${title}`,
          update: `✏️ Event updated: ${title}`,
          delete: `🗑️ Event deleted: ${title}`,
          query:  `📅 Today's schedule retrieved`,
        };
        showToast(lang === 'zh' ? (zh[action] ?? `✅ ${title}`) : (en[action] ?? `✅ ${title}`));
      },
    });
  }, [isLoading, messages, selectedModel, lang, saveChat, setMessages, send, currentTeamId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const gyenPulseSignals = [
    {
      label: 'GYENBOX',
      value: '3',
      unit: lang === 'zh' ? '文件' : 'FILES',
      detail: lang === 'zh' ? '桌面端未提交 Rust 修改' : 'desktop pending Rust changes',
      action: lang === 'zh' ? '进入项目' : 'Open',
    },
    {
      label: 'DGWM',
      value: '3',
      unit: lang === 'zh' ? '候选' : 'CANDIDATES',
      detail: lang === 'zh' ? 'canonical 候选待裁决' : 'canonical candidates to decide',
      action: lang === 'zh' ? '转任务' : 'Task',
    },
    {
      label: 'PRISM',
      value: 'V2',
      unit: lang === 'zh' ? '冻结' : 'FROZEN',
      detail: lang === 'zh' ? 'Prism-Edge 等待 DGWM adapter' : 'Prism-Edge waits for DGWM adapter',
      action: lang === 'zh' ? '进入项目' : 'Open',
    },
    {
      label: lang === 'zh' ? '小纸笺' : 'ZHIJIAN',
      value: '94',
      unit: lang === 'zh' ? '改动' : 'CHANGES',
      detail: lang === 'zh' ? '设计系统今日改动，建议冻结版本' : 'design system changes, freeze version',
      action: lang === 'zh' ? '归档' : 'Archive',
    },
    {
      label: 'TEMPORA',
      value: '7D',
      unit: lang === 'zh' ? '停滞' : 'IDLE',
      detail: lang === 'zh' ? 'Tempora Find 7 天无动作，保持 frozen' : 'Tempora Find idle, keep frozen',
      action: lang === 'zh' ? '忽略' : 'Ignore',
    },
    {
      label: lang === 'zh' ? '今日推进' : 'FOCUS',
      value: '2',
      unit: lang === 'zh' ? '项目' : 'PROJECTS',
      detail: lang === 'zh' ? 'GyenBox + Prism-Edge' : 'GyenBox + Prism-Edge',
      action: lang === 'zh' ? '置顶' : 'Pin',
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedId(id);
    setTimeout(() => setIsCopiedId(null), 2000);
  };

  return (
    <>
    <div className="flex-1 flex flex-col min-h-0 bg-[#F9F8F6]" id="ai-chat-root-workspace">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1A1A1A] text-[#F9F8F6] px-5 py-3 text-xs font-mono uppercase tracking-widest z-50 flex items-center gap-2 border border-emerald-900/40">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Status bar */}
      <div className={`gsyen-command-deck relative shrink-0 h-[56px] px-8 border-y border-[#1A1A1A]/10 bg-[#ECE9E3] flex items-center justify-between text-[#1A1A1A]/70 ${pulseOpen ? 'has-pulse-open' : ''} ${modelPanelOpen ? 'has-model-open' : ''}`}>
        <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-6">
          <button onClick={() => setSidebarOpen(o => !o)} aria-label={lang === 'zh' ? '切换档案库' : 'Toggle archive'} aria-pressed={sidebarOpen} className={`gsyen-icon-command ${sidebarOpen ? 'is-active' : ''}`}>
            <PanelLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNewChat} className="gsyen-command-button" aria-label={lang === 'zh' ? '新建对话' : 'New chat'}>
            <Plus className="w-3 h-3" /><span>NEW</span>
          </button>
          <button onClick={openCreativeKingdom}
            className="gsyen-command-button" aria-label={lang === 'zh' ? '打开创意灵感' : 'Open muse'}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '创意灵感' : 'Muse'}</span>
          </button>
          <button type="button" onClick={() => setPulseOpen(v => !v)}
            className={`gsyen-pulse-tape gsyen-system-bus ${pulseOpen ? 'is-open' : ''}`}
            aria-expanded={pulseOpen} aria-label={lang === 'zh' ? '展开疆域脉搏' : 'Toggle GYEN pulse'}>
            <span className="gsyen-system-bus-label">
              GYEN PULSE
            </span>
            <span className="gsyen-pulse-window gsyen-system-bus-window">
              <span className="gsyen-pulse-marquee gsyen-system-bus-track">
                {gyenPulseSignals.map(signal => (
                  <span key={`a-${signal.label}-${signal.value}`} className="gsyen-system-cell">
                    <span className="gsyen-system-cell-name">{signal.label}</span>
                    <span className="gsyen-system-cell-value">{signal.value}</span>
                    <span className="gsyen-system-cell-unit">{signal.unit}</span>
                  </span>
                ))}
                {gyenPulseSignals.map(signal => (
                  <span key={`b-${signal.label}-${signal.value}`} className="gsyen-system-cell" aria-hidden="true">
                    <span className="gsyen-system-cell-name">{signal.label}</span>
                    <span className="gsyen-system-cell-value">{signal.value}</span>
                    <span className="gsyen-system-cell-unit">{signal.unit}</span>
                  </span>
                ))}
              </span>
            </span>
            <span className="gsyen-system-count">
              <span>{gyenPulseSignals.length}</span>
              {pulseOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </button>
        </div>

        <div className="gsyen-model-strip">
          <div className="flex items-center gap-2">
            <span className="gsyen-model-label">MODEL</span>
            <div ref={modelScrollRef} onMouseDown={onMsDragStart} onMouseMove={onMsDragMove} onMouseUp={onMsDragEnd} onMouseLeave={onMsDragEnd}
              className="gsyen-model-selector"
              style={{ maxWidth: 224, cursor: 'grab' }}>
              {MODELS.map(m => (
                <button key={m.id} onClick={() => !m.disabled && setSelectedModel(m.id as ModelId)} disabled={m.disabled}
                  className={`gsyen-model-option ${m.disabled ? 'is-disabled' : selectedModel === m.id ? 'is-active' : ''}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <ModelStatusLight selectedModel={selectedModel} active={modelPanelOpen} onClick={() => setModelPanelOpen(v => !v)} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {pulseOpen && (
          <motion.div key="pulse-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="gsyen-pulse-panel shrink-0 overflow-hidden border-b border-[#1A1A1A]/20 bg-[#151412] text-[#F4F2EE] shadow-[inset_0_1px_0_rgba(215,181,109,0.18)]">
            <div className="px-8 py-2">
              <div className="gsyen-pulse-panel-head flex h-7 items-center justify-between border-b border-[#D7B56D]/20 font-mono fs-xs font-bold uppercase tracking-widest">
                <div className="flex items-center text-[#D7B56D]">
                  <span>{lang === 'zh' ? '今日疆域状态' : 'Today GYEN State'}</span>
                </div>
                <button onClick={() => setPulseOpen(false)}
                  className="text-[#F4F2EE]/45 transition-colors hover:text-[#D7B56D]">
                  {lang === 'zh' ? '收起' : 'Collapse'} ▲
                </button>
              </div>
              <div className="grid gap-0 py-1">
                {gyenPulseSignals.map((signal) => (
                  <div key={`${signal.label}-${signal.value}-${signal.detail}`} className="gsyen-pulse-panel-row grid h-8 grid-cols-[96px_48px_72px_minmax(0,1fr)_84px] items-center border-b border-white/[0.06] last:border-b-0">
                    <span className="font-mono fs-xs font-bold tracking-widest text-[#F4F2EE]/38">{signal.label}</span>
                    <span className="font-mono fs-xs font-bold tracking-widest text-[#D7B56D]/90">{signal.value}</span>
                    <span className="font-mono fs-xs font-bold tracking-widest text-[#F4F2EE]/40">{signal.unit}</span>
                    <span className="truncate fs-sm text-[#F4F2EE]/82">{signal.detail}</span>
                    <button className="gsyen-pulse-panel-action h-6 justify-self-end border border-[#F4F2EE]/18 px-2 font-mono fs-xs font-bold tracking-widest text-[#F4F2EE]/62 transition-colors hover:border-[#D7B56D]/70 hover:text-[#D7B56D]">
                      {signal.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body: sidebar + chat + team panel */}
      <div className="flex-grow flex flex-col md:flex-row min-h-0">

        <ChatSidebar
          lang={lang}
          open={sidebarOpen}
          recentsOpen={recentsOpen}
          setRecentsOpen={setRecentsOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          loadSession={handleLoadSession}
          deleteSession={deleteSession}
          onNewChat={handleNewChat}
          teams={teams}
          selectedTeamId={selectedTeam?.id}
          onSelectTeam={(t) => handleSelectTeam(t as any)}
          onCreateTeam={() => setCreateTeamOpen(true)}
        />

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F9F8F6]">
          <div ref={chatContainerRef} onScroll={() => {
            const el = chatContainerRef.current; if (!el) return;
            isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
          }} className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">

            {messages.length === 0 && !isLoading && (
              <ChatEmptyState lang={lang} inputVal={inputVal} setInputVal={setInputVal} onSend={handleSend} />
            )}

            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <ChatMessageBubble key={msg.id} msg={msg} lang={lang} isCopiedId={isCopiedId} onCopy={handleCopy} />
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex gap-3 max-w-3xl">
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1A1A1A] text-[#F9F8F6] shrink-0 mt-1">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="space-y-1">
                  <div className="fs-xs font-mono tracking-wider uppercase text-neutral-400">
                    <span className="font-bold text-[#1A1A1A]/50">{lang === 'zh' ? 'Atelier AI' : 'ATELIER AI'}</span>
                  </div>
                  <div className="pt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <ChatInputBar lang={lang} inputVal={inputVal} hidden={messages.length === 0}
            onInputChange={setInputVal} onSend={handleSend}
            onClear={() => { if (window.confirm(lang === 'zh' ? '确定清空所有聊天记录？' : 'Wipe all history?')) newChat(selectedModel); }} />
        </div>

        {/* Right panel: model status, team members or friends */}
        {modelPanelOpen
          ? <ModelStatusPanel lang={lang} selectedModel={selectedModel} onSelectModel={setSelectedModel} onClose={() => setModelPanelOpen(false)} contextLabel={selectedTeam?.name} />
          : showPanel && selectedTeam
          ? <TeamMembersPanel team={selectedTeam} members={members} onClose={clearTeam} />
          : showFriends && <FriendsPanel friends={friends} onClose={() => setShowFriends(false)} />
        }
      </div>
    </div>
    {creativeDocId && (
      <CanvasEditorContent docId={creativeDocId} onClose={() => setCreativeDocId(null)} />
    )}
    <ChatCreateTeamModal
      open={createTeamOpen}
      zh={lang === 'zh'}
      onClose={() => setCreateTeamOpen(false)}
    />
    {savePrompt && <ChatSavePrompt onSave={() => { saveChat(messages, selectedModel); dismissSavePrompt(); }}
      onDiscard={() => { handleNewChat(); dismissSavePrompt(); }} />}
    </>
  );
}


