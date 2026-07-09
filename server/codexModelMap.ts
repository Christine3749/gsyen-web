export function chatGptModelName(model?: string | null): string {
  if (model === 'gpt-5-4') return 'gpt-5.4';
  if (model === 'gpt-5-4-mini' || model === 'gpt-5-5-mini' || model === 'mini') return 'gpt-5.4-mini';
  if (model === 'gpt-5-3-codex-spark') return 'gpt-5.3-codex-spark';
  return 'gpt-5.5';
}

export const CHATGPT_MODEL_SMOKE_IDS = [
  'gpt-5-5',
  'gpt-5-4',
  'gpt-5-4-mini',
  'gpt-5-3-codex-spark',
];
