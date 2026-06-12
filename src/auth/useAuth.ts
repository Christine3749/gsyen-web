import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type UserTier = 'guest' | 'user' | 'admin' | 'owner';

export interface AuthState {
  user:          User | null;
  session:       Session | null;
  tier:          UserTier | null;   // halfsphere 会员等级
  emailVerified: boolean;           // Supabase email_confirmed_at 非空
  loading:       boolean;
}

const NOT_CONFIGURED = { error: { message: 'Supabase not configured' } } as any;

async function fetchTier(userId: string): Promise<UserTier | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('user_tiers')
    .select('tier')
    .eq('user_id', userId)
    .single();
  return (data?.tier as UserTier) ?? 'guest';
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, session: null, tier: null, emailVerified: false, loading: true });

  useEffect(() => {
    if (!supabase) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    setState(s => ({ ...s, loading: true }));

    // authSeq 防止 fetchTier 竞态：SIGNED_OUT 后旧的 SIGNED_IN fetchTier 不得覆写 user:null
    let authSeq = 0;

    supabase.auth.getSession().then(async ({ data }) => {
      const seq = ++authSeq;
      const user = data.session?.user ?? null;
      const tier = user ? await fetchTier(user.id) : null;
      if (authSeq !== seq) return;
      const emailVerified = !!user?.email_confirmed_at;
      setState({ user, session: data.session, tier, emailVerified, loading: false });
    }).catch(() => {
      setState(s => ({ ...s, loading: false }));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const seq = ++authSeq;
      const user = session?.user ?? null;
      const tier = user ? await fetchTier(user.id) : null;
      if (authSeq !== seq) return;
      const emailVerified = !!user?.email_confirmed_at;
      setState({ user, session, tier, emailVerified, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase ? supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
             : Promise.resolve(NOT_CONFIGURED);

  const signInWithEmail = (email: string, password: string) =>
    supabase ? supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
             : Promise.resolve(NOT_CONFIGURED);

  const signUpWithEmail = (email: string, password: string) =>
    supabase ? supabase.auth.signUp({ email: email.trim().toLowerCase(), password })
             : Promise.resolve(NOT_CONFIGURED);

  const signOut = () =>
    supabase ? supabase.auth.signOut() : Promise.resolve({ error: null });

  return { ...state, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut };
}
