export interface ModelConfig {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface ChatGptModelConfig {
  id: string;
  label: string;
}

export type ModelId = 'fast' | 'ethan' | 'kimi' | 'deepseek' | 'claude' | 'chatgpt' | 'chatgpt-pro' | 'gemini';

export const MODELS: ModelConfig[] = [
  { id: 'fast',     label: '疆域·轻' },
  { id: 'ethan',    label: '疆域·思' },
  { id: 'kimi',     label: 'KIMI-K2.5' },
  { id: 'deepseek', label: 'DEEPSEEK' },
  { id: 'chatgpt-pro', label: 'CHATGPT' },
  { id: 'gemini',   label: 'GEMINI' },
];

export const CHATGPT_MODELS: ChatGptModelConfig[] = [
  { id: 'gpt-5-5', label: '5.5' },
  { id: 'gpt-5-5-mini', label: '5.5 MINI' },
  { id: 'mini', label: 'MINI' },
];

export const DEFAULT_MODEL: ModelId = 'kimi';
