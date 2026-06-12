import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import type { AuthError } from '../types/auth';

/**
 * 格式化 Supabase 认证错误为用户友好的消息
 */
export function formatAuthError(error: SupabaseAuthError | null, context: string): AuthError {
  if (!error) {
    return { message: 'Unknown error', code: 'UNKNOWN' };
  }

  const errorMap: Record<string, string> = {
    'invalid_credentials': '邮箱或密码不正确',
    'invalid_grant': '邮箱或密码不正确',
    'user_not_found': '该邮箱未注册',
    'email_not_confirmed': '请先验证邮箱',
    'user_already_exists': '该邮箱已注册',
    'over_email_send_rate_limit': '邮件发送过于频繁，请稍后再试',
    'anonymous_provider_disabled': '匿名登录已禁用',
    '422': '请求格式错误',
  };

  const message = errorMap[error.message] || error.message || `${context} 失败`;

  console.error(`[Auth] Error in ${context}:`, {
    code: error.status,
    message: error.message,
    details: error,
  });

  return {
    code: error.message,
    message,
    details: { status: error.status },
  };
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度（可选）
 * 前期：暂不强制，后期可启用
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: '密码至少 6 个字符' };
  }
  return { valid: true };
}
