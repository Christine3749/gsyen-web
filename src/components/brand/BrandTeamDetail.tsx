import React, { useState } from 'react';
import { Copy, Check, LogOut, Trash2 } from 'lucide-react';
import type { TeamItem } from './BrandTeamSidebar';

export interface MemberItem {
  user_id:   string;
  role:      string;
  joined_at: string;
}

interface Props {
  team:          TeamItem;
  members:       MemberItem[];
  currentUserId: string;
  onLeave:       () => void;
  onDisband:     () => void;
}

export default function BrandTeamDetail({ team, members, currentUserId, onLeave, onDisband }: Props) {
  const [copied, setCopied] = useState(false);
  const isOwner = team.owner_id === currentUserId;

  function copyInvite() {
    navigator.clipboard.writeText(team.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 min-h-0">

      {/* 团队头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-mono font-bold text-[#1A1A1A]">{team.name}</h2>
          <p className="text-[11px] font-mono text-[#9AA0A6] mt-0.5">
            {members.length} / {team.seat_limit} 席位
            {isOwner && <span className="ml-2 text-[#1A6ECC]">· 团长</span>}
          </p>
        </div>
        {isOwner ? (
          <button onClick={onDisband} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase rounded-none border border-red-200 text-red-700 hover:bg-red-50 transition-all">
            <Trash2 className="w-3 h-3" strokeWidth={2} />
            解散
          </button>
        ) : (
          <button onClick={onLeave} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase rounded-none border border-[#1A1A1A]/15 text-[#1A1A1A]/50 hover:bg-[#1A1A1A]/5 transition-all">
            <LogOut className="w-3 h-3" strokeWidth={2} />
            退出
          </button>
        )}
      </div>

      {/* 邀请码 */}
      {isOwner && (
        <div className="bg-white rounded-xl border border-[#DADCE0] px-5 py-4">
          <p className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-[#1A1A1A]/50 mb-2">邀请码</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-[13px] font-mono text-[#202124] bg-[#F9F8F6] px-3 py-2 rounded-lg border border-[#DADCE0]">
              {team.invite_code}
            </code>
            <button
              onClick={copyInvite}
              className="flex items-center gap-1 px-3 py-2 text-[10px] font-mono font-bold tracking-widest uppercase rounded-none bg-[#1A1A1A] text-[#F9F8F6] hover:bg-[#1A1A1A]/80 transition-all"
            >
              {copied ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <Copy className="w-3 h-3" strokeWidth={2} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      )}

      {/* 成员列表 */}
      <div>
        <p className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-[#1A1A1A]/50 mb-3">成员</p>
        <div className="flex flex-col gap-2">
          {members.map(m => {
            const isSelf = m.user_id === currentUserId;
            return (
              <div key={m.user_id} className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-[#DADCE0]">
                <div className="w-8 h-8 rounded-full bg-[#F4F2EE] border border-[#1A1A1A]/8 flex items-center justify-center text-[11px] font-mono font-bold text-[#1A1A1A]/50">
                  {m.user_id.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-mono text-[#202124]">
                    {isSelf ? '你' : `成员 ${m.user_id.slice(0, 6)}`}
                  </p>
                  <p className="text-[10px] font-mono text-[#9AA0A6]">
                    {new Date(m.joined_at).toLocaleDateString('zh-CN')} 加入
                  </p>
                </div>
                <span className={`text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 ${
                  m.role === 'owner'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'border border-[#1A1A1A]/15 text-[#1A1A1A]/40'
                }`}>
                  {m.role === 'owner' ? '团长' : '成员'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
