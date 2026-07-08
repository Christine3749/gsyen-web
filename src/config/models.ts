export interface ModelConfig {
  id: string;
  label: string;
  disabled?: boolean;
}

export type ModelId = 'fast' | 'ethan' | 'kimi' | 'deepseek' | 'claude' | 'chatgpt' | 'chatgpt-pro' | 'gemini';

export const MODELS: ModelConfig[] = [
  { id: 'fast',     label: '疆域·轻' },
  { id: 'ethan',    label: '疆域·思' },
  { id: 'kimi',     label: 'KIMI-K2.5' },
  { id: 'deepseek', label: 'DEEPSEEK' },
  { id: 'chatgpt-pro', label: 'CHATGPT PRO' },
  { id: 'gemini',   label: 'GEMINI' },
];

export const DEFAULT_MODEL: ModelId = 'kimi';
