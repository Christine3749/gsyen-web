import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

/** 全局单例 Supabase 客户端 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,      // 自动刷新 token
    persistSession: true,         // 保存 session 到本地存储
    detectSessionInUrl: true,     // 从 URL 检测 session（OAuth 回调）
  },
  global: {
    headers: {
      'X-Client-Info': `gsyen-web/${import.meta.env.VITE_APP_VERSION || '0.0.1'}`,
    },
  },
});

// 防止多个客户端实例
if ((window as any).__supabaseClient && (window as any).__supabaseClient !== supabase) {
  console.warn('⚠️ Multiple Supabase client instances detected. Using singleton pattern.');
}
(window as any).__supabaseClient = supabase;
