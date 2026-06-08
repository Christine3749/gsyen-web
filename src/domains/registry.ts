import { DomainHandler } from './types';
import { chronosHandler } from './chronosHandler';

/**
 * All domain handlers known to the chat router.
 * To add VAULT/LEDGER/CANVAS: write a handler implementing DomainHandler
 * and push it here — useChatStream needs zero changes.
 */
export const domainHandlers: DomainHandler[] = [
  chronosHandler,
];
