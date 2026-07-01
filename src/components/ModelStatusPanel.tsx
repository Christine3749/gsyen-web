import { ChevronRight, X } from 'lucide-react';
import { MODELS, ModelId } from '../config/models';
import { useModelHealth } from '../hooks/useModelHealth';

interface ModelStatusPanelProps {
  lang: 'zh' | 'en';
  selectedModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  onClose: () => void;
  contextLabel?: string;
}

export function ModelStatusPanel({ lang, selectedModel, onSelectModel, onClose, contextLabel }: ModelStatusPanelProps) {
  const zh = lang === 'zh';
  const health = useModelHealth(selectedModel);
  const selected = MODELS.find(m => m.id === selectedModel) ?? { id: selectedModel, label: selectedModel };
  const statusLabel = health.status === 'online'
    ? (zh ? '在线' : 'ONLINE')
    : health.status === 'checking'
    ? (zh ? '检查中' : 'CHECKING')
    : (zh ? '离线' : 'OFFLINE');

  const rows = [
    { label: zh ? '模型ID' : 'MODEL ID', value: `${selected.label}-DEF` },
    { label: zh ? '状态' : 'STATUS', value: statusLabel, dot: true },
    { label: zh ? '上下文' : 'CONTEXT', value: contextLabel || (zh ? '灵阁' : 'MUSE') },
    { label: zh ? '记忆' : 'MEMORY', value: zh ? '已启用' : 'ENABLED' },
    { label: zh ? '工具' : 'TOOLS', value: zh ? '4/12 就绪' : '4/12 READY' },
  ];

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
          <span>{statusLabel}</span>
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

      <button className="gsyen-system-panel-action">
        <span>{zh ? '查看模型详情' : 'MODEL DETAILS'}</span>
        <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
      </button>
    </aside>
  );
}

