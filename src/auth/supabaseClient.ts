import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// 清除旧版 localStorage 残留 token（一次性迁移）
try {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('sb-')) localStorage.removeItem(k);
  });
} catch {}

/**
 * 全局单例 Supabase 客户端
 * 使用 @supabase/ssr createBrowserClient：
 * - token 存 Cookie（Secure + SameSite=Lax），不存 localStorage
 * - XSS 无法通过 localStorage 窃取 session
 * - 自动分块处理 cookie 4KB 上限
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);

if ((window as any).__supabaseClient && (window as any).__supabaseClient !== supabase) {
  console.warn('⚠️ Multiple Supabase client instances detected.');
}
(window as any).__supabaseClient = supabase;
