export interface ModelConfig {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface ChatGptModelConfig {
  id: string;
  label: string;
}

export type ModelId = 'fast' | 'ethan' | 'kimi' | 'deepseek' | 'claude' | 'chatgpt' | 'chatgpt-pro';

export const MODELS: ModelConfig[] = [
  { id: 'fast',     label: '疆域·轻' },
  { id: 'ethan',    label: '疆域·思' },
  { id: 'kimi',     label: 'KIMI-K2.5' },
  { id: 'deepseek', label: 'DEEPSEEK' },
  { id: 'chatgpt-pro', label: 'CHATGPT' },
];

export const CHATGPT_MODELS: ChatGptModelConfig[] = [
  { id: 'gpt-5-5', label: 'GPT-5.5' },
  { id: 'gpt-5-4', label: 'GPT-5.4' },
  { id: 'gpt-5-4-mini', label: 'GPT-5.4-MINI' },
  { id: 'gpt-5-3-codex-spark', label: 'GPT-5.3-CODEX-SPARK' },
];

export const DEFAULT_MODEL: ModelId = 'kimi';

const enabledModelIds = new Set(MODELS.filter(m => !m.disabled).map(m => m.id));

export function isModelId(value: string | null | undefined): value is ModelId {
  return !!value && enabledModelIds.has(value);
}

export function firstEnabledModel(): ModelId {
  return (MODELS.find(m => !m.disabled)?.id ?? DEFAULT_MODEL) as ModelId;
}
