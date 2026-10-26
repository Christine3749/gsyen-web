/** Shapes returned by the existing native account service. */
export interface User {
  id: string;
  email?: string;
  aud?: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
  [key: string]: any;
}
export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
}
export type AuthChangeEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY';
export type AccountAuthError = { message: string; status?: number; code?: string };
export interface RealtimeChannel {
  readonly topic: string;
  on(type: string, filter: { event?: string; schema?: string; table?: string; filter?: string }, callback: (payload: any) => void): RealtimeChannel;
  subscribe(callback?: (status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'CLOSED', error?: Error) => void): RealtimeChannel;
  unsubscribe(): Promise<'ok'>;
}
