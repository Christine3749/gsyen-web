import { ActionCard } from '../types/chat';

export type DomainActionType = 'create' | 'update' | 'delete' | 'query' | 'confirm';

export interface DomainActionResult {
  /** Card to render in chat */
  card?: ActionCard;
  /** Notify the host UI that a domain action happened (e.g. toast/banner). 'confirm' never
   *  reaches here — it's carried via `pending` until the user confirms or denies. */
  notify?: { action: Exclude<DomainActionType, 'confirm'>; title: string };
  /** Stash for a later confirmation step (action === 'confirm') */
  pending?: unknown;
  /** Override the typewritten reply (e.g. a short "已建立。" on confirmation) */
  reply?: string;
}

/**
 * A self-contained module plugged into the chat router.
 * useChatStream only ever talks to this interface — it never imports a
 * concrete store. Adding VAULT/LEDGER/CANVAS means writing a new handler
 * and registering it; the chat core stays untouched.
 */
export interface DomainHandler {
  /** Module key shown on ActionCards, e.g. 'CHRONOS' */
  module: string;

  /** Keyword-based intent sniff for non-structured (SSE) models */
  detectIntent(text: string): string | null;

  /** Enrich the outgoing user message with domain context/instructions */
  enrichMessage(text: string, intent: string, lang: 'zh' | 'en'): string;

  /** Context payload to send alongside structured-model requests, or undefined */
  buildContext(): Array<{ id: string; title: string; date: string; time: string }> | undefined;

  /** Handle a structured-model action (action/event from /api/chat JSON) */
  handleAction(action: string, ev: any, lang: 'zh' | 'en'): DomainActionResult | null;

  /** Resolve a previously-stashed confirmation (user replied "是的"/"建" etc.) */
  resolveConfirmation(pending: unknown, lang: 'zh' | 'en'): DomainActionResult | null;

  /** Handle the SSE path: full text has streamed, check for an embedded action block */
  handleStreamResult(intent: string, fullText: string): DomainActionResult | null;
}
