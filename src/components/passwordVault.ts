/**
 * passwordVault — Secret Key Citadel 的纯数据/逻辑层
 *
 * 把类型、本地存储键、默认凭证、分类/强度文案表，以及"生成密码 + 算强度"
 * 两个纯函数从 PasswordModule 抽出来，让组件只管渲染与状态编排。
 */

export type CredentialCategory = 'api' | 'server' | 'database' | 'personal';

export interface CredentialRow {
  id: string;
  serviceName: string;
  username: string;
  secretVal: string;
  category: CredentialCategory;
  lastUpdated: string;
}

export const LOCAL_STORAGE_KEY = 'identity_lab_passwords';

/** 首次进入时写入的示例凭证（按语言切换显示名） */
export function defaultCredentials(lang: 'zh' | 'en'): CredentialRow[] {
  return [
    {
      id: 'p1',
      serviceName: lang === 'zh' ? 'Supabase 生产数据库密钥' : 'Production Supabase Database Master JWT',
      username: 'postgres_owner',
      secretVal: 'S_p@se_pA55w0rd_SeCrEt_N0rd_093!',
      category: 'database',
      lastUpdated: '2026-05-25',
    },
    {
      id: 'p2',
      serviceName: lang === 'zh' ? 'Gemini AI 极速接入令牌' : 'Gemini AI Core Service API Key',
      username: 'system_atelier_api',
      secretVal: 'AIzaSyChrOnos_PaS5wordLab_G3m1n1_R3s0urce_v3',
      category: 'api',
      lastUpdated: '2026-05-25',
    },
    {
      id: 'p3',
      serviceName: lang === 'zh' ? 'Atelier 主安全控制台安全组证书' : 'Citadel SSL Private Root CA',
      username: 'keys_custodian',
      secretVal: 'SSH-RSA-Atelier-KeyChain-Secured-2026',
      category: 'server',
      lastUpdated: '2026-05-24',
    },
  ];
}

export const filterTypeTags: Record<string, { zh: string; en: string }> = {
  all: { zh: '全部凭证', en: 'All' },
  api: { zh: '接口密钥 (API Keys)', en: 'API Tokens' },
  server: { zh: '服务器主机证书 (SSH)', en: 'Server Certs' },
  database: { zh: '数据库密保 (SQL)', en: 'Databases' },
  personal: { zh: '私密账号与备用', en: 'Private Credentials' },
};

export const strengthLabels = [
  { labelZh: '超高危蓝图 (请勿使用)', labelEn: 'VULNERABLE BLU_PRINT', color: 'bg-red-500', text: 'text-red-700' },
  { labelZh: '弱性加密 (不建议用于核心端)', labelEn: 'WEAK BLUEPRINT', color: 'bg-orange-400', text: 'text-orange-700' },
  { labelZh: '标准保护密钥级别', labelEn: 'TACTICAL AMBER SHIELD', color: 'bg-amber-400', text: 'text-amber-800' },
  { labelZh: '高强度防劫持密钥', labelEn: 'HIGH FORTRESS SHIELD', color: 'bg-emerald-500', text: 'text-emerald-700' },
  { labelZh: '军工级不可逆熵能保险库', labelEn: 'CITADEL MIL-COMPLIANT', color: 'bg-teal-600', text: 'text-teal-800' },
];

export interface GenOptions {
  length: number;
  includeUpper: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  prefix: string;
}

/** 按选项生成一条随机密码（prefix 计入总长度） */
export function generatePassword(opts: GenOptions): string {
  let charset = 'abcdefghijklmnopqrstuvwxyz';
  if (opts.includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (opts.includeNumbers) charset += '0123456789';
  if (opts.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const actualLength = Math.max(opts.length - opts.prefix.length, 6);
  let result = '';
  for (let i = 0; i < actualLength; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return opts.prefix + result;
}

/** 1~5 级强度评分 */
export function calcStrength(pass: string): number {
  let score = 1;
  if (pass.length > 10) score += 1;
  if (pass.length > 15) score += 1;
  if (/[A-Z]/.test(pass)) score += 0.5;
  if (/[0-9]/.test(pass)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  return Math.min(Math.round(score), 5);
}
