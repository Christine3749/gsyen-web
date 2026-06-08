import React, { useState, useEffect, useMemo } from 'react';
import { localDateStr } from '../utils/date';
import { 
  Inbox, 
  Star, 
  Send, 
  File, 
  Trash2, 
  Search, 
  Plus, 
  Check, 
  Square, 
  CheckSquare, 
  Archive, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  MoreVertical, 
  Paperclip, 
  Minimize2, 
  Maximize2, 
  X, 
  Reply, 
  ArrowLeft, 
  Printer, 
  ExternalLink, 
  Filter, 
  HelpCircle, 
  AlertOctagon, 
  Mail, 
  MailOpen, 
  Tag, 
  Users, 
  Info, 
  Menu, 
  Lock, 
  ArrowRight, 
  SendHorizontal,
  ChevronDown,
  PanelLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ThreadMessage {
  id: string;
  senderName: string;
  senderAddress: string;
  body: string;
  date: string;
  time: string;
  isMe: boolean;
}

interface EmailItem {
  id: string;
  senderName: string;
  senderAddress: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  time: string;
  starred: boolean;
  important: boolean;
  read: boolean;
  folder: 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'trash' | 'spam';
  category: 'primary' | 'social' | 'promotions' | 'updates';
  snoozedUntil?: string;
  threadMessages: ThreadMessage[];
}

interface MailModuleProps {
  lang: 'zh' | 'en';
}

export default function MailModule({ lang }: MailModuleProps) {
  const LOCAL_STORAGE_KEY = 'atelier_workspace_mail_v2';

  // Core state
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'trash' | 'spam'>('inbox');
  const [currentCategoryTab, setCurrentCategoryTab] = useState<'primary' | 'social' | 'promotions' | 'updates'>('primary');
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  
  // Sidebar expand/collapse
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Search and Advanced Filters
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Selector controls
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Floating compose state
  const [composeState, setComposeState] = useState<'closed' | 'window' | 'minimized' | 'maximized'>('closed');
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCategory, setComposeCategory] = useState<'primary' | 'social' | 'promotions' | 'updates'>('primary');
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Snoozing Dialog
  const [snoozeTargetId, setSnoozeTargetId] = useState<string | null>(null);
  const [showSnoozePopover, setShowSnoozePopover] = useState(false);
  const [snoozePositions, setSnoozePositions] = useState<{ x: number, y: number } | null>(null);

  // Inline replies states
  const [inlineReplyText, setInlineReplyText] = useState('');

  // Undo Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastUndoAction, setToastUndoAction] = useState<(() => void) | null>(null);
  const [toastTimer, setToastTimer] = useState<number | null>(null);

  // Suggestable Contacts
  const CONTACTS = [
    { name: 'Atelier Sentinel Security Hub', email: 'sentinel@citadel.atelier' },
    { name: 'Royal Crown Jewelers Co.', email: 'contact@royaljewelers.com' },
    { name: 'Atelier Finance Comptroller', email: 'audits@ledger.atelier' },
    { name: 'Adobe Design Fonts Team', email: 'updates@fonts-adobe.com' },
    { name: 'Switzerland Design Guild', email: 'swiss-guild@designers.ch' },
    { name: 'Atelier Administrative Terminal', email: 'alexander@atelier.internal' }
  ];

  // Load emails
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setEmails(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load v2 mail storage:", e);
      }
    } else {
      const defaultMails: EmailItem[] = [
        {
          id: 'm1',
          senderName: 'Atelier Sentinel Security Hub',
          senderAddress: 'sentinel@citadel.atelier',
          subject: lang === 'zh' ? '【安全警报】主控安全组 TLS 1.3 密码套件升级确认' : '【Citadel Sec】TLS 1.3 Cipher Suite Upgrade Deployment Completed',
          snippet: lang === 'zh' ? '我们在15:04对本地多端隔离哈希金库主密钥链环进行了自动熵增加固。' : 'We have successfully hardened the master entropy database credentials on server Node 02.',
          body: lang === 'zh' ? 
            '尊敬的管理员：\n\n安全主网络已自动轮换 PGP/SSL 密钥并升级到 TLS 1.3 标准密码套件。由于系统运行于高级物理隔离沙盒（Security Sandbox: OK），所有本地静态账目、日程表和密码本已进行二次哈希自旋保护。不需要对此采取进一步行动。\n\n安全等级：军工级，安全熵值充足。\n\n—— Atelier 联合防卫中心' :
            'Dear Atelier Custodian,\n\nThe system has completed a rotating cryptographic pass to update Master PGP and SSL certificates. Because your data is isolated on our standalone sandbox, offline financial ledgers and credentials are automatically secure. No manual action is required.\n\nDefense Status: Citadel Certified.\n\nAtelier Network Guard',
          date: '2026-05-26',
          time: '06:45',
          starred: true,
          important: true,
          read: false,
          folder: 'inbox',
          category: 'primary',
          threadMessages: [
            {
              id: 'm1_msg1',
              senderName: 'Atelier Sentinel Security Hub',
              senderAddress: 'sentinel@citadel.atelier',
              body: lang === 'zh' ? '主控安全组 TLS 1.3 密码套件升级确认' : 'TLS 1.3 Cipher Suite Upgrade Deployment Completed',
              date: '2026-05-26',
              time: '06:45',
              isMe: false
            }
          ]
        },
        {
          id: 'm2',
          senderName: 'Royal Crown Jewelers Co.',
          senderAddress: 'contact@royaljewelers.com',
          subject: lang === 'zh' ? '设计反馈：第二期部族贵金属加冕王冠纹章雕刻标识满意度确认' : 'Design Direction Feedback: Phase 2 Mid-century Crown Crest Emblem',
          snippet: lang === 'zh' ? '亚历山大：对你们工作室这次提交的纯正矢量重构图形极为惊艳。已经将采购款转账。' : 'Alexander, we are profoundly amazed by the geometry precision and raw slate elegance of the crest.',
          body: lang === 'zh' ?
            'Alexander Sterling 阁下：\n\n设计团队在550g/㎡的德国原浆棉纸压印测试中，标识的边缘锐度及在1.5px描边精度下的视觉美感均超出了预期。微字距排版显得极其高雅，体现了完美的传统工艺精神。\n\n我们很荣幸已经通知财务向贵公司的 Atelier Ledger 账目表单直接汇入款项佣金。期待下一阶段的安全特调原包装纸套合作。\n\n总裁及首席策略官 亲笔' :
            'Alexander Sterling,\n\nOur publishing press completed testing the 1.5x stroke weight emblem insignia on 550g German cotton paper. The rendering is absolute perfection, capturing the classic Roman monument scale seamlessly.\n\nOur fiscal entity has disbursed the design commissioning balance directly to your double-entry registry. We await the physical packaging blueprint prototype.\n\nRoyal Crown executive committee',
          date: '2026-05-25',
          time: '11:20',
          starred: false,
          important: true,
          read: true,
          folder: 'inbox',
          category: 'social',
          threadMessages: [
            {
              id: 'm2_msg1',
              senderName: 'Royal Crown Jewelers Co.',
              senderAddress: 'contact@royaljewelers.com',
              body: lang === 'zh' ? '设计反馈：第二期部族贵金属加冕王冠纹章雕刻标识满意度确认' : 'Design Direction Feedback: Phase 2 Mid-century Crown Crest Emblem',
              date: '2026-05-25',
              time: '11:20',
              isMe: false
            }
          ]
        },
        {
          id: 'm3',
          senderName: 'Atelier Finance Comptroller',
          senderAddress: 'audits@ledger.atelier',
          subject: lang === 'zh' ? '财务快报：季度授权特许授权版税收入划拨入账通知书' : 'Fiscal Statement: Q1 Royalty Revenue Stream Reconciliation',
          snippet: lang === 'zh' ? '来自瑞士设计联盟（Swiss Design Guild）的4500.00美元授权使用版税已被记入复式账簿' : 'Gross revenue streams representing licensing rights (SVG assets) have cleared processing checkpoints.',
          body: lang === 'zh' ?
            '设计工坊的合伙人：\n\n这封信旨在确认，由第一代极简几何设计数据库授权产生的季度外部版税（数额：4,500.00 USD）已经安全结算并登账至您的“Atelier Ledger 记账簿”中。\n\n此项目在账簿分类属于“royalty (产权版税/授权)”。建议检查本季度开支，以便更科学地规划购买高端德国原棉纸及机密容器计算资源。\n\n资深审计官员' :
            'Dear Partners,\n\nWe hereby verify that external licensing royalties originating from worldwide logo asset distribution (4,500.00 USD) have cleared international banking and cleared in full to your ledger matrix.\n\nThis is categorized as a "royalty" asset. Please re-balance ledger entries accordingly to offset premium paper stock imports and terminal cost items.\n\nAtelier Finance Custodian',
          date: '2026-05-24',
          time: '09:00',
          starred: true,
          important: false,
          read: true,
          folder: 'inbox',
          category: 'promotions',
          threadMessages: [
            {
              id: 'm3_msg1',
              senderName: 'Atelier Finance Comptroller',
              senderAddress: 'audits@ledger.atelier',
              body: lang === 'zh' ? '季度授权特许授权版税收入划拨入账通知书' : 'Fiscal Statement: Q1 Royalty Revenue Stream Reconciliation',
              date: '2026-05-24',
              time: '09:00',
              isMe: false
            }
          ]
        },
        {
          id: 'm4',
          senderName: 'Switzerland Design Guild',
          senderAddress: 'swiss-guild@designers.ch',
          subject: lang === 'zh' ? '【行业动态】瑞士创意工坊巡礼：微徽章矢量化趋势探讨' : '【Industry】Swiss Atelier Tour: Vectorization Trends in Micro-Badges',
          snippet: lang === 'zh' ? '极简主义风潮下，矢量徽章正在重新定义高端商品的实体外包装。高对比设计成为绝对主流。' : 'Under the trend of minimalism, vector badge geometry is redefining outer containers for luxurious goods.',
          body: lang === 'zh' ?
            '各位创意工坊同仁：\n\n近期的苏黎世设计展会证实，高密字间距（Ultra Tracking）配合粗实线（2.0px+）的圆形 and 六边形框线备受美学界赞誉。这也印证了我们在极雅工作站中内置徽章外框的必要性。欢迎大家将设计的徽章成品分享至行会评测库。' :
            'Dear Guild Members,\n\nRecent conventions in Zurich highlight how tight tracking typography combined with solid geometric outlines are claiming dominant luxury presence. We strongly encourage exchanging vector benchmarks with peers.',
          date: '2026-05-22',
          time: '14:15',
          starred: false,
          important: false,
          read: true,
          folder: 'inbox',
          category: 'social',
          threadMessages: [
            {
              id: 'm4_msg1',
              senderName: 'Switzerland Design Guild',
              senderAddress: 'swiss-guild@designers.ch',
              body: lang === 'zh' ? '【行业动态】瑞士创意工坊巡礼：微徽章矢量化趋势探讨' : '【Industry】Swiss Atelier Tour: Vectorization Trends in Micro-Badges',
              date: '2026-05-22',
              time: '14:15',
              isMe: false
            }
          ]
        },
        {
          id: 'm5',
          senderName: 'Adobe Design Fonts Team',
          senderAddress: 'updates@fonts-adobe.com',
          subject: lang === 'zh' ? '【字体授权】Atelier Suite 独家专业排版字体包更新通知' : 'Exclusive Studio Typefaces Package Update Notification',
          snippet: lang === 'zh' ? '新版本已集成 Cinzel Decorative 以及 Outfit 黑体优化包。点按获取最新映射配置。' : 'Adobe Type Services has deployed optimizations for Outfit Sans and Cinzel Display fonts within your environment.',
          body: lang === 'zh' ?
            '尊敬的亚历山大：\n\nAdobe Fonts 已对您的系统订阅账户授权更新。我们针对高分辨率电子纸与哑光墨水屏渲染完成了专门的子像素抗锯齿微调。这将极大地增强您在制图主画布（Studio Canvas）和名片及外包装物料模拟（Simulation Grid）中的细节感知。感谢您一如既往地采用正版授权。' :
            'Dear Alexander,\n\nAdobe Type library has completed an exclusive service patch for your certified studio environment. Anti-aliasing configurations have been tailored for high-DPI ink rendering monitors. Enjoy absolute contrast sharpness inside your Studio and Collateral mockups.',
          date: '2026-05-18',
          time: '10:02',
          starred: false,
          important: false,
          read: true,
          folder: 'inbox',
          category: 'updates',
          threadMessages: [
            {
              id: 'm5_msg1',
              senderName: 'Adobe Design Fonts Team',
              senderAddress: 'updates@fonts-adobe.com',
              body: lang === 'zh' ? '独家专业排版字体包更新通知' : 'Exclusive Studio Typefaces Package Update Notification',
              date: '2026-05-18',
              time: '10:02',
              isMe: false
            }
          ]
        }
      ];
      setEmails(defaultMails);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultMails));
    }
  }, [lang]);

  // Save changes helper
  const saveEmails = (updatedList: EmailItem[]) => {
    setEmails(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  };

  // Undo Toast Controller
  const showToast = (message: string, undoAction?: () => void) => {
    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }
    setToastMessage(message);
    setToastUndoAction(() => undoAction || null);

    const timer = window.setTimeout(() => {
      setToastMessage(null);
      setToastUndoAction(null);
    }, 6500);
    setToastTimer(timer);
  };

  const handleUndo = () => {
    if (toastUndoAction) {
      toastUndoAction();
      showToast(lang === 'zh' ? "操作已回滚撤销" : "Operation rolled back and restored");
    }
  };

  // Contact matching Autocomplete Filter
  const filteredSuggestions = useMemo(() => {
    if (!composeTo.trim()) return [];
    const term = composeTo.toLowerCase();
    return CONTACTS.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term)
    );
  }, [composeTo]);

  // Advanced filters evaluation
  const getFilteredEmails = () => {
    return emails.filter(m => {
      // 1. Folder segregation
      if (currentFolder === 'starred') {
        if (!m.starred) return false;
      } else if (currentFolder === 'snoozed') {
        if (m.folder !== 'snoozed') return false;
      } else {
        if (m.folder !== currentFolder) return false;
      }

      // 2. Tab system filter when viewing the primary folder
      if (currentFolder === 'inbox' && m.category !== currentCategoryTab) {
        return false;
      }

      // 3. Search parameters
      const term = searchText.toLowerCase().trim();
      if (term) {
        const fromMatch = term.match(/from:(\S+)/);
        const subjectMatch = term.match(/subject:(\S+)/);
        const bodyMatch = term.match(/body:(\S+)/);

        if (fromMatch) {
          const author = fromMatch[1].toLowerCase();
          if (!m.senderName.toLowerCase().includes(author) && !m.senderAddress.toLowerCase().includes(author)) return false;
        } else if (subjectMatch) {
          const sub = subjectMatch[1].toLowerCase();
          if (!m.subject.toLowerCase().includes(sub)) return false;
        } else if (bodyMatch) {
          const bod = bodyMatch[1].toLowerCase();
          if (!m.body.toLowerCase().includes(bod)) return false;
        } else {
          const generalMatch = 
            m.senderName.toLowerCase().includes(term) ||
            m.senderAddress.toLowerCase().includes(term) ||
            m.subject.toLowerCase().includes(term) ||
            m.body.toLowerCase().includes(term);
          if (!generalMatch) return false;
        }
      }

      // Simple filter fields
      if (filterFrom.trim() && !m.senderName.toLowerCase().includes(filterFrom.toLowerCase()) && !m.senderAddress.toLowerCase().includes(filterFrom.toLowerCase())) {
        return false;
      }
      if (filterTo.trim() && !m.senderAddress.toLowerCase().includes(filterTo.toLowerCase())) {
        return false;
      }
      if (filterSubject.trim() && !m.subject.toLowerCase().includes(filterSubject.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  const filteredList = getFilteredEmails();

  // Metric aggregates
  const unreadInboxCount = emails.filter(m => m.folder === 'inbox' && !m.read).length;
  const starredCount = emails.filter(m => m.starred).length;
  const snoozedCount = emails.filter(m => m.folder === 'snoozed').length;
  const draftsCount = emails.filter(m => m.folder === 'drafts').length;
  const trashCount = emails.filter(m => m.folder === 'trash').length;
  const spamCount = emails.filter(m => m.folder === 'spam').length;

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const original = [...emails];
    const updated = emails.map(m => m.id === id ? { ...m, starred: !m.starred } : m);
    saveEmails(updated);
    
    if (selectedEmail && selectedEmail.id === id) {
      setSelectedEmail(prev => prev ? { ...prev, starred: !prev.starred } : null);
    }

    const currentItem = emails.find(m => m.id === id);
    if (currentItem) {
      const msg = !currentItem.starred ? 
        (lang === 'zh' ? '已标记星标' : 'Letter starred') : 
        (lang === 'zh' ? '移除了星标' : 'Removed star from letter');
      showToast(msg, () => saveEmails(original));
    }
  };

  const handleToggleImportant = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const original = [...emails];
    const updated = emails.map(m => m.id === id ? { ...m, important: !m.important } : m);
    saveEmails(updated);

    if (selectedEmail && selectedEmail.id === id) {
      setSelectedEmail(prev => prev ? { ...prev, important: !prev.important } : null);
    }

    const currentItem = emails.find(m => m.id === id);
    if (currentItem) {
      const msg = !currentItem.important ? 
        (lang === 'zh' ? '标记为高瞩目重点' : 'Marked as high importance') : 
        (lang === 'zh' ? '撤销重点标记' : 'Removed high priority tag');
      showToast(msg, () => saveEmails(original));
    }
  };

  const handleEmailRowClick = (mail: EmailItem) => {
    setSelectedEmail(mail);
    if (!mail.read) {
      const updated = emails.map(m => m.id === mail.id ? { ...m, read: true } : m);
      saveEmails(updated);
    }
  };

  const handleDeleteEmail = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const original = [...emails];
    const mail = emails.find(m => m.id === id);
    if (!mail) return;

    let updated;
    if (mail.folder === 'trash') {
      updated = emails.filter(m => m.id !== id);
      showToast(lang === 'zh' ? '永久摧毁清除信件' : 'Letter burned permanently');
    } else {
      updated = emails.map(m => m.id === id ? { ...m, folder: 'trash' as const } : m);
      showToast(lang === 'zh' ? "账目信件已移至废弃篓" : "Letter moved to Atelier Trash bin", () => saveEmails(original));
    }
    
    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
    }
    saveEmails(updated);
  };

  const handleArchiveEmail = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const original = [...emails];
    const mail = emails.find(m => m.id === id);
    if (!mail) return;

    const updated = emails.map(m => m.id === id ? { ...m, folder: 'sent' as const } : m);
    saveEmails(updated);

    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
    }
    
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

    let dateStr = '';
    const now = new Date();
    if (preset === 'today') {
      dateStr = lang === 'zh' ? '今日稍后，18:00' : 'Later today, 18:00';
    } else if (preset === 'tomorrow') {
      now.setDate(now.getDate() + 1);
      dateStr = lang === 'zh' ? '次日 08:00' : 'Tomorrow, 08:00';
    } else if (preset === 'nextweek') {
      now.setDate(now.getDate() + 7);
      dateStr = lang === 'zh' ? '下周初开端 08:00' : 'Next week Monday, 08:00';
    } else {
      dateStr = lang === 'zh' ? '自定义周期' : 'Custom time';
    }

    const updated = emails.map(m => 
      m.id === snoozeTargetId 
        ? { ...m, folder: 'snoozed' as const, snoozedUntil: dateStr } 
        : m
    );

    saveEmails(updated);
    setShowSnoozePopover(false);
    setSnoozeTargetId(null);
    
    if (selectedEmail?.id === snoozeTargetId) {
      setSelectedEmail(null);
    }

    showToast(
      lang === 'zh' ? `信件已挂起推迟至: ${dateStr}` : `Letter postponed until: ${dateStr}`, 
      () => saveEmails(original)
    );
  };

  const handleSelectAllDropdown = (type: 'all' | 'none' | 'read' | 'unread' | 'starred' | 'unstarred') => {
    const list = filteredList;
    const next: Record<string, boolean> = {};
    if (type === 'all') {
      list.forEach(m => { next[m.id] = true; });
    } else if (type === 'read') {
      list.filter(m => m.read).forEach(m => { next[m.id] = true; });
    } else if (type === 'unread') {
      list.filter(m => !m.read).forEach(m => { next[m.id] = true; });
    } else if (type === 'starred') {
      list.filter(m => m.starred).forEach(m => { next[m.id] = true; });
    } else if (type === 'unstarred') {
      list.filter(m => !m.starred).forEach(m => { next[m.id] = true; });
    }
    setSelectedIds(next);
  };

  const getIsAllSelected = () => {
    if (filteredList.length === 0) return false;
    return filteredList.every(m => !!selectedIds[m.id]);
  };

  const handleToggleSelectAll = () => {
    if (getIsAllSelected()) {
      setSelectedIds({});
    } else {
      const next: Record<string, boolean> = {};
      filteredList.forEach(m => {
        next[m.id] = true;
      });
      setSelectedIds(next);
    }
  };

  const handleBulkArchive = () => {
    const original = [...emails];
    const updated = emails.map(m => 
      selectedIds[m.id] ? { ...m, folder: 'sent' as const } : m
    );
    setSelectedIds({});
    saveEmails(updated);
    showToast(lang === 'zh' ? '选中的批量信件已归集归档' : 'Batch letters archived', () => saveEmails(original));
  };

  const handleBulkDelete = () => {
    const original = [...emails];
    const updated = emails.map(m => {
      if (selectedIds[m.id]) {
        return { ...m, folder: 'trash' as const };
      }
      return m;
    });
    setSelectedIds({});
    saveEmails(updated);
    showToast(lang === 'zh' ? '选中的批量信件已全部移入垃圾篓' : 'Batch letters sent to trash', () => saveEmails(original));
  };

  const handleBulkMarkRead = (readStatus: boolean) => {
    const original = [...emails];
    const updated = emails.map(m => 
      selectedIds[m.id] ? { ...m, read: readStatus } : m
    );
    setSelectedIds({});
    saveEmails(updated);
    showToast(
      readStatus 
        ? (lang === 'zh' ? '选中的信件已更新为已读' : 'Batch letters marked as read')
        : (lang === 'zh' ? '选中的信件已更新为未读' : 'Batch letters marked as unread'),
      () => saveEmails(original)
    );
  };

  const handleApplyAdvancedFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let queryParts = [];
    if (filterFrom.trim()) queryParts.push(`from:${filterFrom}`);
    if (filterSubject.trim()) queryParts.push(`subject:${filterSubject}`);
    setSearchText(queryParts.join(' '));
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterSubject('');
    setSearchText('');
  };

  const handleSendComposeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) return;

    const original = [...emails];
    const newMailId = Date.now().toString();
    const newMail: EmailItem = {
      id: newMailId,
      senderName: lang === 'zh' ? '亚历山大·斯特林' : 'Alexander Sterling',
      senderAddress: 'alexander@atelier.internal',
      subject: composeSubject,
      snippet: composeBody.substring(0, 75) + (composeBody.length > 75 ? '...' : ''),
      body: composeBody || (lang === 'zh' ? '未标注附带文本主体。' : 'Empty transcript body.'),
      date: localDateStr(new Date()),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      starred: false,
      important: false,
      read: true,
      folder: 'sent',
      category: composeCategory,
      threadMessages: [
        {
          id: `${newMailId}_msg1`,
          senderName: lang === 'zh' ? '亚历山大·斯特林' : 'Alexander Sterling',
          senderAddress: 'alexander@atelier.internal',
          body: composeBody,
          date: localDateStr(new Date()),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          isMe: true
        }
      ]
    };

    saveEmails([newMail, ...emails]);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setComposeState('closed');

    showToast(
      lang === 'zh' ? '信件配方已加密发送' : 'Draft successfully sealed & dispatched', 
      () => saveEmails(original)
    );
  };

  const handleSendInlineReply = () => {
    if (!inlineReplyText.trim() || !selectedEmail) return;

    const original = [...emails];
    const newMessage: ThreadMessage = {
      id: Date.now().toString(),
      senderName: lang === 'zh' ? '亚历山大·斯特林' : 'Alexander Sterling',
      senderAddress: 'alexander@atelier.internal',
      body: inlineReplyText,
      date: localDateStr(new Date()),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      isMe: true
    };

    const updatedThreadMessages = [...selectedEmail.threadMessages, newMessage];
    
    const updatedEmails = emails.map(m => {
      if (m.id === selectedEmail.id) {
        return {
          ...m,
          read: true,
          snippet: (lang === 'zh' ? '我: ' : 'Me: ') + inlineReplyText.substring(0, 60) + '...',
          threadMessages: updatedThreadMessages
        };
      }
      return m;
    });

    saveEmails(updatedEmails);
    
    setSelectedEmail(prev => prev ? {
      ...prev,
      snippet: (lang === 'zh' ? '我: ' : 'Me: ') + inlineReplyText.substring(0, 60) + '...',
      threadMessages: updatedThreadMessages
    } : null);

    setInlineReplyText('');
    showToast(lang === 'zh' ? '已追加封寄回复' : 'Sealed thread reply dispatched', () => saveEmails(original));
  };

  return (
    <div className="space-y-6 text-[#1A1A1A] font-sans" id="atelier-mail-module-wrapper">
      
      {/* Dynamic Module Header Section following the rigid Atelier Kanban aesthetic */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif text-[#1A1A1A] font-bold tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-[#1A1A1A] text-white rounded-none">
              <Inbox className="w-4 h-4" />
            </span>
            <span>{lang === 'zh' ? 'Hermes 极雅私密邮件信道' : 'Hermes Secure Atelier Mail Channel'}</span>
          </h2>
          <p className="text-xs text-[#1A1A1A]/40 font-mono uppercase tracking-widest mt-1">
            {lang === 'zh' ? '双重密钥封装排版系统。支持线程穿透与独立沙箱防泄漏保护' : 'An offline architectural correspondence depot styled with monospace metadata'}
          </p>
        </div>

        {/* Global Progress Indicators */}
        <div className="flex gap-4 items-center bg-white border border-[#1A1A1A]/10 px-4 py-2 text-[10px] font-mono text-[#1A1A1A]/70 uppercase tracking-widest rounded-none">
          <div>
            {lang === 'zh' ? '未读信件:' : 'UNREAD:'} <strong className="text-amber-800 font-bold">{unreadInboxCount}封</strong>
          </div>
          <div className="w-[1px] h-4 bg-[#1A1A1A]/10" />
          <div>
            {lang === 'zh' ? '总归档 / 推迟:' : 'ARCHIVED / SNOOZED:'} <strong className="text-[#1A1A1A]">{emails.length}/{snoozedCount}</strong>
          </div>
        </div>
      </div>

      {/* Control Strip (Horizontal search, filtering parameters) */}
      <div className="bg-white border border-[#1A1A1A]/10 p-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Rounded-none Search and Autocomplete Field */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* PanelLeft Sidebar Toggler */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-1.5 border border-[#1A1A1A]/15 hover:bg-[#1A1A1A]/5 rounded-none transition-all flex items-center justify-center ${!isSidebarCollapsed ? 'bg-[#1A1A1A]/10 text-[#1A1A1A]' : 'bg-transparent text-[#1A1A1A]/70'}`}
            title={lang === 'zh' ? '切换侧边栏' : 'Toggle Sidebar'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#1A1A1A]/40" />
            <input
              type="text"
              placeholder={lang === 'zh' ? '根据指令搜索信箱...' : 'Filter mailbox...'}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-8 py-1.5 text-xs border border-[#1A1A1A]/10 rounded-none bg-[#F9F8F6]/40 focus:bg-white focus:outline-none focus:border-[#1A1A1A] transition-colors"
              id="search-input"
            />
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-2 top-2 p-0.5 hover:bg-[#1A1A1A]/5 rounded-none text-neutral-500`}
              title={lang === 'zh' ? '高级多重检索' : 'Filter keys'}
            >
              <Filter className="w-3 h-3" />
            </button>
          </div>

          {!isSidebarCollapsed && (
            <span className="text-[10px] text-neutral-400 font-mono hidden lg:inline select-none uppercase tracking-wider">
              {lang === 'zh' ? '输入 ‟from:sentinel” 以定向检索' : 'Tip: enter ‟from:sentinel” to narrow results'}
            </span>
          )}
        </div>

        {/* Global compose dispatch triggers */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 px-2.5 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 text-[9px] font-mono tracking-widest uppercase transition rounded-none"
          >
            {isSidebarCollapsed ? (lang === 'zh' ? '展开目录' : 'Expand Folders') : (lang === 'zh' ? '收缩目录' : 'Collapse')}
          </button>
          <button
            onClick={() => setComposeState('window')}
            className="px-4 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#2C2C2C] text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center gap-2 rounded-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '亲书信函' : 'Seal New Letter'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Popunder Form */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-white border border-[#1A1A1A] p-4 text-xs space-y-3 shadow-sm rounded-none"
            id="filter-popup-node"
          >
            <div className="font-mono text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]/50 pb-2 border-b border-dashed border-[#1A1A1A]/10">
              {lang === 'zh' ? 'Hermes 自定义排字筛选器' : 'Hermes Advanced Metadata Filters'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-400 mb-1">{lang === 'zh' ? '寄件网关' : 'From Sender'}</label>
                <input 
                  type="text" 
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="w-full text-xs p-1.5 bg-[#F9F8F6] border border-[#1A1A1A]/10 outline-none focus:border-[#1A1A1A] rounded-none"
                  placeholder="e.g. security"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-400 mb-1">{lang === 'zh' ? '收信地址' : 'To Recipient'}</label>
                <input 
                  type="text" 
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="w-full text-xs p-1.5 bg-[#F9F8F6] border border-[#1A1A1A]/10 outline-none focus:border-[#1A1A1A] rounded-none"
                  placeholder="alexander@atelier.internal"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-400 mb-1">{lang === 'zh' ? '匹配标题' : 'Subject Matching'}</label>
                <input 
                  type="text" 
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full text-xs p-1.5 bg-[#F9F8F6] border border-[#1A1A1A]/10 outline-none focus:border-[#1A1A1A] rounded-none"
                  placeholder="e.g. quarterly report"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={handleResetFilters}
                className="px-3 py-1 bg-transparent hover:bg-[#1A1A1A]/5 text-[9px] font-mono tracking-wider uppercase border border-[#1A1A1A]/10 text-neutral-600 rounded-none"
              >
                {lang === 'zh' ? '恢复默认' : 'Reset'}
              </button>
              <button 
                onClick={() => handleApplyAdvancedFilters()}
                className="px-4 py-1 bg-[#1A1A1A] text-white hover:bg-[#2C2C2C] text-[9px] font-mono font-bold tracking-wider uppercase rounded-none"
              >
                {lang === 'zh' ? '套用矩阵筛选' : 'Apply Matrix'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid containing folders index and core workspace */}
      <div className="flex flex-col md:flex-row gap-5 items-stretch" id="major-mail-workspace-layout">
        
        {/* Left Side: Directory Folders List */}
        <div 
          className={`bg-white border border-[#1A1A1A]/10 p-2 space-y-1 rounded-none transition-all duration-300 ease-in-out overflow-hidden shrink-0 flex flex-col ${
            isSidebarCollapsed ? 'w-full md:w-[64px]' : 'w-full md:w-[200px]'
          }`} 
          id="categories-sidebar-container"
        >
          <div className="font-mono text-[8px] uppercase tracking-widest text-[#1A1A1A]/30 p-2 select-none whitespace-nowrap overflow-hidden">
            {isSidebarCollapsed ? '.' : (lang === 'zh' ? '封档目录' : 'DEPOT DIRECTORIES')}
          </div>

          {/* Folder: Inbox */}
          <button 
            onClick={() => { setCurrentFolder('inbox'); setSelectedEmail(null); }}
            className={`w-full py-2 px-3 text-left flex items-center justify-between text-xs transition-colors rounded-none whitespace-nowrap overflow-hidden ${
              currentFolder === 'inbox' 
                ? 'bg-[#1A1A1A] text-white font-bold' 
                : 'text-neutral-700 hover:bg-[#1A1A1A]/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Inbox className="w-3.5 h-3.5 shrink-0" />
              {!isSidebarCollapsed && <span className="font-mono uppercase tracking-wider">{lang === 'zh' ? '收件阁' : 'Inbox'}</span>}
            </div>
            {!isSidebarCollapsed && unreadInboxCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 font-mono ${currentFolder === 'inbox' ? 'bg-white text-black' : 'bg-[#1A1A1A] text-white'}`}>
                {unreadInboxCount}
              </span>
            )}
          </button>

          {/* Folder: Starred */}
          <button 
            onClick={() => { setCurrentFolder('starred'); setSelectedEmail(null); }}
            className={`w-full py-2 px-3 text-left flex items-center justify-between text-xs transition-colors rounded-none whitespace-nowrap overflow-hidden ${
              currentFolder === 'starred' 
                ? 'bg-[#1A1A1A] text-white font-bold' 
                : 'text-neutral-700 hover:bg-[#1A1A1A]/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className={`w-3.5 h-3.5 shrink-0 ${currentFolder === 'starred' ? 'fill-white' : ''}`} />
              {!isSidebarCollapsed && <span className="font-mono uppercase tracking-wider">{lang === 'zh' ? '星标函' : 'Starred'}</span>}
            </div>
            {!isSidebarCollapsed && starredCount > 0 && (
              <span className={`text-[9px] font-mono px-1.5 ${currentFolder === 'starred' ? 'text-[#E5C158]' : 'text-neutral-500'}`}>
                {starredCount}
              </span>
            )}
          </button>

          {/* Folder: Snoozed */}
          <button 
            onClick={() => { setCurrentFolder('snoozed'); setSelectedEmail(null); }}
            className={`w-full py-2 px-3 text-left flex items-center justify-between text-xs transition-colors rounded-none whitespace-nowrap overflow-hidden ${
              currentFolder === 'snoozed' 
                ? 'bg-[#1A1A1A] text-white font-bold' 
                : 'text-neutral-700 hover:bg-[#1A1A1A]/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {!isSidebarCollapsed && <span className="font-mono uppercase tracking-wider">{lang === 'zh' ? '暂挂区' : 'Snoozed'}</span>}
            </div>
            {!isSidebarCollapsed && snoozedCount > 0 && (
              <span className="text-[9px] font-mono text-neutral-400 px-1">{snoozedCount}</span>
            )}
          </button>

          {/* Folder: Sent */}
          <button 
            onClick={() => { setCurrentFolder('sent'); setSelectedEmail(null); }}
            className={`w-full py-2 px-3 text-left flex items-center justify-between text-xs transition-colors rounded-none whitespace-nowrap overflow-hidden ${
              currentFolder === 'sent' 
                ? 'bg-[#1A1A1A] text-white font-bold' 
                : 'text-neutral-700 hover:bg-[#1A1A1A]/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 shrink-0" />
              {!isSidebarCollapsed && <span className="font-mono uppercase tracking-wider">{lang === 'zh' ? '已密封' : 'Sent'}</span>}
            </div>
          </button>

          {/* Folder: Drafts */}
          <button 
            onClick={() => { setCurrentFolder('drafts'); setSelectedEmail(null); }}
            className={`w-full py-2 px-3 text-left flex items-center justify-between text-xs transition-colors rounded-none whitespace-nowrap overflow-hidden ${
              currentFolder === 'drafts' 
                ? 'bg-[#1A1A1A] text-white font-bold' 
                : 'text-neutral-700 hover:bg-[#1A1A1A]/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <File className="w-3.5 h-3.5 shrink-0" />
              {!isSidebarCollapsed && <span className="font-mono uppercase tracking-wider">{lang === 'zh' ? '草存本' : 'Drafts'}</span>}
            </div>
            {!isSidebarCollapsed && draftsCount > 0 && (
              <span className="text-[9px] font-mono bg-amber-200 text-amber-800 px-1">{draftsCount}</span>
            )}
          </button>

          {/* Folder: Spam */}
          <button 
            onClick={() => { setCurrentFolder('spam'); setSelectedEmail(null); }}
            className={`w-full py-2 px-3 text-left flex items-center justify-between text-xs transition-colors rounded-none whitespace-nowrap overflow-hidden ${
              currentFolder === 'spam' 
                ? 'bg-[#1A1A1A] text-white font-bold' 
                : 'text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/5 hover:text-[#1A1A1A]'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
              {!isSidebarCollapsed && <span className="font-mono uppercase tracking-wider">{lang === 'zh' ? '污损堆' : 'Spam'}</span>}
            </div>
          </button>

          {/* Folder: Trash */}
          <button 
            onClick={() => { setCurrentFolder('trash'); setSelectedEmail(null); }}
            className={`w-full py-2 px-3 text-left flex items-center justify-between text-xs transition-colors rounded-none whitespace-nowrap overflow-hidden ${
              currentFolder === 'trash' 
                ? 'bg-[#1A1A1A] text-white font-bold' 
                : 'text-neutral-700 hover:bg-[#1A1A1A]/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              {!isSidebarCollapsed && <span className="font-mono uppercase tracking-wider">{lang === 'zh' ? '回收站' : 'Trash'}</span>}
            </div>
          </button>
        </div>

        {/* Right Side: Correspondence Table Grid, or Single Opened Thread View */}
        <div className="flex-grow flex-1 min-w-0 space-y-4" id="main-content-display">
          
          <AnimatePresence mode="wait">
            {!selectedEmail ? (
              
              /* LIST PORTAL VIEW WITH ATMS CATEGORY TABS */
              <motion.div 
                key="list-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-[#1A1A1A]/10 rounded-none overflow-hidden"
              >
                {/* Header Actions Rack */}
                <div className="p-3 bg-neutral-50/50 border-b border-[#1A1A1A]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  
                  {/* Selector dropdown mimics classical double-entry list headers */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white border border-[#1A1A1A]/15 px-2 py-1">
                      <button 
                        onClick={handleToggleSelectAll} 
                        className="text-neutral-600 hover:text-[#1A1A1A] outline-none"
                      >
                        {getIsAllSelected() ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#1A1A1A]" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                      
                      {/* Quick dropdown selectors */}
                      <select 
                        onChange={(e) => handleSelectAllDropdown(e.target.value as any)}
                        defaultValue="none"
                        className="bg-transparent text-[10px] font-mono uppercase focus:outline-none cursor-pointer border-none text-[#1A1A1A] pr-1 py-0.5"
                      >
                        <option value="none">■</option>
                        <option value="all">{lang === 'zh' ? '全选' : 'ALL'}</option>
                        <option value="read">{lang === 'zh' ? '已读' : 'READ'}</option>
                        <option value="unread">{lang === 'zh' ? '未读' : 'UNREAD'}</option>
                        <option value="starred">{lang === 'zh' ? '星标' : 'STARRED'}</option>
                      </select>
                    </div>

                    {/* Bulk Action Buttons if any are chosen */}
                    {Object.values(selectedIds).filter(Boolean).length > 0 && (
                      <div className="flex items-center gap-1 border-l border-[#1A1A1A]/10 pl-3">
                        <button 
                          onClick={handleBulkArchive}
                          className="p-1 px-2 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 text-[9px] font-mono tracking-widest uppercase flex items-center gap-1"
                          title={lang === 'zh' ? '批量归档' : 'Archive batch'}
                        >
                          <Archive className="w-3 h-3" />
                          <span>{lang === 'zh' ? '归档' : 'ARCHIVE'}</span>
                        </button>
                        <button 
                          onClick={handleBulkDelete}
                          className="p-1 px-2 border border-red-200 hover:bg-red-50 text-red-800 text-[9px] font-mono tracking-widest uppercase flex items-center gap-1"
                          title={lang === 'zh' ? '批量除去' : 'Discard batch'}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{lang === 'zh' ? '丢弃' : 'DELETE'}</span>
                        </button>
                        <button 
                          onClick={() => handleBulkMarkRead(true)}
                          className="p-1 px-2 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 text-[9px] font-mono tracking-widest uppercase flex items-center gap-1"
                        >
                          <span>{lang === 'zh' ? '标已读' : 'READ'}</span>
                        </button>
                        <button 
                          onClick={() => handleBulkMarkRead(false)}
                          className="p-1 px-2 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 text-[9px] font-mono tracking-widest uppercase flex items-center gap-1"
                        >
                          <span>{lang === 'zh' ? '标未读' : 'UNREAD'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Refresh feedback and directory stats */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        showToast(lang === 'zh' ? '刷新系统信道，获取最新同步...' : 'Hermes cache synchronized');
                      }}
                      className="p-1 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 transition text-neutral-600 rounded-none"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[9px] text-[#1A1A1A]/40 uppercase tracking-wider">
                      {lang === 'zh' ? `列示信函数 ${filteredList.length}` : `Displaying ${filteredList.length} items`}
                    </span>
                  </div>
                </div>

                {/* GMAIL TAB-CATEGORIES REIMAGINED IN MONOCHROME ARCHITECTURAL tabs */}
                {currentFolder === 'inbox' && (
                  <div className="grid grid-cols-4 border-b border-[#1A1A1A]/10 text-xs text-center font-mono uppercase bg-neutral-50/50">
                    
                    {/* Tab: Primary */}
                    <button
                      onClick={() => setCurrentCategoryTab('primary')}
                      className={`py-3 flex flex-col items-center justify-center gap-1 transition-all rounded-none ${
                        currentCategoryTab === 'primary'
                          ? 'bg-white border-b-2 border-[#1A1A1A] font-extrabold text-[#1A1A1A]'
                          : 'text-[#1A1A1A]/55 hover:bg-[#1A1A1A]/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 ">
                        <Inbox className="w-3.5 h-3.5" />
                        <span className="tracking-widest">{lang === 'zh' ? '主要研商' : 'PRIMARY'}</span>
                      </div>
                      <span className="text-[8px] opacity-40">Atelier Core Intel</span>
                    </button>

                    {/* Tab: Social */}
                    <button
                      onClick={() => setCurrentCategoryTab('social')}
                      className={`py-3 flex flex-col items-center justify-center gap-1 transition-all rounded-none ${
                        currentCategoryTab === 'social'
                          ? 'bg-white border-b-2 border-[#1A1A1A] font-extrabold text-[#1A1A1A]'
                          : 'text-[#1A1A1A]/55 hover:bg-[#1A1A1A]/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span className="tracking-widest">{lang === 'zh' ? '网络协同' : 'SOCIAL'}</span>
                      </div>
                      <span className="text-[8px] opacity-40">Collaborative Guilds</span>
                    </button>

                    {/* Tab: Promotions */}
                    <button
                      onClick={() => setCurrentCategoryTab('promotions')}
                      className={`py-3 flex flex-col items-center justify-center gap-1 transition-all rounded-none ${
                        currentCategoryTab === 'promotions'
                          ? 'bg-white border-b-2 border-[#1A1A1A] font-extrabold text-[#1A1A1A]'
                          : 'text-[#1A1A1A]/55 hover:bg-[#1A1A1A]/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span className="tracking-widest">{lang === 'zh' ? '核销资产' : 'FISCAL PROMO'}</span>
                      </div>
                      <span className="text-[8px] opacity-40">Licensing Stream Ledger</span>
                    </button>

                    {/* Tab: Updates */}
                    <button
                      onClick={() => setCurrentCategoryTab('updates')}
                      className={`py-3 flex flex-col items-center justify-center gap-1 transition-all rounded-none ${
                        currentCategoryTab === 'updates'
                          ? 'bg-white border-b-2 border-[#1A1A1A] font-extrabold text-[#1A1A1A]'
                          : 'text-[#1A1A1A]/55 hover:bg-[#1A1A1A]/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        <span className="tracking-widest">{lang === 'zh' ? '系统网关' : 'UPDATES'}</span>
                      </div>
                      <span className="text-[8px] opacity-40">Subsystem Handshakes</span>
                    </button>

                  </div>
                )}

                {/* EMAIL ROW CONTAINER FOR ATELIER PLANNER LISTING */}
                <div className="divide-y divide-neutral-200/60" id="emails-list-element">
                  {filteredList.length === 0 ? (
                    <div className="py-20 text-center space-y-2">
                      <MailOpen className="w-8 h-8 text-[#1A1A1A]/20 mx-auto" />
                      <p className="font-serif italic text-sm text-[#1A1A1A]/40">{lang === 'zh' ? '本收信箱目前清亮如洗，无任何积存。' : 'No written correspondence matches current folder query.'}</p>
                      <p className="font-mono text-[9px] text-[#1A1A1A]/25 uppercase tracking-widest">{lang === 'zh' ? '信道状态: 精准保密在线' : 'Hermes Sandbox Status: Online'}</p>
                    </div>
                  ) : (
                    filteredList.map((m) => {
                      const isSelected = !!selectedIds[m.id];
                      return (
                        <div 
                          key={m.id}
                          className={`group transition-all flex items-center px-4 py-3 cursor-pointer text-xs justify-between gap-3 hover:shadow-sm ${
                            !m.read 
                              ? 'bg-[#F4F2EE]/50 font-bold border-l-2 border-[#1A1A1A]' 
                              : 'bg-white font-normal'
                          } ${isSelected ? 'bg-amber-50/25' : ''}`}
                          onClick={() => handleEmailRowClick(m)}
                        >
                          {/* Checked state and Star triggers */}
                          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => setSelectedIds(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                              className="text-neutral-300 hover:text-stone-800 transition"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-[#1A1A1A]" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Luxury Minimal Star indicator */}
                            <button 
                              onClick={(e) => handleToggleStar(m.id, e)}
                              className="transition-colors"
                              title={lang === 'zh' ? '关注标记' : 'Focus Flag'}
                            >
                              <Star className={`w-3.5 h-3.5 ${m.starred ? 'fill-amber-400 text-amber-500' : 'text-neutral-300 group-hover:text-amber-300'}`} />
                            </button>

                            {/* Classical Flag tag indicator */}
                            <button 
                              onClick={(e) => handleToggleImportant(m.id, e)}
                              className="text-stone-250 hover:text-[#1A1A1A] transition"
                              title={lang === 'zh' ? '标识等级' : 'Audit Tier Indicator'}
                            >
                              <span className={`text-[8px] font-mono uppercase tracking-tight px-1 font-bold ${
                                m.important 
                                  ? 'bg-[#1A1A1A] text-white border border-[#1A1A1A]' 
                                  : 'border border-[#1A1A1A]/10 text-[#1A1A1A]/30'
                              }`}>
                                {m.important ? '★ IMP' : 'std'}
                              </span>
                            </button>
                          </div>

                          {/* Sender Address and Sub-brand Name mapping closely to mid-century directories */}
                          <div className="w-36 md:w-44 shrink-0 font-medium truncate block text-stone-800" id={`sender-name-${m.id}`}>
                            {m.senderName}
                            <span className="block font-mono text-[9px] font-light text-neutral-400 truncate">{m.senderAddress}</span>
                          </div>

                          {/* Middle subject and body preview wrapper */}
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              {currentFolder === 'snoozed' && m.snoozedUntil && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[8px] font-mono px-1 font-bold lowercase">
                                  ⌚ {m.snoozedUntil}
                                </span>
                              )}
                              <span className="truncate text-stone-900 font-medium block" id={`subject-text-${m.id}`}>{m.subject}</span>
                            </div>
                            <span className="font-sans text-[11px] text-neutral-400 truncate group-hover:text-stone-500 block">
                              {m.snippet}
                            </span>
                          </div>

                          {/* Date details and hovering tools rack */}
                          <div className="w-20 shrink-0 text-right relative min-h-[32px] flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                            
                            {/* Standard Static Font Rendering of transmission date */}
                            <div className="group-hover:opacity-0 transition-opacity font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                              {m.date === localDateStr(new Date()) ? m.time : m.date.slice(5)}
                            </div>

                            {/* Quick Mini Hover action tools representing clean Atelier workflow buttons */}
                            <div className="opacity-0 group-hover:opacity-100 absolute inset-y-0 right-0 flex items-center gap-1 bg-white pl-2 transition-all">
                              <button
                                onClick={() => handleArchiveEmail(m.id)}
                                className="p-1 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A] hover:text-white transition"
                                title={lang === 'zh' ? '留档归档' : 'Record Archive'}
                              >
                                <Archive className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmail(m.id)}
                                className="p-1 border border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600 transition"
                                title={lang === 'zh' ? '丢入废纸篓' : 'Discard to Shredder'}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleToggleSelectAll()}
                                className="p-1 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 transition text-stone-700 font-mono text-[8px]"
                                title={lang === 'zh' ? '标记已读' : 'Mark'}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => triggerSnoozePopover(m.id, e)}
                                className="p-1 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A] hover:text-white transition"
                                title={lang === 'zh' ? '延期挂起' : 'Snooze'}
                              >
                                <Clock className="w-3 h-3" />
                              </button>
                            </div>

                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

                {/* Double-entry book footprint style folder metadata footer */}
                <div className="p-3 bg-neutral-50/50 border-t border-[#1A1A1A]/10 font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/40 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span>ATELIER SYSTEM ENCRYPTION DIRECTORY: YES</span>
                  <span>PGP KEY STRENGTH: Citadel 4096-ECC OK</span>
                </div>
              </motion.div>
            ) : (
              
              /* STUNNING READ THREAD PANEL STYLED AS A CHRONICLED TYPEWRITTEN LETTER */
              <motion.div 
                key="detail-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border border-[#1A1A1A] rounded-none overflow-hidden"
              >
                
                {/* Back to correspondence panel header rack */}
                <div className="p-3 bg-[#F4F2EE] border-b border-[#1A1A1A] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedEmail(null)}
                      className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition-colors"
                      title={lang === 'zh' ? '回执上一级' : 'Back to letters'}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                      {lang === 'zh' ? '信件线程阅读端' : 'READING CORRESPONDENCE THREADED DECK'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleArchiveEmail(selectedEmail.id)}
                      className="p-1.5 bg-white border border-[#1A1A1A]/10 hover:bg-stone-800 hover:text-white text-[10px] font-mono uppercase tracking-wider transition rounded-none"
                    >
                      {lang === 'zh' ? '归档' : 'Archive'}
                    </button>
                    <button 
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                      className="p-1.5 bg-white border border-red-200 text-red-800 hover:bg-red-800 hover:text-white text-[10px] font-mono uppercase tracking-wider transition rounded-none"
                    >
                      {lang === 'zh' ? '销毁' : 'Destroy'}
                    </button>
                    <button 
                      onClick={() => {
                        window.print();
                      }}
                      className="p-1.5 bg-white border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 rounded-none"
                      title={lang === 'zh' ? '物理打印保存' : 'Print Draft'}
                    >
                      <Printer className="w-3.5 h-3.5 text-neutral-600" />
                    </button>
                  </div>
                </div>

                {/* Real-time letters grid layout containing full chain of messages */}
                <div className="p-6 md:p-8 space-y-8 bg-[#F9F8F6]/20 font-sans">
                  
                  {/* Subject Line Display with big classic fonts */}
                  <div className="border-b border-[#1A1A1A]/10 pb-5">
                    <div className="flex items-center justify-between gap-4">
                      <h1 className="text-lg md:text-xl font-serif text-[#1A1A1A] font-bold tracking-tight">
                        {selectedEmail.subject}
                      </h1>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest py-0.5 px-2 bg-stone-900 text-white rounded-none">
                          {selectedEmail.category}
                        </span>
                        {selectedEmail.starred && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-mono px-1.5 py-0.5 border border-amber-200">
                            ★ Focus Label
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] font-mono uppercase text-[#1A1A1A]/35 tracking-wider mt-2">
                      {lang === 'zh' ? `系统信件密匙: ${selectedEmail.id}` : `Secure cipher payload token: ${selectedEmail.id}`}
                    </p>
                  </div>

                  {/* THREAD CHAIN: Render multiple consecutive messages */}
                  <div className="space-y-6">
                    {selectedEmail.threadMessages.map((msg, index) => {
                      return (
                        <div 
                          key={msg.id || index}
                          className={`p-5 rounded-none border border-[#1A1A1A]/10 ${
                            msg.isMe 
                              ? 'bg-white border-l-4 border-l-[#1A1A1A]' 
                              : 'bg-[#F4F2EE]/40 border-l-4 border-l-stone-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#1A1A1A]/5 pb-3 mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-[#1A1A1A] text-white font-serif flex items-center justify-center font-bold text-xs">
                                {msg.senderName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-semibold text-xs block text-[#1A1A1A]">
                                  {msg.isMe ? (lang === 'zh' ? '亚历山大·斯特林 (我)' : 'Alexander Sterling (Self)') : msg.senderName}
                                </span>
                                <span className="font-mono text-[9px] text-[#1A1A1A]/50 block">
                                  {msg.senderAddress}
                                </span>
                              </div>
                            </div>
                            <div className="text-right font-mono text-[8px] sm:text-[9px] uppercase text-[#1A1A1A]/45">
                              {msg.date} @ {msg.time}
                            </div>
                          </div>

                          <div className="whitespace-pre-line text-xs font-sans text-stone-800 leading-relaxed font-light">
                            {msg.body}
                          </div>

                          {/* Foot decoration showing authentic verification */}
                          <div className="mt-4 pt-3 border-t border-dashed border-[#1A1A1A]/5 flex justify-between items-center text-[8px] font-mono text-neutral-400">
                            <span>{msg.isMe ? 'DISPATCHED_VIA: ATELIER INTERN' : 'SIGNED_BY: COMPLIANT SERVER'}</span>
                            <span>SHA256_CERTIFIED: OK</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ATMS INLINE QUICK REPLY TRAY REIMAGINED */}
                  <div className="border border-[#1A1A1A] p-4 bg-white space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#1A1A1A]/5">
                      <Reply className="w-3.5 h-3.5 text-neutral-600" />
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/60">
                        {lang === 'zh' ? '快速起草追加信函 (Inline Sealed Reply)' : 'Inline Sealed Thread Dispatch'}
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      value={inlineReplyText}
                      onChange={(e) => setInlineReplyText(e.target.value)}
                      placeholder={lang === 'zh' ? '写信回复这封安全信件，点击下方按钮加盖官印发出...' : 'Compose inline encrypted reply to this thread...'}
                      className="w-full p-3 text-xs bg-[#F9F8F6] outline-none border border-[#1A1A1A]/10 focus:border-[#1A1A1A] rounded-none font-sans font-light"
                    />

                    <div className="flex justify-between items-center">
                      <div className="text-[9px] font-mono text-[#1A1A1A]/40 uppercase">
                        {lang === 'zh' ? '发往地址: ' : 'Routing to: '} {selectedEmail.senderAddress}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setInlineReplyText('')}
                          className="px-3 py-1.5 border border-[#1A1A1A]/10 hover:bg-stone-50 text-[10px] font-mono uppercase tracking-wider transition rounded-none"
                        >
                          {lang === 'zh' ? '清空' : 'Clear'}
                        </button>
                        <button
                          onClick={handleSendInlineReply}
                          disabled={!inlineReplyText.trim()}
                          className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold transition flex items-center gap-1.5 rounded-none ${
                            inlineReplyText.trim() 
                              ? 'bg-[#1A1A1A] text-white hover:bg-[#2C2C2C]' 
                              : 'bg-neutral-100 text-neutral-300 border border-neutral-200 cursor-not-allowed'
                          }`}
                        >
                          <SendHorizontal className="w-3 h-3" />
                          <span>{lang === 'zh' ? '加印发送' : 'Seal & Airmail'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* FLOATING COMPOSE DIALOG DRAWER PREVENTING OVERLAY CLUTTER */}
      <AnimatePresence>
        {composeState !== 'closed' && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={`fixed right-6 bottom-6 bg-white border-2 border-[#1A1A1A] shadow-2xl z-50 flex flex-col justify-between rounded-none transition-all duration-300 ${
              composeState === 'maximized' 
                ? 'w-[750px] h-[550px]' 
                : composeState === 'minimized'
                ? 'w-72 h-10'
                : 'w-[480px] h-[450px]'
            }`}
            id="envelope-compose-box"
          >
            {/* Header with Monocode title */}
            <div className="bg-[#1A1A1A] text-white p-2.5 px-4 flex items-center justify-between text-xs select-none">
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-white" />
                {lang === 'zh' ? '起草加密新信函' : 'SEALING NEW CORRESPONDENCE BLUEPRINT'}
              </span>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setComposeState(composeState === 'minimized' ? 'window' : 'minimized')}
                  title={lang === 'zh' ? '最小化' : 'Shrink'}
                  className="hover:text-amber-400"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setComposeState(composeState === 'maximized' ? 'window' : 'maximized')}
                  title={lang === 'zh' ? '最大化' : 'Expand'}
                  className="hover:text-amber-400"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setComposeState('closed')}
                  title={lang === 'zh' ? '弃草稿' : 'Burn blueprint'}
                  className="hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inner envelope content (Hidden when minimized for task tray convenience) */}
            {composeState !== 'minimized' && (
              <form onSubmit={handleSendComposeEmail} className="flex-1 flex flex-col justify-between p-4 space-y-3 bg-[#F9F8F6]">
                <div className="space-y-2 flex-1">
                  
                  {/* Address input bar */}
                  <div className="relative">
                    <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 py-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 w-12">{lang === 'zh' ? '寄至: ' : 'To: '}</span>
                      <input 
                        type="text" 
                        required
                        value={composeTo}
                        onChange={(e) => {
                          setComposeTo(e.target.value);
                          setShowToSuggestions(true);
                        }}
                        onFocus={() => setShowToSuggestions(true)}
                        placeholder="e.g. audit-office@atelier.internal"
                        className="bg-transparent border-none outline-none font-sans text-xs w-full text-stone-900"
                        id="compose-to"
                      />
                    </div>

                    {/* SUGGESTIONS POPUP LIST */}
                    {showToSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute left-14 right-0 top-8 bg-white border border-[#1A1A1A] z-50 text-xs shadow-lg max-h-48 overflow-y-auto divide-y divide-neutral-100">
                        {filteredSuggestions.map((contact, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setComposeTo(contact.email);
                              setShowToSuggestions(false);
                            }}
                            className="p-2 hover:bg-neutral-50 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <span className="font-bold text-[#1A1A1A] block">{contact.name}</span>
                              <span className="font-mono text-[9px] text-neutral-400">{contact.email}</span>
                            </div>
                            <span className="text-[8px] font-mono text-neutral-300">import contact [↲]</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subject input bar */}
                  <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 py-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 w-12">{lang === 'zh' ? '关于: ' : 'Subject: '}</span>
                    <input 
                      type="text" 
                      required
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      placeholder="Title of this envelope..."
                      className="bg-transparent border-none outline-none font-sans text-xs w-full text-stone-900"
                      id="compose-subject"
                    />
                  </div>

                  {/* Category allocation index bar */}
                  <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 py-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 w-12">{lang === 'zh' ? '分类: ' : 'Label: '}</span>
                    <div className="flex items-center gap-1.5">
                      {(['primary', 'social', 'promotions', 'updates'] as const).map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setComposeCategory(cat)}
                          className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider border rounded-none transition-all ${
                            composeCategory === cat 
                              ? 'bg-stone-900 text-white border-stone-900 font-bold' 
                              : 'bg-transparent text-stone-400 border-[#1A1A1A]/10 hover:border-stone-400'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sealed body transcript area */}
                  <textarea
                    rows={8}
                    required
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder={lang === 'zh' ? '编写具有行业顶尖美学的正文段落...' : 'Formulate structured physical memo body...'}
                    className="w-full text-xs p-3 border border-[#1A1A1A]/10 focus:border-[#1A1A1A] outline-none bg-white rounded-none font-sans font-light flex-1 min-h-[120px]"
                    id="compose-body"
                  />
                </div>

                {/* Submit tools rack */}
                <div className="flex justify-between items-center border-t border-[#1A1A1A]/10 pt-3">
                  <div className="font-mono text-[8px] text-[#1A1A1A]/40 uppercase">
                    {lang === 'zh' ? '离线多端信道: PGP/E2EE ACTIVE' : 'SECURE ENVELOPE SEALER: ONLINE'}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setComposeTo('');
                        setComposeSubject('');
                        setComposeBody('');
                        setComposeState('closed');
                        showToast(lang === 'zh' ? '草存蓝图已销毁' : 'Draft blueprint shredded successfully');
                      }}
                      className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-800 text-[10px] font-mono uppercase tracking-wider rounded-none"
                    >
                      {lang === 'zh' ? '粉碎毁弃' : 'Shred'}
                    </button>
                    <button 
                      type="submit"
                      disabled={!composeTo.trim() || !composeSubject.trim()}
                      className={`px-5 py-1.5 text-[10px] font-mono tracking-widest font-bold uppercase transition flex items-center gap-1.5 rounded-none ${
                        composeTo.trim() && composeSubject.trim()
                          ? 'bg-[#1A1A1A] text-white hover:bg-stone-850'
                          : 'bg-neutral-100 text-neutral-300 border border-neutral-100 cursor-not-allowed'
                      }`}
                    >
                      <SendHorizontal className="w-3.5 h-3.5" />
                      <span>{lang === 'zh' ? '封漆寄出' : 'Seal & Send'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SNOOZING TIME-LOCK SYSTEM POPOVER DIALOG */}
      <AnimatePresence>
        {showSnoozePopover && snoozePositions && (
          <>
            <div 
              className="fixed inset-0 z-45" 
              onClick={() => { setShowSnoozePopover(false); setSnoozeTargetId(null); }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ left: snoozePositions.x, top: snoozePositions.y }}
              className="absolute bg-white border border-[#1A1A1A] shadow-xl p-3 w-56 z-50 rounded-none font-sans"
              id="snooze-poppanel"
            >
              <div className="font-mono text-[8px] uppercase tracking-widest text-neutral-400 pb-1.5 border-b border-[#1A1A1A]/10 mb-2">
                {lang === 'zh' ? '指定延迟挂起周期' : 'SNOOZE CHRONOMETRY'}
              </div>
              <div className="space-y-1 text-xs">
                <button 
                  onClick={() => executeSnooze('today')}
                  className="w-full text-left py-1.5 px-2 hover:bg-[#1A1A1A]/5 rounded-none"
                >
                  🌅 {lang === 'zh' ? '今天晚些时候 (18:00)' : 'Later Today (18:00)'}
                </button>
                <button 
                  onClick={() => executeSnooze('tomorrow')}
                  className="w-full text-left py-1.5 px-2 hover:bg-[#1A1A1A]/5 rounded-none"
                >
                  ☀ {lang === 'zh' ? '明天早上 (08:00)' : 'Tomorrow (08:00)'}
                </button>
                <button 
                  onClick={() => executeSnooze('nextweek')}
                  className="w-full text-left py-1.5 px-2 hover:bg-[#1A1A1A]/5 rounded-none"
                >
                  📅 {lang === 'zh' ? '下周初开盘 (Mon 08:00)' : 'Next Week (Mon 08:00)'}
                </button>
                <button 
                  onClick={() => executeSnooze('custom')}
                  className="w-full text-left py-1.5 px-2 hover:bg-[#1A1A1A]/5 rounded-none border-t border-[#1A1A1A]/5 text-neutral-400 italic"
                >
                  ⚙ {lang === 'zh' ? '高级定点周期' : 'Configure Custom...'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* UNDO OPERATION TOAST SYSTEM */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 bg-[#1A1A1A] text-white p-3 px-5 z-50 text-xs flex items-center gap-4 border border-stone-800 rounded-none shadow-2xl font-mono"
            id="workspace-roll-toast"
          >
            <span>{toastMessage}</span>
            {toastUndoAction && (
              <button 
                onClick={handleUndo}
                className="text-amber-400 font-bold hover:text-amber-300 font-mono tracking-wider uppercase text-[10px] pl-3 border-l border-white/20"
              >
                {lang === 'zh' ? '撤销 (UNDO)' : 'UNDO'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
