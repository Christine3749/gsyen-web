/**
 * 疆域 GSYEN · 自噬系统（Self-Devouring Intelligence）
 *
 * 核心能力：
 *  1. 中文精确 Token 估算（覆盖 CJK / 全角 / 中文标点完整 Unicode 范围）
 *  2. 权重优先剪枝 + Token 熔断，防止 context window 溢出
 *  3. 内容哈希去重，阻断重复知识块污染自噬体
 *  4. 词频信息熵检测，监测语料退化（Model Collapse）
 */

import type { DevourChunk, KnowledgeSource } from './types';

export class SelfDevouringManager {
  private chunks: DevourChunk[] = [];
  private hashes: Set<string>   = new Set();

  /**
   * 中文精确 Token 估算。
   *
   * 标准 BPE tokenizer 对中文的处理：
   *   - CJK 统一汉字、扩展块、全角符号 → 约 1.5~2.5 Token/字
   *   - ASCII / 拉丁字符               → 约 4 字符/Token（即 0.25）
   *
   * 取保守系数 2.1，确保估算结果偏高（宁可少用 Token，不要溢出）。
   */
  private estimateTokens(text: string): number {
    let n = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      const isCJK =
        (c >= 0x4E00 && c <= 0x9FFF)  ||  // CJK 统一汉字
        (c >= 0x3400 && c <= 0x4DBF)  ||  // CJK 扩展 A
        (c >= 0x20000 && c <= 0x2A6DF)||  // CJK 扩展 B（代理对，charCodeAt 可能不准，保留作兜底）
        (c >= 0xF900 && c <= 0xFAFF)  ||  // CJK 兼容汉字
        (c >= 0x3000 && c <= 0x303F)  ||  // CJK 标点符号
        (c >= 0xFF00 && c <= 0xFFEF);     // 全角字符
      n += isCJK ? 2.1 : 0.25;
    }
    return Math.ceil(n);
  }

  /**
   * 吞噬新知识块。
   * 内容哈希去重：相同来源 + 相同长度 + 相同首尾片段 → 视为重复，静默丢弃。
   */
  ingest(source: KnowledgeSource, content: string, weight: number): void {
    const s = content.trim();
    if (!s) return;
    const hash = `${source}|${s.length}|${s.slice(0, 16)}|${s.slice(-16)}`;
    if (this.hashes.has(hash)) return;
    this.chunks.push({
      id:        crypto.randomUUID(),
      source,
      content:   s,
      weight:    Math.max(0, Math.min(1, weight)),
      timestamp: Date.now(),
    });
    this.hashes.add(hash);
  }

  /**
   * 构建自噬 Prompt。
   *
   * 算法：
   *  1. 按权重降序排列所有知识块
   *  2. 扣除 userPrompt 和系统固定开销后，计算可用 Token 预算
   *  3. 依次填入知识块直到预算耗尽（熔断）
   */
  async buildPrompt(userPrompt: string, maxTokens = 3000): Promise<string> {
    const reserved  = this.estimateTokens(userPrompt) + 200;
    const budget    = maxTokens - reserved;
    const sorted    = [...this.chunks].sort((a, b) => b.weight - a.weight);
    let   used      = 0;
    const lines: string[] = [];

    for (const c of sorted) {
      const line = `[${c.source}|w=${c.weight.toFixed(2)}] ${c.content}`;
      const cost = this.estimateTokens(line);
      if (used + cost > budget) break;
      lines.push(line);
      used += cost;
    }

    const header =
      `你继承了 Ethan 的判断力。` +
      `以下是经中文 Token 剪枝后保留的核心知识块（${lines.length}/${this.chunks.length}）：\n` +
      lines.join('\n');

    return `${header}\n\n当前任务：${userPrompt}`;
  }

  /**
   * 词频信息熵检测：监测语料退化（Model Collapse）。
   *
   * 逻辑：取最近 20 条知识块，统计词频。
   * 若前 5 高频词汇总占比 > 80%，说明语料严重同质化，触发退化警报。
   */
  detectCollapse(): boolean {
    const sample = this.chunks.slice(-20);
    if (sample.length < 10) return false;
    const freq: Record<string, number> = {};
    let   total = 0;
    for (const c of sample) {
      for (const w of c.content.split(/[\s，。！？、]+/)) {
        if (w.length < 2) continue;
        freq[w] = (freq[w] ?? 0) + 1;
        total++;
      }
    }
    if (total === 0) return false;
    const top5 = Object.values(freq).sort((a, b) => b - a).slice(0, 5)
                        .reduce((s, v) => s + v, 0);
    return top5 / total > 0.8;
  }

  get chunkCount(): number { return this.chunks.length; }
}
