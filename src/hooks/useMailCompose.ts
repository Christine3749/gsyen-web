import React, { useState, useMemo } from 'react';
import { localDateStr } from '../utils/date';
import { EmailItem, MailCategory } from '../types/mail';
import { CONTACTS } from '../data/mailDefaults';

interface UseMailComposeOptions {
  lang: 'zh' | 'en';
  emails: EmailItem[];
  saveEmails: (list: EmailItem[]) => void;
  showToast: (msg: string, undo?: () => void) => void;
}

export function useMailCompose({ lang, emails, saveEmails, showToast }: UseMailComposeOptions) {
  const [composeState, setComposeState] = useState<'closed' | 'window' | 'minimized' | 'maximized'>('closed');
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCategory, setComposeCategory] = useState<MailCategory>('primary');
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!composeTo.trim()) return [];
    const term = composeTo.toLowerCase();
    return CONTACTS.filter(c => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term));
  }, [composeTo]);

  const handleSendComposeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) return;
    const original = [...emails];
    const id = Date.now().toString();
    const newMail: EmailItem = {
      id,
      senderName: lang === 'zh' ? '亚历山大·斯特林' : 'Alexander Sterling',
      senderAddress: 'alexander@atelier.internal',
      subject: composeSubject,
      snippet: composeBody.substring(0, 75) + (composeBody.length > 75 ? '...' : ''),
      body: composeBody || (lang === 'zh' ? '未标注附带文本主体。' : 'Empty transcript body.'),
      date: localDateStr(new Date()),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      starred: false, important: false, read: true,
      folder: 'sent', category: composeCategory,
      threadMessages: [{
        id: `${id}_msg1`,
        senderName: lang === 'zh' ? '亚历山大·斯特林' : 'Alexander Sterling',
        senderAddress: 'alexander@atelier.internal',
        body: composeBody,
        date: localDateStr(new Date()),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        isMe: true,
      }],
    };
    saveEmails([newMail, ...emails]);
    setComposeTo(''); setComposeSubject(''); setComposeBody(''); setComposeState('closed');
    showToast(lang === 'zh' ? '信件配方已加密发送' : 'Draft successfully sealed & dispatched', () => saveEmails(original));
  };

  const handleShred = () => {
    setComposeTo(''); setComposeSubject(''); setComposeBody(''); setComposeState('closed');
    showToast(lang === 'zh' ? '草存蓝图已销毁' : 'Draft blueprint shredded successfully');
  };

  return {
    composeState, setComposeState,
    composeTo, setComposeTo,
    composeSubject, setComposeSubject,
    composeBody, setComposeBody,
    composeCategory, setComposeCategory,
    showToSuggestions, setShowToSuggestions,
    filteredSuggestions,
    handleSendComposeEmail, handleShred,
  };
}
