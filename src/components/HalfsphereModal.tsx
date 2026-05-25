import React, { useState } from "react";
import { ShieldCheck, X, Radio, AlertCircle, LogOut, Eye, EyeOff, Crown, ExternalLink } from "lucide-react";
import { supabase, auth, buildUser, type HalfSphereUser } from "../lib/auth";

interface HalfsphereModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "zh" | "en";
  isBound: boolean;
  onBindChange: (boundState: boolean, emailStr: string) => void;
}

const TIER_STYLE: Record<string, string> = {
  free:       "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  pro:        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  enterprise: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const TIER_LABEL: Record<string, Record<string, string>> = {
  free:       { zh: "免费版", en: "Free" },
  pro:        { zh: "专业版", en: "Pro" },
  enterprise: { zh: "企业版", en: "Enterprise" },
};

export default function HalfsphereModal({
  isOpen, onClose, lang, isBound, onBindChange
}: HalfsphereModalProps) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState("");

  const currentUser = auth.getUser();

  if (!isOpen) return null;

  const t = {
    zh: {
      title:          "HalfSphere 账号",
      subtitle:       "登录后看板、日历与邮件数据将安全同步至您的 HalfSphere 空间。",
      labelEmail:     "邮箱地址",
      labelPassword:  "密码",
      placeholderEmail:    "your@halfsphere.com",
      placeholderPassword: "至少 8 位",
      btnLogin:       "登录",
      btnLoading:     "请稍候...",
      btnDisconnect:  "退出登录",
      btnKeep:        "保持登录",
      cancel:         "取消",
      statusActive:   "已登录 · 数据同步中",
      statusGuest:    "未登录，当前为本地离线模式",
      syncNote:       "看板、日历、邮件数据将与您的 HalfSphere 账号双向同步。",
      applyLink:      "申请 HalfSphere 访问权限",
      errInvalid:     "邮箱或密码错误，请重试。",
      errNotConfirmed:"邮箱尚未验证，请检查收件箱。",
      errNetwork:     "网络错误，请检查连接后重试。",
    },
    en: {
      title:          "HalfSphere Account",
      subtitle:       "Sign in to sync your kanban, calendar, and mail with your HalfSphere workspace.",
      labelEmail:     "Email Address",
      labelPassword:  "Password",
      placeholderEmail:    "your@halfsphere.com",
      placeholderPassword: "At least 8 characters",
      btnLogin:       "Sign In",
      btnLoading:     "Please wait...",
      btnDisconnect:  "Sign Out",
      btnKeep:        "Stay Signed In",
      cancel:         "Cancel",
      statusActive:   "Signed in · Syncing",
      statusGuest:    "Guest mode · Local storage only",
      syncNote:       "Kanban, calendar, and mail will sync bidirectionally with your HalfSphere account.",
      applyLink:      "Apply for HalfSphere access",
      errInvalid:     "Incorrect email or password.",
      errNotConfirmed:"Email not confirmed. Check your inbox.",
      errNetwork:     "Network error. Please check your connection.",
    },
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError(t.errInvalid);
        } else if (signInError.message.includes("Email not confirmed")) {
          setError(t.errNotConfirmed);
        } else {
          setError(signInError.message);
        }
        return;
      }

      const user = await buildUser();
      if (!user) { setError(t.errNetwork); return; }

      auth.save(user);
      onBindChange(true, user.email);
      onClose();
    } catch {
      setError(t.errNetwork);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    auth.clear();
    onBindChange(false, "");
    onClose();
  };

  const inputCls =
    "w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)]/70 rounded-lg px-3 py-2.5 text-xs text-[var(--text-main)] outline-none transition placeholder-[var(--text-muted)]/50 font-medium";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-[var(--accent-color)] animate-pulse" />
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[var(--accent-color)]">
              HalfSphere Ecosystem
            </span>
          </div>
          <h2 className="font-bold text-lg text-[var(--text-main)] tracking-tight">{t.title}</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{t.subtitle}</p>
        </div>

        {/* Status badge */}
        <div className="mx-6 mt-4 mb-1 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/40 flex items-center gap-3">
          <div className={`p-2 rounded-lg flex items-center justify-center ${
            isBound
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : "bg-neutral-500/10 text-[var(--text-muted)]/60 border border-dashed border-[var(--border-color)]"
          }`}>
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] tracking-wider">
              {isBound ? t.statusActive : t.statusGuest}
            </div>
            {isBound && currentUser && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold text-[var(--text-main)] truncate">
                  {currentUser.email}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_STYLE[currentUser.membership] ?? TIER_STYLE.free}`}>
                  {currentUser.membership === "enterprise" && <Crown className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />}
                  {TIER_LABEL[currentUser.membership]?.[lang] ?? currentUser.membership}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-4">
              <div className="relative w-10 h-10">
                <span className="absolute inset-0 border-2 border-[var(--border-color)] rounded-full" />
                <span className="absolute inset-0 border-2 border-t-[var(--accent-color)] rounded-full animate-spin" />
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)]">{t.btnLoading}</span>
            </div>

          ) : isBound ? (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t.syncNote}</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]/40">
                <button
                  onClick={onClose}
                  className="cursor-pointer px-4 py-2 text-xs border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition font-medium"
                >
                  {t.btnKeep}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-xs bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t.btnDisconnect}
                </button>
              </div>
            </div>

          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1.5">
                  {t.labelEmail}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.placeholderEmail}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1.5">
                  {t.labelPassword}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t.placeholderPassword}
                    className={`${inputCls} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer transition"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-500 bg-rose-500/5 border border-rose-500/15 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]/40">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer px-4 py-2 text-xs border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-5 py-2 text-xs bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-bold transition active:scale-95"
                >
                  {t.btnLogin}
                </button>
              </div>

              {/* Apply link — HalfSphere is invite-only */}
              <a
                href="https://www.halfsphere.com/apply"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-center text-[10px] text-[var(--text-muted)]/60 font-mono mt-1 hover:text-[var(--accent-color)] transition"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                {t.applyLink}
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
