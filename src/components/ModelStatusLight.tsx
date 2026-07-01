import { useModelHealth } from '../hooks/useModelHealth';
import { ModelId } from '../config/models';

interface ModelStatusLightProps {
  selectedModel: ModelId;
  active?: boolean;
  onClick?: () => void;
}

export function ModelStatusLight({ selectedModel, active = false, onClick }: ModelStatusLightProps) {
  const health = useModelHealth(selectedModel);
  const statusText = health.status === 'online'
    ? 'MODEL ONLINE'
    : health.status === 'checking'
    ? 'MODEL CHECKING'
    : 'MODEL UNAVAILABLE';

  return (
    <button type="button" onClick={onClick}
      className={`gsyen-model-status-button is-${health.status} ${active ? 'is-active' : ''}`}
      aria-label={statusText}
      aria-pressed={active}>
      <span className="gsyen-model-status-dot" />
      <span className="gsyen-model-status-label">{statusText}</span>
    </button>
  );
}
