/**
 * financeLedger — Atelier Ledger 的纯数据/逻辑层
 *
 * 类型、本地存储键、默认账目、分类文案，以及两个纯函数：
 * toUsd（把任意币种换算到 USD 基准）/ fmtAmount（按显示币种格式化）。
 * 原本这两个函数依赖组件内的 usdToCny 闭包，这里改成显式入参，组件只管渲染。
 */
import { Currency, convertAmount } from '../utils/exchangeRate';

export type TxType = 'income' | 'expense';
export type TxCategory = 'royalty' | 'commission' | 'material' | 'server' | 'marketing' | 'consultancy';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: Currency;          // 'CNY' | 'USD' —— 记录原始币种，汇总/展示时按实时汇率统一换算
  type: TxType;
  category: TxCategory;
  date: string;
  notes?: string;
}

export const LOCAL_STORAGE_KEY = 'identity_lab_finance';

/** 旧记录没有 currency 字段——按历史惯例（账面一律按 USD 存储）兜底，向后兼容 */
export function sanitizeTransactions(raw: any[]): Transaction[] {
  return raw.map(item => ({ ...item, currency: item.currency === 'CNY' ? 'CNY' : 'USD' }));
}

/** 首次进入时写入的示例账目 */
export function defaultTransactions(lang: 'zh' | 'en'): Transaction[] {
  return [
    {
      id: 't1',
      description: lang === 'zh' ? '皇家加冕珠宝商 (Royal Crown Jewelers) 矢量图标授权税收' : 'Royalty Licensing - Royal Crown Jewelers SVG',
      amount: 4500, currency: 'USD', type: 'income', category: 'royalty',
      date: '2026-05-20', notes: 'Standard vector brand licensing. Quarter 2 royalties.',
    },
    {
      id: 't2',
      description: lang === 'zh' ? '高科技半导体 Neural Processor 项目定制设顾问费完成' : 'Consultancy Commission: Neural Processor custom UI suite',
      amount: 18500, currency: 'USD', type: 'income', category: 'commission',
      date: '2026-05-24', notes: 'Aesthetic high-concept identity consultation premium milestone',
    },
    {
      id: 't3',
      description: lang === 'zh' ? '德国高纬哑光原棉纸与高纯度墨水测试介质采购' : 'Premium German Matte Cotton Card Stock Material Procurement',
      amount: 1250, currency: 'USD', type: 'expense', category: 'material',
      date: '2026-05-25', notes: 'Imported textured thick paper stocks for press test runs.',
    },
    {
      id: 't4',
      description: lang === 'zh' ? '机密军事级安全沙河服务器及分布式 K8s 节点安全代管' : 'Citadel SSL Security Vault Node & Cloud Managed VM Node',
      amount: 450, currency: 'USD', type: 'expense', category: 'server',
      date: '2026-05-25', notes: 'Automatic key rotating server maintenance.',
    },
  ];
}

export const itemCategoryTags: Record<TxCategory, { labelZh: string; labelEn: string; color: string }> = {
  royalty:     { labelZh: '授权税/版税',     labelEn: 'Royalty Ink', color: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
  commission:  { labelZh: '品牌高定佣金',     labelEn: 'Atelier Work', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  material:    { labelZh: '高端物料介质',     labelEn: 'Paper & Clay', color: 'text-amber-800 bg-amber-50 border-amber-200' },
  server:      { labelZh: '云沙箱与密钥维护', labelEn: 'Citadel Node', color: 'text-zinc-800 bg-zinc-50 border-zinc-200' },
  marketing:   { labelZh: '经典推广公关',     labelEn: 'Atelier PR', color: 'text-rose-800 bg-rose-50 border-rose-200' },
  consultancy: { labelZh: '设计路线图顾问',   labelEn: 'Strategy Guid', color: 'text-teal-800 bg-teal-50 border-teal-200' },
};

/** 把"按交易原始币种记录的金额"统一换算成 USD 基准，保证报表口径一致 */
export function toUsd(amount: number, currency: Currency, usdToCny: number): number {
  return currency === 'USD' ? amount : convertAmount(amount, 'CNY', 'USD', usdToCny);
}

/**
 * 账面金额一律按 USD 存储；展示时按需换算并加上对应符号（符号居左，财务报表传统排法）。
 * @param showCny 是否按人民币显示
 */
export function fmtAmount(usd: number, showCny: boolean, usdToCny: number, opts?: { decimals?: number }): string {
  const decimals = opts?.decimals ?? 0;
  if (showCny) {
    const cny = convertAmount(usd, 'USD', 'CNY', usdToCny);
    return `¥ ${cny.toLocaleString(undefined, { maximumFractionDigits: decimals || 1 })}`;
  }
  return `${'$'} ${usd.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
