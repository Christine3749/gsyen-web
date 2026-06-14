/**
 * 疆域 GSYEN · 核心类型系统
 * 所有模块共享的接口、枚举、错误类。
 */

export type UserRole        = 'user' | 'assistant' | 'system';
export type CardType        = 'contact' | 'order' | 'schedule' | 'item';
export type UserTier        = 'guest' | 'free' | 'member' | 'star';
export type KnowledgeSource = 'chat' | 'doc' | 'kanban';

export interface GsyenStreamMessage {
  id:        string;
  sessionId: string;
  senderId:  string;
  role:      UserRole;
  content:   string;
  timestamp: number;
  entityId?: string;
}

export interface GsyenCard {
  id:      string;
  type:    CardType;
  name:    string;
  ownerId: string;
  teamId:  string;
}

export interface DevourChunk {
  id:        string;
  source:    KnowledgeSource;
  content:   string;
  weight:    number;
  timestamp: number;
}

export interface ChatContextPayload {
  entityType:     CardType;
  entityId:       string;
  entityName:     string;
  recentMessages: Omit<GsyenStreamMessage, 'senderId'>[];
}

export class RLSError extends Error {
  constructor(msg: string) { super(msg); this.name = 'RLSError'; }
}

export class SecurityError extends Error {
  constructor(msg: string) { super(msg); this.name = 'SecurityError'; }
}
