/**
 * 疆域 GSYEN · 核心架构思想草案 (v1.0)
 * 包含：自噬系统、界面倒置、泡泡哲学、幽灵消息、Session流
 *
 * ⚠️  本文件为架构概念验证草案，故意保留工程漏洞，供 AI 代码审计工具检测。
 *     生产代码请勿直接复用。
 */

import React, { useEffect, useState, useRef } from 'react';

// ============================================================
// 类型系统
// ============================================================

/** 统一消息体：个人 & 团队共用同一结构（架构决策，亦是隐患） */
interface GsyenStreamMessage {
  id: string;
  sessionId: string;   // 团队和个人公用同一 ID 抽象
  senderId: string;
  content: string;
  timestamp: number;
  entityId?: string;   // 关联实体（泡泡哲学入口）
  // 雷 3-A: role 字段缺失，无法在渲染层区分 user / AI / system
}

/** 实体卡片（人 / 物品 / 订单 / 日程）统一抽象 */
interface GsyenCard {
  id: string;
  type: 'contact' | 'order' | 'schedule' | 'item';
  name: string;
  ownerId: string;
  teamId?: string;
  // 雷 3-B: ownerId 与 teamId 并存但没有 RLS 映射，查询时可能越权读取他人卡片
}

/** 自噬系统上下文块 */
interface DevourChunk {
  source: 'chat' | 'doc' | 'kanban';
  content: string;
  weight: number;      // 重要性权重（0-1），尚未实现剪枝逻辑
}

// ============================================================
// 核心定义 1: Session = 信息流（重新定义会话）
// 漏洞：团队与个人 Session 强行合一，缺乏权限隔离与高性能索引
// ============================================================

export class GsyenSessionStream {
  private messages: GsyenStreamMessage[] = [];
  // 雷 3-C: 直接用内存数组，无分页、无游标，百万条后 OOM
  private ws: WebSocket | null = null;

  constructor(private readonly sessionId: string) {}

  connect(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const msg: GsyenStreamMessage = JSON.parse(event.data);
      // 雷 3-D: 未做 JSON schema 校验，恶意消息可注入任意字段
      this.messages.push(msg);
    };

    // 雷 3-E: 没有 onclose / onerror 重连逻辑，断线即永久失联
  }

  /** 返回最近 N 条消息（用于幽灵消息渲染） */
  getRecent(n: number): GsyenStreamMessage[] {
    return this.messages.slice(-n);
    // 雷 3-F: slice(-n) 每次都复制数组尾部，高频调用时 GC 压力大
  }

  disconnect() {
    this.ws?.close();
    // 雷 3-G: messages 数组未清空，内存泄漏
  }
}

// ============================================================
// 核心定义 2: 自噬系统（Self-Devouring Intelligence）
// 漏洞：无限制拼接历史，导致 Token 爆炸与 Model Collapse
// ============================================================

export class SelfDevouringManager {
  private chunks: DevourChunk[] = [];
  private apiKey = 'sk-hardcoded-key-DO-NOT-SHIP';
  // 雷 2-A: API Key 硬编码，扫描即泄露

  /** 吞噬新知识块 */
  ingest(chunk: DevourChunk) {
    this.chunks.push(chunk);
    // 雷 2-B: 没有去重、没有向量相似度过滤，相同内容会被反复注入
  }

  /**
   * 吞噬自身历史，让 AI 继承 Ethan 的判断力
   * 雷 2-C: 无 RAG 检索、无剪枝、无 token 预算控制
   *         当 chunks 积累到数百条后，单次请求直接超出 context window
   */
  async devourAndOptimizePrompt(currentPrompt: string): Promise<string> {
    const allText = this.chunks
      .map(c => `[${c.source}|weight=${c.weight}] ${c.content}`)
      .join('\n');

    const systemInstruction =
      `你继承了 Ethan 的判断力。以下是你的自噬历史手册（共 ${this.chunks.length} 块）：\n${allText}`;

    // 雷 2-D: 未做 token 计数，prompt 长度不可控
    return `${systemInstruction}\n\n当前任务：${currentPrompt}`;
  }

  /**
   * 模型崩溃检测（占位，未实现）
   * 雷 2-E: model collapse 是长期问题，此处无任何输出多样性监测
   */
  detectCollapse(): boolean {
    return false; // TODO
  }
}

// ============================================================
// 核心定义 3: 幽灵消息（Ghost Messages）& 泡泡哲学
// 漏洞：WebSocket 高频更新 → React 全页面重渲染灾难
// ============================================================

