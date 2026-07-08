import { useEffect, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { MODELS, ModelId } from '../config/models';
import { useModelHealth } from '../hooks/useModelHealth';
import { startLocalChatGptBind } from '../services/localBridge';

interface ModelStatusPanelProps {
  lang: 'zh' | 'en';
  selectedModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  onClose: () => void;
  contextLabel?: string;
}

export function ModelStatusPanel({ lang, selectedModel, onSelectModel, onClose, contextLabel }: ModelStatusPanelProps) {
  const zh = lang === 'zh';
  const [refreshKey, setRefreshKey] = useState(0);
  const [binding, setBinding] = useState<'idle' | 'opening' | 'opened'>('idle');
  const [loginCode, setLoginCode] = useState<{ url: string; code: string; expiresInMinutes?: number } | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const health = useModelHealth(selectedModel, binding === 'opened' ? 5_000 : 30_000, refreshKey);
  const selected = MODELS.find(m => m.id === selectedModel) ?? { id: selectedModel, label: selectedModel };
  const isChatGptPro = selectedModel === 'chatgpt-pro';
  const isBound = isChatGptPro && health.status === 'online' && health.authMode === 'chatgpt';
  const statusLabel = health.status === 'online'
    ? (zh ? '在线' : 'ONLINE')
    : health.status === 'checking'
    ? (zh ? '检查中' : 'CHECKING')
    : (zh ? '离线' : 'OFFLINE');
  const authLabel = isChatGptPro
    ? isBound
      ? (zh ? 'ChatGPT 已绑定' : 'CHATGPT BOUND')
      : (zh ? '未绑定' : 'NOT BOUND')
    : statusLabel;

  const rows = [
    { label: zh ? '模型ID' : 'MODEL ID', value: `${selected.label}-DEF` },
    { label: zh ? '状态' : 'STATUS', value: authLabel, dot: true },
    ...(isChatGptPro ? [{ label: zh ? '认证' : 'AUTH', value: isBound ? 'ChatGPT' : (health.error ?? 'LOCAL ONLY') }] : []),
    { label: zh ? '上下文' : 'CONTEXT', value: contextLabel || (zh ? '灵阁' : 'MUSE') },
    { label: zh ? '记忆' : 'MEMORY', value: zh ? '已启用' : 'ENABLED' },
    { label: zh ? '工具' : 'TOOLS', value: zh ? '4/12 就绪' : '4/12 READY' },
  ];
  const actionLabel = isChatGptPro
    ? isBound
      ? (zh ? '重新绑定 ChatGPT' : 'RELINK CHATGPT')
      : binding === 'opening'
      ? (zh ? '正在打开官方登录...' : 'OPENING LOGIN...')
      : (zh ? '绑定 ChatGPT' : 'BIND CHATGPT')
    : (zh ? '查看模型详情' : 'MODEL DETAILS');

  useEffect(() => {
    if (!isBound) return;
    setBinding('idle');
    setLoginCode(null);
    setLoginNotice(null);
  }, [isBound]);

  const handleAction = async () => {
    if (!isChatGptPro) return;
    setBinding('opening');
    const loginWindow = window.open('about:blank', '_blank');
    try {
      const r = await startLocalChatGptBind()
        ?? await fetch('/api/codex/login/start', { method: 'POST' });
      const data = await r.json();
      if (data.localOnly && data.url) {
        if (loginWindow) loginWindow.location.href = data.url;
        else window.open(data.url, '_blank');
        setLoginCode(null);
        setLoginNotice(zh
          ? '网页端无法启动本机 Codex。请在桌面版或本地版完成 ChatGPT 绑定。'
          : 'Web cannot start local Codex. Bind ChatGPT in the desktop or local app.');
        setBinding('idle');
        return;
      }
      if (!r.ok || !data.url || !data.code) throw new Error(data.error || 'LOGIN_START_FAILED');
      if (loginWindow) loginWindow.location.href = data.url;
      else window.open(data.url, '_blank');
      setLoginCode({ url: data.url, code: data.code, expiresInMinutes: data.expiresInMinutes });
      setLoginNotice(null);
      setBinding('opened');
      setRefreshKey(k => k + 1);
      window.setTimeout(() => setRefreshKey(k => k + 1), 5000);
      window.setTimeout(() => setRefreshKey(k => k + 1), 12000);
    } catch {
      loginWindow?.close();
      setLoginNotice(zh ? '绑定启动失败，请使用桌面版或本地版重试。' : 'Bind failed. Try the desktop or local app.');
      setBinding('idle');
    }
  };

  return (
    <aside className={`gsyen-system-panel is-${health.status}`}>
      <div className="gsyen-system-panel-head">
        <div className="min-w-0">
          <p>{zh ? 'SYSTEM STATUS' : 'SYSTEM STATUS'}</p>
          <h3>{zh ? '模型与状态' : 'Model State'}</h3>
        </div>
        <button onClick={onClose} aria-label={zh ? '关闭模型状态' : 'Close model status'}>
          <X className="w-3 h-3" strokeWidth={1.5} />
        </button>
      </div>

      <div className="gsyen-system-panel-readout">
        <span className={`gsyen-system-panel-dot is-${health.status}`} />
        <div>
          <p>{selected.label}</p>
          <span>{isChatGptPro ? authLabel : statusLabel}</span>
        </div>
      </div>

      <div className="gsyen-system-panel-select">
        <label>{zh ? '当前模型' : 'CURRENT MODEL'}</label>
        <select value={selectedModel} onChange={e => onSelectModel(e.target.value as ModelId)}>
          {MODELS.map(m => (
            <option key={m.id} value={m.id} disabled={m.disabled}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="gsyen-system-panel-table">
        {rows.map(row => (
          <div key={row.label} className="gsyen-system-panel-row">
            <span>{row.label}</span>
            <strong>
              {row.dot && <i className={`gsyen-system-panel-mini-dot is-${health.status}`} />}
              {row.value}
            </strong>
          </div>
        ))}
      </div>
      {isChatGptPro && loginCode && (
        <div className="gsyen-system-panel-bind-code">
          <span>{zh ? '官方登录验证码' : 'OFFICIAL LOGIN CODE'}</span>
          <strong>{loginCode.code}</strong>
          <a href={loginCode.url} target="_blank" rel="noreferrer">
            {zh ? '打开 OpenAI 登录页' : 'OPEN OPENAI LOGIN'}
          </a>
        </div>
      )}
      {isChatGptPro && loginNotice && (
        <div className="gsyen-system-panel-bind-code">
          <span>{zh ? '绑定提示' : 'BINDING NOTE'}</span>
          <strong>{zh ? 'LOCAL ONLY' : 'LOCAL ONLY'}</strong>
          <a href="https://chatgpt.com" target="_blank" rel="noreferrer">{loginNotice}</a>
        </div>
      )}

      <button className="gsyen-system-panel-action" onClick={handleAction} disabled={isChatGptPro && binding === 'opening'}>
        <span>{actionLabel}</span>
        <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
      </button>
    </aside>
  );
}

