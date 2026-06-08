import React, { useState, useEffect, useMemo } from 'react';
import { localDateStr } from '../utils/date';
import { EmailItem, MailFolder, MailCategory, ThreadMessage } from '../types/mail';
import { getDefaultEmails } from '../data/mailDefaults';

const LOCAL_STORAGE_KEY = 'atelier_workspace_mail_v2';

export function useMailStore(lang: 'zh' | 'en') {
  // ── Emails ──────────────────────────────────────────────────────────────
  const [emails, setEmails] = useState<EmailItem[]>([]);

  // ── Folder / Category ───────────────────────────────────────────────────
  const [currentFolder, setCurrentFolder] = useState<MailFolder>('inbox');
  const [currentCategoryTab, setCurrentCategoryTab] = useState<MailCategory>('primary');

  // ── Detail panel ────────────────────────────────────────────────────────
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState('');

  // ── Sidebar ─────────────────────────────────────────────────────────────
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ── Search / Filters ────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  // ── Multi-select ────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // ── Snooze ──────────────────────────────────────────────────────────────
  const [snoozeTargetId, setSnoozeTargetId] = useState<string | null>(null);
  const [showSnoozePopover, setShowSnoozePopover] = useState(false);
  const [snoozePositions, setSnoozePositions] = useState<{ x: number; y: number } | null>(null);

  // ── Toast ───────────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastUndoAction, setToastUndoAction] = useState<(() => void) | null>(null);
  const [toastTimer, setToastTimer] = useState<number | null>(null);

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try { setEmails(JSON.parse(saved)); } catch (e) { console.error('mail load error', e); }
    } else {
      const defaults = getDefaultEmails(lang);
      setEmails(defaults);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
    }
  }, [lang]);

  // ── Persistence ──────────────────────────────────────────────────────────
  const saveEmails = (list: EmailItem[]) => {
    setEmails(list);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  };

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message: string, undoAction?: () => void) => {
    if (toastTimer) window.clearTimeout(toastTimer);
    setToastMessage(message);
    setToastUndoAction(() => undoAction ?? null);
    const timer = window.setTimeout(() => {
      setToastMessage(null);
      setToastUndoAction(null);
    }, 6500);
    setToastTimer(timer);
  };

  const handleUndo = () => {
    if (toastUndoAction) {
      toastUndoAction();
      showToast(lang === 'zh' ? '操作已回滚撤销' : 'Operation rolled back and restored');
    }
  };

  // ── Counts ───────────────────────────────────────────────────────────────
  const unreadInboxCount = emails.filter(m => m.folder === 'inbox' && !m.read).length;
  const starredCount = emails.filter(m => m.starred).length;
  const snoozedCount = emails.filter(m => m.folder === 'snoozed').length;
  const draftsCount = emails.filter(m => m.folder === 'drafts').length;

  // ── Filtered list ────────────────────────────────────────────────────────
  const filteredList = useMemo(() => {
    return emails.filter(m => {
      if (currentFolder === 'starred') { if (!m.starred) return false; }
      else if (currentFolder === 'snoozed') { if (m.folder !== 'snoozed') return false; }
      else { if (m.folder !== currentFolder) return false; }

      if (currentFolder === 'inbox' && m.category !== currentCategoryTab) return false;

      const term = searchText.toLowerCase().trim();
      if (term) {
        const fromMatch = term.match(/from:(\S+)/);
        const subjectMatch = term.match(/subject:(\S+)/);
        const bodyMatch = term.match(/body:(\S+)/);
        if (fromMatch) {
          const a = fromMatch[1].toLowerCase();
          if (!m.senderName.toLowerCase().includes(a) && !m.senderAddress.toLowerCase().includes(a)) return false;
        } else if (subjectMatch) {
          if (!m.subject.toLowerCase().includes(subjectMatch[1].toLowerCase())) return false;
        } else if (bodyMatch) {
          if (!m.body.toLowerCase().includes(bodyMatch[1].toLowerCase())) return false;
        } else {
          const hit = m.senderName.toLowerCase().includes(term) || m.senderAddress.toLowerCase().includes(term)
            || m.subject.toLowerCase().includes(term) || m.body.toLowerCase().includes(term);
          if (!hit) return false;
        }
      }

      if (filterFrom.trim() && !m.senderName.toLowerCase().includes(filterFrom.toLowerCase()) && !m.senderAddress.toLowerCase().includes(filterFrom.toLowerCase())) return false;
      if (filterTo.trim() && !m.senderAddress.toLowerCase().includes(filterTo.toLowerCase())) return false;
      if (filterSubject.trim() && !m.subject.toLowerCase().includes(filterSubject.toLowerCase())) return false;
      return true;
    });
  }, [emails, currentFolder, currentCategoryTab, searchText, filterFrom, filterTo, filterSubject]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const original = [...emails];
    const updated = emails.map(m => m.id === id ? { ...m, starred: !m.starred } : m);
    saveEmails(updated);
    if (selectedEmail?.id === id) setSelectedEmail(prev => prev ? { ...prev, starred: !prev.starred } : null);
    const item = emails.find(m => m.id === id);
    if (item) showToast(!item.starred ? (lang === 'zh' ? '已标记星标' : 'Letter starred') : (lang === 'zh' ? '移除了星标' : 'Removed star from letter'), () => saveEmails(original));
  };

  const handleToggleImportant = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const original = [...emails];
    const updated = emails.map(m => m.id === id ? { ...m, important: !m.important } : m);
    saveEmails(updated);
    if (selectedEmail?.id === id) setSelectedEmail(prev => prev ? { ...prev, important: !prev.important } : null);
    const item = emails.find(m => m.id === id);
    if (item) showToast(!item.important ? (lang === 'zh' ? '标记为高瞩目重点' : 'Marked as high importance') : (lang === 'zh' ? '撤销重点标记' : 'Removed high priority tag'), () => saveEmails(original));
  };

  const handleEmailRowClick = (mail: EmailItem) => {
    setSelectedEmail(mail);
    if (!mail.read) saveEmails(emails.map(m => m.id === mail.id ? { ...m, read: true } : m));
  };

  const handleDeleteEmail = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const original = [...emails];
    const mail = emails.find(m => m.id === id);
    if (!mail) return;
    const updated = mail.folder === 'trash'
      ? emails.filter(m => m.id !== id)
      : emails.map(m => m.id === id ? { ...m, folder: 'trash' as const } : m);
    if (selectedEmail?.id === id) setSelectedEmail(null);
    saveEmails(updated);
    const msg = mail.folder === 'trash'
      ? (lang === 'zh' ? '永久摧毁清除信件' : 'Letter burned permanently')
      : (lang === 'zh' ? '账目信件已移至废弃篓' : 'Letter moved to Atelier Trash bin');
    showToast(msg, mail.folder !== 'trash' ? () => saveEmails(original) : undefined);
  };

  const handleArchiveEmail = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const original = [...emails];
    saveEmails(emails.map(m => m.id === id ? { ...m, folder: 'sent' as const } : m));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    showToast(lang === 'zh' ? '信件已封档留底' : 'Letter archived successfully', () => saveEmails(original));
  };

  const triggerSnoozePopover = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSnoozeTargetId(id);
    const rect = event.currentTarget.getBoundingClientRect();
    setSnoozePositions({ x: rect.left - 180, y: rect.bottom + window.scrollY });
    setShowSnoozePopover(true);
  };

  const executeSnooze = (preset: 'today' | 'tomorrow' | 'nextweek' | 'custom') => {
    if (!snoozeTargetId) return;
    const original = [...emails];
    const now = new Date();
    const dateMap: Record<string, string> = {
      today: lang === 'zh' ? '今日稍后，18:00' : 'Later today, 18:00',
      tomorrow: lang === 'zh' ? '次日 08:00' : 'Tomorrow, 08:00',
      nextweek: lang === 'zh' ? '下周初开端 08:00' : 'Next week Monday, 08:00',
      custom: lang === 'zh' ? '自定义周期' : 'Custom time',
    };
    const dateStr = dateMap[preset];
    saveEmails(emails.map(m => m.id === snoozeTargetId ? { ...m, folder: 'snoozed' as const, snoozedUntil: dateStr } : m));
    setShowSnoozePopover(false);
    setSnoozeTargetId(null);
    if (selectedEmail?.id === snoozeTargetId) setSelectedEmail(null);
    showToast(lang === 'zh' ? `信件已挂起推迟至: ${dateStr}` : `Letter postponed until: ${dateStr}`, () => saveEmails(original));
  };

  const getIsAllSelected = () => filteredList.length > 0 && filteredList.every(m => !!selectedIds[m.id]);

  const handleToggleSelectAll = () => {
    if (getIsAllSelected()) {
      setSelectedIds({});
    } else {
      const next: Record<string, boolean> = {};
      filteredList.forEach(m => { next[m.id] = true; });
      setSelectedIds(next);
    }
  };

  const handleSelectAllDropdown = (type: 'all' | 'none' | 'read' | 'unread' | 'starred' | 'unstarred') => {
    const next: Record<string, boolean> = {};
    const base = type === 'all' ? filteredList : type === 'read' ? filteredList.filter(m => m.read) : type === 'unread' ? filteredList.filter(m => !m.read) : type === 'starred' ? filteredList.filter(m => m.starred) : type === 'unstarred' ? filteredList.filter(m => !m.starred) : [];
    base.forEach(m => { next[m.id] = true; });
    setSelectedIds(next);
  };

  const handleBulkArchive = () => {
    const original = [...emails];
    saveEmails(emails.map(m => selectedIds[m.id] ? { ...m, folder: 'sent' as const } : m));
    setSelectedIds({});
    showToast(lang === 'zh' ? '选中的批量信件已归集归档' : 'Batch letters archived', () => saveEmails(original));
  };

  const handleBulkDelete = () => {
    const original = [...emails];
    saveEmails(emails.map(m => selectedIds[m.id] ? { ...m, folder: 'trash' as const } : m));
    setSelectedIds({});
    showToast(lang === 'zh' ? '选中的批量信件已全部移入垃圾篓' : 'Batch letters sent to trash', () => saveEmails(original));
  };

  const handleBulkMarkRead = (readStatus: boolean) => {
    const original = [...emails];
    saveEmails(emails.map(m => selectedIds[m.id] ? { ...m, read: readStatus } : m));
    setSelectedIds({});
    showToast(readStatus ? (lang === 'zh' ? '选中的信件已更新为已读' : 'Batch letters marked as read') : (lang === 'zh' ? '选中的信件已更新为未读' : 'Batch letters marked as unread'), () => saveEmails(original));
  };

  const handleApplyAdvancedFilters = () => {
    const parts: string[] = [];
    if (filterFrom.trim()) parts.push(`from:${filterFrom}`);
    if (filterSubject.trim()) parts.push(`subject:${filterSubject}`);
    setSearchText(parts.join(' '));
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilterFrom(''); setFilterTo(''); setFilterSubject(''); setSearchText('');
  };

  const handleSendInlineReply = () => {
    if (!inlineReplyText.trim() || !selectedEmail) return;
    const original = [...emails];
    const newMsg: ThreadMessage = {
      id: Date.now().toString(),
      senderName: lang === 'zh' ? '亚历山大·斯特林' : 'Alexander Sterling',
      senderAddress: 'alexander@atelier.internal',
      body: inlineReplyText,
      date: localDateStr(new Date()),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      isMe: true,
    };
    const updatedThread = [...selectedEmail.threadMessages, newMsg];
    const updatedEmails = emails.map(m => m.id === selectedEmail.id ? { ...m, read: true, snippet: (lang === 'zh' ? '我: ' : 'Me: ') + inlineReplyText.substring(0, 60) + '...', threadMessages: updatedThread } : m);
    saveEmails(updatedEmails);
    setSelectedEmail(prev => prev ? { ...prev, snippet: (lang === 'zh' ? '我: ' : 'Me: ') + inlineReplyText.substring(0, 60) + '...', threadMessages: updatedThread } : null);
    setInlineReplyText('');
    showToast(lang === 'zh' ? '已追加封寄回复' : 'Sealed thread reply dispatched', () => saveEmails(original));
  };

  return {
    // state
    emails, saveEmails, selectedEmail, setSelectedEmail,
    currentFolder, setCurrentFolder, currentCategoryTab, setCurrentCategoryTab,
    isSidebarCollapsed, setIsSidebarCollapsed,
    searchText, setSearchText, showFilters, setShowFilters,
    filterFrom, setFilterFrom, filterTo, setFilterTo, filterSubject, setFilterSubject,
    selectedIds, setSelectedIds,
    snoozeTargetId, showSnoozePopover, setShowSnoozePopover, snoozePositions,
    inlineReplyText, setInlineReplyText,
    toastMessage, toastUndoAction,
    // derived
    filteredList, unreadInboxCount, starredCount, snoozedCount, draftsCount,
    // handlers
    showToast, handleUndo,
    handleToggleStar, handleToggleImportant, handleEmailRowClick,
    handleDeleteEmail, handleArchiveEmail,
    triggerSnoozePopover, executeSnooze,
    getIsAllSelected, handleToggleSelectAll, handleSelectAllDropdown,
    handleBulkArchive, handleBulkDelete, handleBulkMarkRead,
    handleApplyAdvancedFilters, handleResetFilters,
    handleSendInlineReply,
  };
}
