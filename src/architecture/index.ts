/**
 * 疆域 GSYEN · 核心架构基座 v2.0
 * 统一导出入口
 */

export type {
  UserRole, CardType, UserTier, KnowledgeSource,
  GsyenStreamMessage, GsyenCard, DevourChunk, ChatContextPayload,
} from './types';
export { RLSError, SecurityError } from './types';

export { GsyenSessionStream }     from './session';
export { SelfDevouringManager }   from './devour';
export { KanbanCard, buildChatContext } from './card';
export { sanitize, csrfToken, injectKnowledge } from './security';
