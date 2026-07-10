/**
 * ChatModule — session and streaming coordinator.
 * Visual shell pieces live in small components to keep the file under 300 lines.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

import { ChatMessage, ActionCard, ChatAttachment } from '../types/chat';
import { useChatSession } from '../hooks/useChatSession';
import { useChatStream } from '../hooks/useChatStream';
import { useModelScroll } from '../hooks/useModelScroll';
import { usePreferredModel } from '../hooks/usePreferredModel';
import { useTeams } from '../hooks/useTeams';
import { useTeamPanel } from '../hooks/useTeamPanel';
import { useFriends } from '../hooks/useFriends';
import { canvasStore } from '../stores/canvasStore';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatSidebar } from './ChatSidebar';
import { ChatEmptyState } from './ChatEmptyState';
import { CanvasEditorContent } from './CanvasEditorContent';
import { ModelStatusPanel } from './ModelStatusPanel';
import { TeamMembersPanel } from './TeamMembersPanel';
import { FriendsPanel } from './FriendsPanel';
import { ChatCreateTeamModal } from './ChatCreateTeamModal';
import { ChatSavePrompt, useChatSavePrompt } from './ChatSavePrompt';
import { ChatInputBar } from './ChatInputBar';
import { ChatCommandDeck } from './ChatCommandDeck';

interface ChatModuleProps { lang: 'zh' | 'en'; onTeamChange?: (active: boolean) => void }

export default function ChatModule({ lang, onTeamChange }: ChatModuleProps) {
  const [inputVal, setInputVal] = useState('');
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [pulseDocked, setPulseDocked] = useState(false);
  const [modelPanelOpen, setModelPanelOpen] = useState(false);
  const { selectedModel, setSelectedModel } = usePreferredModel();
  const [toast, setToast] = useState<string | null>(null);
  const [creativeDocId, setCreativeDocId] = useState<string | null>(null);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const { friends } = useFriends();

  const { teams } = useTeams();
  const { selectedTeam, showPanel, members, selectTeam, clearTeam } = useTeamPanel(onTeamChange);
  const { modelScrollRef, onMsDragStart, onMsDragMove, onMsDragEnd } = useModelScroll();
  const { messages, sessions, currentSessionId, currentTeamId, setMessages, saveChat, loadSession, deleteSession, newChat, openTeamSession } =
    useChatSession(lang);
  const { show: savePrompt, dismiss: dismissSavePrompt } = useChatSavePrompt(messages);
  const { isLoading, send } = useChatStream();

  const pendingCard = useRef<ActionCard | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const pulseDockLock = useRef(false);
  const pulseDockTarget = useRef(false);

  useEffect(() => {
    const toggle = () => setShowFriends(v => !v);
    window.addEventListener('gsyen-toggle-friends-panel', toggle);
    return () => window.removeEventListener('gsyen-toggle-friends-panel', toggle);
  }, []);

  useEffect(() => {
    if (isAtBottom.current) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const openCreativeKingdom = useCallback(() => {
    const now = new Date().toISOString();
    const doc = { id: `canvas-${Date.now()}`, title: '无标题', content: '', type: 'doc' as const,
      scope: 'self' as const, createdAt: now, updatedAt: now };
    canvasStore.add(doc);
    setCreativeDocId(doc.id);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleLoadSession = useCallback((s: Parameters<typeof loadSession>[0]) => { loadSession(s); setSelectedModel(s.model); clearTeam(); }, [loadSession, setSelectedModel, clearTeam]);
  const handleNewChat = useCallback(() => { newChat(selectedModel); clearTeam(); }, [newChat, selectedModel, clearTeam]);
  const handleSelectTeam = useCallback((team: Parameters<typeof selectTeam>[0]) => {
    selectTeam(team);
    openTeamSession(team.id);
  }, [selectTeam, openTeamSession]);

  const handleToggleSidebar = useCallback(() => setSidebarOpen(o => !o), []);
  const handleTogglePulse = useCallback(() => {
    setPulseOpen(v => !v);
    setModelPanelOpen(false);
  }, []);
  const handleClosePulse = useCallback(() => setPulseOpen(false), []);
  const handleToggleModelPanel = useCallback(() => {
    setModelPanelOpen(v => !v);
    setPulseOpen(false);
  }, []);

  const handleSend = useCallback(async (text: string, attachments: ChatAttachment[] = []) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments,
    };
    const history = [...messages, userMsg];

    saveChat(history, selectedModel);
    setInputVal('');

    if (currentTeamId && !/^@缈缈|^@miaomiao/i.test(text.trimStart())) return;

    const aiId = `ai-${Date.now()}`;
    const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([...history, { id: aiId, role: 'model', content: '', timestamp: aiTime, streaming: true }]);

    await send({
      text,
      attachments,
      model: selectedModel,
      history: messages,
      lang,
      onToken: (partial) => {
        setMessages([...history, {
          id: aiId, role: 'model', content: partial, timestamp: aiTime,
          card: pendingCard.current ?? undefined, streaming: true,
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
          query: '📅 已查询今日日程',
        };
        const en: Record<string, string> = {
          create: `✅ Event created: ${title}`,
          update: `✏️ Event updated: ${title}`,
          delete: `🗑️ Event deleted: ${title}`,
          query: "📅 Today's schedule retrieved",
        };
        showToast(lang === 'zh' ? (zh[action] ?? `✅ ${title}`) : (en[action] ?? `✅ ${title}`));
      },
    });
  }, [isLoading, messages, selectedModel, lang, saveChat, setMessages, send, currentTeamId, showToast]);

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedId(id);
    setTimeout(() => setIsCopiedId(null), 2000);
  }, []);

  const handlePulseDockToggle = useCallback(() => {
    if (pulseDockLock.current) return;
    pulseDockLock.current = true;
    setPulseDocked(v => {
      const next = !v;
      pulseDockTarget.current = next;
      return next;
    });
    setPulseOpen(false);
  }, []);
  const handlePulseDockAnimationComplete = useCallback((docked: boolean) => {
    if (pulseDockTarget.current === docked) pulseDockLock.current = false;
  }, []);

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 bg-[#F9F8F6]" id="ai-chat-root-workspace">
        {toast && (
          <div className="fixed bottom-6 right-6 bg-[#1A1A1A] text-[#F9F8F6] px-5 py-3 text-xs font-mono uppercase tracking-widest z-50 flex items-center gap-2 border border-emerald-900/40">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {toast}
          </div>
        )}

        <ChatCommandDeck
          lang={lang}
          sidebarOpen={sidebarOpen}
          pulseOpen={pulseOpen}
          pulseDocked={pulseDocked}
          modelPanelOpen={modelPanelOpen}
          selectedModel={selectedModel}
          modelScrollRef={modelScrollRef}
          onToggleSidebar={handleToggleSidebar}
          onNewChat={handleNewChat}
          onOpenCreativeKingdom={openCreativeKingdom}
          onTogglePulse={handleTogglePulse}
          onTogglePulseDock={handlePulseDockToggle}
          onClosePulse={handleClosePulse}
          onToggleModelPanel={handleToggleModelPanel}
          onPulseDockAnimationComplete={handlePulseDockAnimationComplete}
          onSelectModel={setSelectedModel}
          onMsDragStart={onMsDragStart}
          onMsDragMove={onMsDragMove}
          onMsDragEnd={onMsDragEnd}
        />

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

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F9F8F6]">
            <div ref={chatContainerRef} onScroll={() => {
              const el = chatContainerRef.current;
              if (!el) return;
              isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
            }} className="gsyen-chat-scroll flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
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

          <AnimatePresence initial={false}>
            {modelPanelOpen && <ModelStatusPanel key="model-status" lang={lang} selectedModel={selectedModel} onSelectModel={setSelectedModel} onClose={() => setModelPanelOpen(false)} contextLabel={selectedTeam?.name} />}
          </AnimatePresence>
          {!modelPanelOpen && (showPanel && selectedTeam
            ? <TeamMembersPanel team={selectedTeam} members={members} onClose={clearTeam} />
            : showFriends && <FriendsPanel friends={friends} onClose={() => setShowFriends(false)} />)}
        </div>
      </div>
      {creativeDocId && <CanvasEditorContent docId={creativeDocId} onClose={() => setCreativeDocId(null)} />}
      <ChatCreateTeamModal open={createTeamOpen} zh={lang === 'zh'} onClose={() => setCreateTeamOpen(false)} />
      {savePrompt && <ChatSavePrompt onSave={() => { saveChat(messages, selectedModel); dismissSavePrompt(); }}
        onDiscard={() => { handleNewChat(); dismissSavePrompt(); }} />}
    </>
  );
}
