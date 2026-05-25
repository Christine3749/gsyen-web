import React, { useState, useEffect } from "react";
import { Mail, Search, Star, Send, Trash2, Clock, CheckCircle2, User, Sparkles, Inbox, RefreshCw, PenSquare, Eye } from "lucide-react";
import { emailApi } from "../lib/api";

interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  avatarLetter: string;
  subject: string;
  date: string;
  body: string;
  read: boolean;
  starred: boolean;
  category: "halfsphere" | "system" | "workspace";
}

interface EmailViewProps {
  isDark: boolean;
  lang: "zh" | "en";
  isBound: boolean;
  onSyncNotify: () => void;
}

export default function EmailView({ isDark, lang, isBound, onSyncNotify }: EmailViewProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [searchWord, setSearchWord] = useState("");
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced">("synced");
  const [showReplyField, setShowReplyField] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySuccess, setReplySuccess] = useState(false);
  const [composeModal, setComposeModal] = useState(false);
  const [newTo, setNewTo] = useState("");
  const [newSubj, setNewSubj] = useState("");
  const [newBody, setNewBody] = useState("");

  const t = {
    zh: {
      postTitle: "疆域智能信箱",
      postSub: "Halfsphere 生态网络下行分发信道及通知中心",
      searchMail: "检索信件主题与发件人...",
      noMail: "未找到匹配的安全加密信件",
      compose: "发写信函",
      reply: "快捷回复",
      sendReply: "发送快捷回复",
      replySuccess: "回复成功发送，并已安全存证！",
      bodyPlaceholder: "编写快速简短的内容...",
      unboundAlert: "您目前以访客身份浏览。绑定 Halfsphere 账号后可读取高级定制通知流。",
      syncMail: "同步网络信箱",
      starred: "标星",
      allMail: "收件箱",
      sender: "发件人",
      subject: "主题",
      placeholderTo: "发往邮箱地址 (例如: support@halfsphere.com)",
      placeholderSubj: "信件主题",
      placeholderBody: "请在些键入正式的报告、问询或提案内容...",
      syncedWithHalfsphere: "信箱与 Halfsphere 主节点同步完毕",
      unsynced: "离线脱机信箱",
      syncing: "收取 Halfsphere 密函中..."
    },
    en: {
      postTitle: "gsyen Postdesk",
      postSub: "Downlink notification channel and mailing index within Halfsphere",
      searchMail: "Search sender or subject...",
      noMail: "No secured messages found",
      compose: "Compose Draft",
      reply: "Fast Reply",
      sendReply: "Send Response",
      replySuccess: "Reply processed and secured!",
      bodyPlaceholder: "Type your quick message here...",
      unboundAlert: "Browsing in Guest Mode. Connect HalfSphere for real-time inbox synchronization.",
      syncMail: "Sync Mail Servers",
      starred: "Starred",
      allMail: "Inbox",
      sender: "From",
      subject: "Subject",
      placeholderTo: "To (e.g., support@halfsphere.com)",
      placeholderSubj: "Subject",
      placeholderBody: "Type formal messages or project reports here...",
      syncedWithHalfsphere: "Inbox synchronized with Halfsphere",
      unsynced: "Cached Offline Inbox",
      syncing: "Fetching Halfsphere cryptoclass..."
    }
  }[lang];

  // Load — API when logged in (emails are read-only from DB), localStorage when offline
  useEffect(() => {
    if (isBound) {
      emailApi.list().then(apiMails => {
        if (apiMails.length === 0) return; // no server mails yet, keep local seeds
        const mapped: Email[] = apiMails.map(m => ({
          id: m.id, sender: m.sender, senderEmail: m.sender_email,
          avatarLetter: m.avatar_letter, subject: m.subject, date: m.date,
          body: m.body, read: m.is_read, starred: m.is_starred, category: m.category,
        }));
        setEmails(mapped);
        setSelectedId(mapped[0]?.id ?? "");
        localStorage.setItem("gsyen_emails", JSON.stringify(mapped));
      }).catch(() => {
        const saved = localStorage.getItem("gsyen_emails");
        if (saved) { const p = JSON.parse(saved); setEmails(p); setSelectedId(p[0]?.id ?? ""); }
      });
      return;
    }
    const saved = localStorage.getItem("gsyen_emails");
    if (saved) {
      const parsed = JSON.parse(saved);
      setEmails(parsed);
      if (parsed.length > 0) setSelectedId(parsed[0].id);
    } else {
      const defaultMails: Email[] = [
        {
          id: "mail-1",
          sender: "HalfSphere 生态核心组",
          senderEmail: "core@halfsphere.com",
          avatarLetter: "H",
          subject: lang === "zh" ? "🎉 恭喜！您已在疆域系统成功绑定 HalfSphere 节点" : "🎉 Congratulations! HalfSphere Node Link Established",
          date: "May 24, 2026",
          body: lang === "zh" 
            ? "尊敬的 Ethan 开发者：\n\n您的 HalfSphere 主机身份和密钥已在 gsyen-3000 端点配置绑定！看板卡片数据与工期排程现已支持 60ms 级别高精度异步增量上传备份。\n\n本邮件附带安全令牌：`HALF_GSYEN_SECURE_TOKEN_55871_A`。请在安全开发区内妥善保管，切勿在公开日志泄露。祝协同研发顺利！"
            : "Dear Ethan:\n\nYour HalfSphere identities and endpoint tokens are securely mounted on gsyen-3000. Kanban tasks and Calendar schedules now support high-performance secure synchronization.\n\nSecure credential token is enclosed: `HALF_GSYEN_SECURE_TOKEN_55871_A`. Preserve safely.",
          read: false,
          starred: true,
          category: "halfsphere"
        },
        {
          id: "mail-2",
          sender: "Google Cloud Sandbox",
          senderEmail: "alerts@cloud.google.com",
          avatarLetter: "G",
          subject: lang === "zh" ? "⚠️ [安全警告] 检测到非标端口 3000 Nginx Ingress" : "⚠️ [Security] Non-standard ingress routing on Port 3000",
          date: "May 24, 2026",
          body: lang === "zh"
            ? "系统诊断模块完成对 Cloud Run 沙箱容器的自动化健康核确。\n\n检测到应用层 Nginx 拦截规则正在接管 Ingress 管道并路由至 Port 3000（这是正确的预期配置）。由于处于测试和临时会话状态，请避免在网页端直链泄露您的 Google Workspace 敏感 Cookie 的行为环境。"
            : "Automatic scanning reports Nginx proxy layers are properly mapping external ingress streams to port 3000.\n\nPlease safeguard your private Gemini sandbox api keys, do not commit them directly in configuration files.",
          read: true,
          starred: false,
          category: "system"
        },
        {
          id: "mail-3",
          sender: "疆域 gsyen 智能诊断",
          senderEmail: "assistant@gsyen.com",
          avatarLetter: "S",
          subject: lang === "zh" ? "🔧 关于「流渲染画面极其不流畅、时而卡顿」的系统修缮包已封包" : "🔧 System Package Sealed: High-fric smooth scroll repair for long texts",
          date: "May 24, 2026",
          body: lang === "zh"
            ? "尊敬的用户：\n\n技术部门在接到您关于「长字符排版在加载时由于 Smooth 效果冲突造成一卡一卡、不是瀑布」的严重 bug 反馈后，已实施核心热插拔层修补。\n\n【变更点说明】：\n1. 在 AI 实时流媒体处于 isStreaming 状态时，底层触发 scrollTo behavior 由 `smooth` 全盘降级切换至高吞吐毫秒级 `auto`。\n2. 在检测到用户主动上划读早先信息时，启动距离边界检测（200px 阈值阀），断开由于自动刷新造成的焦点强拉。\n\n当前该机制已激活并跑通单测，感谢您的严苛质检，带给疆域更佳的德芙般流畅。"
            : "Dear User:\n\nOur system engineers completed standard refactoring resolving screen jittering issues during longer response generation.\n\n1. Switched isStreaming layout scrolls to instant 'auto' behaviour preventing animation loop blocks.\n2. Introduced edge guards preventing screen auto-jumps if client scrolls up.",
          read: true,
          starred: true,
          category: "workspace"
        }
      ];
      setEmails(defaultMails);
      setSelectedId("mail-1");
      localStorage.setItem("gsyen_emails", JSON.stringify(defaultMails));
    }
  }, [isBound]);

  const saveMails = (newMails: Email[]) => {
    setEmails(newMails);
    localStorage.setItem("gsyen_emails", JSON.stringify(newMails));
  };

  const patchMail = (id: string, patch: { read?: boolean; starred?: boolean }) => {
    const updated = emails.map(m => m.id === id ? { ...m, ...(patch.read !== undefined ? { read: patch.read } : {}), ...(patch.starred !== undefined ? { starred: patch.starred } : {}) } : m);
    saveMails(updated);
    if (isBound) emailApi.patch(id, { is_read: patch.read, is_starred: patch.starred }).catch(console.error);
  };

  const handleSyncMail = () => {
    setSyncState("syncing");
    onSyncNotify();
    setTimeout(() => {
      setSyncState("synced");
      // Pick up a newer random email sometimes
      const exists = emails.some(m => m.id === "mail-sync-new");
      if (!exists) {
        const newMail: Email = {
          id: "mail-sync-new",
          sender: "HalfSphere 生态核心组",
          senderEmail: "core@halfsphere.com",
          avatarLetter: "H",
          subject: lang === "zh" ? "📬 [Halfsphere 新增密信] 看板卡片一键备份验证" : "📬 [Halfsphere Inbox] Verification validation of card layouts completed",
          date: "May 24, 2026",
          body: lang === "zh"
            ? "尊敬的 Ethan 开发者：\n\n我们对您之前更新的看板、日程进行了校验。检测到数据层均支持完备的本地 localStorage 以及 Halfsphere 云端异步代理挂载，整体数据保存在可追溯链条中。信箱功能已经开始接收您刚才提交的同步日志。"
            : "Dear Ethan:\n\nOur diagnostics check for Kanban board and Calendars passed. Local state structures correctly integrated.",
          read: false,
          starred: false,
          category: "halfsphere"
        };
        const updated = [newMail, ...emails];
        saveMails(updated);
        setSelectedId("mail-sync-new");
      }
    }, 950);
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = emails.find(m => m.id === id);
    if (target) patchMail(id, { starred: !target.starred });
  };

  const handleDeleteMail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remain = emails.filter(m => m.id !== id);
    saveMails(remain);
    if (selectedId === id && remain.length > 0) {
      setSelectedId(remain[0].id);
    } else if (remain.length === 0) {
      setSelectedId("");
    }
  };

  const handleMarkAsRead = (id: string) => {
    patchMail(id, { read: true });
    setSelectedId(id);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyText("");
    setShowReplyField(false);
    setReplySuccess(true);
    setTimeout(() => setReplySuccess(false), 3000);
  };

  const handleCreateNewMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTo.trim() || !newSubj.trim()) return;

    const newM: Email = {
      id: "mail-" + Date.now(),
      sender: lang === "zh" ? "Ethan 开发者" : "Ethan (Developer)",
      senderEmail: "Ethan7586@gsyen.com",
      avatarLetter: "E",
      subject: newSubj,
      date: "May 24, 2026",
      body: newBody,
      read: true,
      starred: false,
      category: "workspace"
    };

    saveMails([newM, ...emails]);
    setNewTo("");
    setNewSubj("");
    setNewBody("");
    setComposeModal(false);
    setSelectedId(newM.id);
  };

  const filteredMails = emails.filter(m => {
    const searchLow = searchWord.toLowerCase();
    return m.sender.toLowerCase().includes(searchLow) || 
           m.subject.toLowerCase().includes(searchLow) ||
           m.body.toLowerCase().includes(searchLow);
  });

  const selectedMail = emails.find(m => m.id === selectedId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] overflow-hidden" id="email-view-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-color)] px-6 py-4.5 gap-4" id="email-view-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent-glow)] rounded-xl border border-[var(--accent-color)]/20 shadow-sm">
            <Mail className="w-5 h-5 text-[var(--accent-color)]" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-[var(--text-main)] tracking-tight">
              {t.postTitle}
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t.postSub}
            </p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncMail}
            className="cursor-pointer bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-color)] text-[var(--text-main)] h-9 px-3.5 rounded-lg text-xs font-medium flex items-center gap-1.5 active:scale-95 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent-color)] ${syncState === "syncing" ? "animate-spin" : ""}`} />
            <span>{t.syncMail}</span>
          </button>

          <button
            onClick={() => setComposeModal(true)}
            className="cursor-pointer bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition shadow-md shadow-[var(--accent-color)]/10"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>{t.compose}</span>
          </button>
        </div>
      </div>

      {!isBound && (
        <div className="bg-amber-500/10 border-b border-amber-500/15 py-2.5 px-6 text-xs text-amber-600 flex items-center gap-2 select-none font-sans" id="guest-mode-bar">
          <Inbox className="w-4 h-4 flex-shrink-0" />
          <span>{t.unboundAlert}</span>
        </div>
      )}

      {/* Main Mail splitscreen container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: List of Emails */}
        <div className="w-80 md:w-96 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-main)] overflow-y-auto" id="email-items-side-panel">
          {/* Internal search wrapper */}
          <div className="p-4 border-b border-[var(--border-color)]/50 relative flex-shrink-0">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-7 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder={t.searchMail}
              className="w-full bg-[var(--bg-card)]/40 border border-[var(--border-color)] focus:border-[var(--accent-color)]/50 rounded-lg py-2 pl-9 pr-3 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/50 outline-none transition"
            />
          </div>

          <div className="p-3 select-none flex-shrink-0 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)]/20 bg-[var(--bg-card)]/10">
            {t.allMail}
          </div>

          {/* Render listing */}
          <div className="flex-1 divide-y divide-[var(--border-color)]/40 overflow-y-auto" id="email-inbox-scroller">
            {filteredMails.length === 0 ? (
              <div className="py-24 text-center italic text-xs text-[var(--text-muted)] p-4 select-none">
                {t.noMail}
              </div>
            ) : (
              filteredMails.map((mail) => {
                const isSelected = selectedId === mail.id;
                return (
                  <div
                    key={mail.id}
                    onClick={() => handleMarkAsRead(mail.id)}
                    className={`w-full text-left p-4 flex gap-3 cursor-pointer transition-all border-l-2
                      ${isSelected 
                        ? "bg-[var(--bg-sidebar-active)] border-l-[var(--accent-color)]" 
                        : "bg-transparent border-l-transparent hover:bg-[var(--bg-card)]/30"
                      }
                    `}
                    id={`mail-card-item-${mail.id}`}
                  >
                    {/* Circle avatar sender or letter */}
                    <div className="w-8.5 h-8.5 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {mail.avatarLetter}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-1.5">
                        <span className={`text-[12px] truncate ${!mail.read ? "font-black text-[var(--text-main)]" : "font-extrabold text-[var(--text-muted)]"}`}>
                          {mail.sender}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono font-bold whitespace-nowrap">
                          {mail.date}
                        </span>
                      </div>

                      <div className={`text-[12px] truncate mt-0.5 ${!mail.read ? "font-black text-[var(--text-main)]" : "font-bold text-[var(--text-main)]/90"}`}>
                        {mail.subject}
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] font-bold leading-relaxed mt-1 truncate">
                        {mail.body}
                      </p>

                      {/* Icons bar in listing */}
                      <div className="flex items-center justify-between mt-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          {!mail.read && (
                            <span className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full" />
                          )}
                          <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase bg-[var(--bg-card)] p-0.5 px-1.5 rounded border border-[var(--border-color)]/40">
                            {mail.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggleStar(mail.id, e)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-amber-500 cursor-pointer hover:bg-[var(--bg-card)] transition font-medium"
                          >
                            <Star className={`w-3.5 h-3.5 ${mail.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteMail(mail.id, e)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 cursor-pointer hover:bg-[var(--bg-card)] transition font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Display and read active Email details */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[var(--bg-card)]/20" id="email-reader-pane">
          {selectedMail ? (
            <div className="p-6 md:p-8 flex flex-col h-full max-w-4xl" id={`mail-viewer-${selectedMail.id}`}>
              {/* Header details */}
              <div className="border-b border-[var(--border-color)] pb-5 mb-5 select-text">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20 font-bold rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {selectedMail.avatarLetter}
                    </div>
                    <div>
                      <h3 className="font-bold text-[14.5px] text-[var(--text-main)]Leading-snug flex items-center gap-1.5 flex-wrap">
                        <span>{selectedMail.sender}</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] font-normal">
                          &lt;{selectedMail.senderEmail}&gt;
                        </span>
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--accent-color)]/60" />
                        <span>Date: {selectedMail.date}</span>
                      </p>
                    </div>
                  </div>

                  {/* Star and delete action indicators */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleStar(selectedMail.id, e)}
                      className="p-1.5 border border-[var(--border-color)] bg-[var(--bg-input)] rounded-lg text-[var(--text-muted)] hover:text-amber-500 transition cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${selectedMail.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteMail(selectedMail.id, e)}
                      className="p-1.5 border border-[var(--border-color)] bg-[var(--bg-input)] rounded-lg text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h2 className="text-base font-bold font-sans text-[var(--text-main)] tracking-tight leading-relaxed pl-1.5 border-l-3 border-[var(--accent-color)]/70">
                  {selectedMail.subject}
                </h2>
              </div>

              {/* Email Text Body Pane */}
              <div className="flex-1 whitespace-pre-wrap font-sans text-sm text-[var(--text-main)] leading-relaxed pl-1 pb-16 border-b border-[var(--border-color)]/40 max-w-none select-text">
                {selectedMail.body}
              </div>

              {/* Reply Desk Module */}
              <div className="pt-6" id="mail-reply-desk">
                {replySuccess && (
                  <div className="mb-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 select-none">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{t.replySuccess}</span>
                  </div>
                )}
                {!showReplyField ? (
                  <button
                    onClick={() => setShowReplyField(true)}
                    className="cursor-pointer bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[var(--bg-sidebar-hover)] active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Inbox className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    <span>{t.reply}</span>
                  </button>
                ) : (
                  <form onSubmit={handleSendReply} className="space-y-3">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t.bodyPlaceholder}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-color)] transition-all resize-none"
                    />
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="submit"
                        className="cursor-pointer bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-medium px-4 py-2 rounded-lg transition"
                      >
                        {t.sendReply}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReplyField(false)}
                        className="cursor-pointer px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] transition"
                      >
                        {lang === "zh" ? "收回" : "Cancel"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 select-none text-center">
              <Mail className="w-12 h-12 text-[var(--text-muted)]/20 mb-3" />
              <p className="text-xs italic text-[var(--text-muted)]">{t.noMail}</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal drawer */}
      {composeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity" id="compose-mail-modal">
          <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl w-full max-w-xl shadow-2xl p-6 relative flex flex-col justify-between overflow-hidden">
            <h2 className="font-sans font-bold text-[16px] text-[var(--text-main)] mb-4 pb-2 border-b border-[var(--border-color)] flex items-center gap-2">
              <PenSquare className="w-4 h-4 text-[var(--accent-color)]" />
              <span>{t.compose}</span>
            </h2>

            <form onSubmit={handleCreateNewMail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 font-sans">{t.allMail}</label>
                <input
                  type="email"
                  required
                  value={newTo}
                  onChange={(e) => setNewTo(e.target.value)}
                  placeholder={t.placeholderTo}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)]/80 rounded-lg p-2.5 text-xs text-[var(--text-main)] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 font-sans">{t.subject}</label>
                <input
                  type="text"
                  required
                  value={newSubj}
                  onChange={(e) => setNewSubj(e.target.value)}
                  placeholder={t.placeholderSubj}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)]/80 rounded-lg p-2.5 text-xs text-[var(--text-main)] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 font-sans">{lang === "zh" ? "信函正件" : "Body Contents"}</label>
                <textarea
                  rows={5}
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder={t.placeholderBody}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)]/80 rounded-lg p-2.5 text-xs text-[var(--text-main)] outline-none resize-none transition"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-color)]/40 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setComposeModal(false)}
                  className="cursor-pointer px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                >
                  {lang === "zh" ? "丢弃" : "Discard"}
                </button>
                <button
                  type="submit"
                  className="cursor-pointer bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white px-5 py-2 rounded-lg font-medium transition flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{lang === "zh" ? "发送" : "Send"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