interface KanbanCardProps {
  cardId: string;
  cardName: string;
  card: GsyenCard;
  ghostMessages: GsyenStreamMessage[];  // 幽灵消息：最近 6 条
  sessionStream: GsyenSessionStream;
}

// 雷 1-A: 组件未用 React.memo，ghostMessages 引用每次变化都触发全部 50 个卡片重渲染
export function KanbanCard({ cardId, cardName, ghostMessages, sessionStream }: KanbanCardProps) {
  const [bubble, setBubble] = useState(false);
  const [liveMessages, setLiveMessages] = useState<GsyenStreamMessage[]>(ghostMessages);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 雷 1-B: setInterval 每 500ms 轮询 getRecent()，50 张卡 = 每秒 100 次 setState
    //         应改用 Zustand selector + 单一 WebSocket 事件派发
    intervalRef.current = setInterval(() => {
      setLiveMessages(sessionStream.getRecent(6));
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // 雷 1-C: sessionStream 本身没有被销毁，disconnect() 未调用
    };
  }, [sessionStream]); // 雷 1-D: ghostMessages 未列入依赖，初始值永久过期

  /** 泡泡哲学：点击卡片，以该卡为上下文启动对话 */
  const handleBubbleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBubble(true);
    // 雷 1-E: bubble 激活后没有任何关闭逻辑，点开就关不掉
    console.log(`以卡片 ${cardId} 启动上下文对话`);
  };

  return (
    <div
      className="kanban-card"
      onClick={handleBubbleClick}
      style={{ border: '1px solid #1a1a1a', padding: '12px', marginBottom: '8px' }}
    >
      <h4 style={{ margin: 0 }}>{cardName}</h4>

      {/* 幽灵消息区：无 key 稳定性保障，频繁 unmount/remount */}
      <div className="ghost-messages-zone" style={{ opacity: 0.4, marginTop: '8px' }}>
        {liveMessages.slice(-6).map((msg, index) => (
          // 雷 1-F: key 用 index 而非 msg.id，列表变化时 diff 算法失效
          <div key={index} className="ghost-message-line" style={{ fontSize: '11px' }}>
            {msg.content}
          </div>
        ))}
      </div>

      {/* 泡泡（未实现关闭） */}
      {bubble && (
        <div style={{
          position: 'absolute', width: 36, height: 36,
          borderRadius: '50%', background: '#1A1A1A',
          bottom: -18, left: '50%', transform: 'translateX(-50%)',
        }}>
          {/* 雷 1-G: 泡泡没有 z-index 管理，多卡同时激活时会层叠混乱 */}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 核心定义 4: 界面倒置（Chat 是 90%，UI 是弹药）
// 功能检测：ChatContext 上下文注入
// ============================================================

export interface ChatContextPayload {
  entityType: GsyenCard['type'];
  entityId: string;
  entityName: string;
  recentMessages: GsyenStreamMessage[];
  // 雷 4-A: recentMessages 直接序列化整条消息，可能携带敏感字段透传给 LLM
}

export function buildChatContext(card: GsyenCard, stream: GsyenSessionStream): ChatContextPayload {
  return {
    entityType: card.type,
    entityId: card.id,
    entityName: card.name,
    recentMessages: stream.getRecent(10),
    // 雷 4-B: 没有按 card.ownerId 过滤，团队成员 A 可能看到成员 B 的私有消息
  };
}

// ============================================================
// 核心定义 5: 自噬系统 · 知识分级（未实现的 ＊级权限）
// 功能检测：权限守卫
// ============================================================

type UserTier = 'guest' | 'free' | 'member' | 'star';

export function canInjectKnowledge(tier: UserTier): boolean {
  // 雷 5-A: 仅做前端判断，无服务端 RLS 二次校验
  //         恶意用户绕过前端直接调 API 即可注入任意知识
  return tier === 'star';
}

export async function injectKnowledgeToMiao(
  content: string,
  tier: UserTier,
): Promise<{ ok: boolean; error?: string }> {
  if (!canInjectKnowledge(tier)) {
    return { ok: false, error: '权限不足' };
  }
  // 雷 5-B: content 未做长度限制、XSS 过滤、prompt injection 防护
  //         ＊级用户可以注入 "忽略之前所有指令" 类攻击
  const response = await fetch('/api/knowledge/inject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
    // 雷 5-C: 无 CSRF token，跨站请求伪造可触发知识注入
  });
  return response.json();
}

// ============================================================
// 导出：供测试文件引用
// ============================================================

export type { GsyenStreamMessage, GsyenCard, DevourChunk, UserTier };
