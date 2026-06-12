import React, { useState, useEffect, useCallback } from 'react';
import { Users, Shield, Plus, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/useAuth';
import BrandTeamDetail, { type MemberItem } from './BrandTeamDetail';

export interface TeamItem {
  id:          string;
  name:        string;
  owner_id:    string;
  invite_code: string;
  seat_limit:  number;
  role:        string;
}

type Modal = 'none' | 'create' | 'join';

function StatCard({ label, value, icon: Icon, iconBg = 'bg-[#E8F0FE]', iconColor = 'text-[#1A73E8]' }: {
  label: string; value: string; icon: React.ElementType;
  iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="flex-1 bg-white rounded-lg border border-[#DADCE0] px-5 py-4 min-w-0 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[11px] text-[#5F6368] font-sans">{label}</p>
        <p className="text-[22px] font-bold text-[#202124] leading-none font-sans">{value}</p>
      </div>
    </div>
  );
}

export default function BrandTeam() {
  const { user, loading: authLoading } = useAuth();
  const [teams,     setTeams]     = useState<TeamItem[]>([]);
  const [selected,  setSelected]  = useState<TeamItem | null>(null);
  const [members,   setMembers]   = useState<MemberItem[]>([]);
  const [modal,     setModal]     = useState<Modal>('none');
  const [inputName, setInputName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    if (!supabase || !user) return;
    const { data } = await supabase
      .from('team_members').select('role, teams(*)').eq('user_id', user.id);
    if (!data) return;
    const list = data.map((r: any) => ({ ...r.teams, role: r.role })) as TeamItem[];
    setTeams(list);
    if (list.length && !selected) setSelected(list[0]);
  }, [user, selected]);

  const loadMembers = useCallback(async (teamId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('team_members').select('user_id, role, joined_at').eq('team_id', teamId);
    setMembers((data as MemberItem[]) ?? []);
  }, []);

  useEffect(() => { if (user) loadTeams(); }, [user, loadTeams]);
  useEffect(() => { if (selected) loadMembers(selected.id); }, [selected, loadMembers]);

  async function createTeam() {
    if (!supabase || !user || !inputName.trim()) return;
    setBusy(true); setError(null);
    const { data: team, error: e1 } = await supabase
      .from('teams').insert({ name: inputName.trim(), owner_id: user.id }).select().single();
    if (e1 || !team) { setError(e1?.message ?? '创建失败'); setBusy(false); return; }
    await supabase.from('team_members').insert({ team_id: team.id, user_id: user.id, role: 'owner' });
    setBusy(false); setInputName(''); setModal('none');
    await loadTeams();
    setSelected({ ...team, role: 'owner' });
  }

  async function joinTeam() {
    if (!supabase || !user || !inputCode.trim()) return;
    setBusy(true); setError(null);
    const { data: team } = await supabase
      .from('teams').select('*').eq('invite_code', inputCode.trim()).single();
    if (!team) { setError('邀请码无效'); setBusy(false); return; }
    const { error: e2 } = await supabase
      .from('team_members').insert({ team_id: team.id, user_id: user.id, role: 'member' });
    if (e2) { setError('加入失败，可能已是成员'); setBusy(false); return; }
    setBusy(false); setInputCode(''); setModal('none');
    await loadTeams();
  }

  async function leaveOrDisband(disband: boolean) {
    if (!supabase || !user || !selected) return;
    if (disband) {
      await supabase.from('teams').delete().eq('id', selected.id);
    } else {
      await supabase.from('team_members').delete().eq('team_id', selected.id).eq('user_id', user.id);
    }
    setSelected(null); setMembers([]); loadTeams();
  }

  if (authLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#1A73E8] border-t-transparent animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="flex-1 flex items-center justify-center text-[13px] font-sans text-[#5F6368]">
      请先登录
    </div>
  );

  const myRole  = selected?.role;
  const roleLabel = myRole === 'owner' ? '团长' : myRole === 'member' ? '成员' : '—';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8F9FA]">

      {/* 汇总卡片 */}
      <div className="flex gap-4 px-6 py-5 shrink-0">
        <StatCard label="我的团队" value={String(teams.length)} icon={Shield} />
        <StatCard label="当前成员" value={selected ? String(members.length) : '—'} icon={Users} />
        <StatCard label="我的角色" value={roleLabel} icon={User}
          iconBg={myRole === 'owner' ? 'bg-[#E6F4EA]' : 'bg-[#E8F0FE]'}
          iconColor={myRole === 'owner' ? 'text-[#137333]' : 'text-[#1A73E8]'} />
      </div>

      {/* 团队切换 chips + 操作按钮 */}
      <div className="flex items-center gap-2 px-6 pb-4 shrink-0 flex-wrap">
        {teams.map(t => (
          <button key={t.id} onClick={() => setSelected(t)}
            className={`px-3 py-1 rounded-full text-[12px] font-sans font-medium transition-all ${
              selected?.id === t.id
                ? 'bg-[#1A73E8] text-white'
                : 'bg-white border border-[#DADCE0] text-[#5F6368] hover:bg-[#F1F3F4]'
            }`}>
            {t.name}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => { setModal('join'); setError(null); }}
            className="px-3 py-1 rounded-full text-[12px] font-sans font-medium bg-white border border-[#DADCE0] text-[#5F6368] hover:bg-[#F1F3F4] transition-all">
            加入
          </button>
          <button onClick={() => { setModal('create'); setError(null); }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-sans font-medium bg-[#1A73E8] text-white hover:bg-[#1557B0] transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            开团
          </button>
        </div>
      </div>

      {/* 主内容 */}
      {selected ? (
        <BrandTeamDetail
          team={selected} members={members} currentUserId={user.id}
          onLeave={() => leaveOrDisband(false)}
          onDisband={() => leaveOrDisband(true)}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Shield className="w-10 h-10 text-[#DADCE0]" strokeWidth={1.2} />
          <p className="text-[14px] font-sans text-[#5F6368]">点击"开团"创建你的第一个团队</p>
        </div>
      )}

      {/* 开团 / 加入 Modal */}
      {modal !== 'none' && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
          onClick={() => setModal('none')}>
          <div className="bg-white rounded-2xl border border-[#DADCE0] px-6 py-5 w-80 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}>
            <p className="text-[13px] font-sans font-semibold text-[#202124]">
              {modal === 'create' ? '创建团队' : '加入团队'}
            </p>
            <input autoFocus
              value={modal === 'create' ? inputName : inputCode}
              onChange={e => modal === 'create' ? setInputName(e.target.value) : setInputCode(e.target.value)}
              placeholder={modal === 'create' ? '团队名称…' : '粘贴邀请码…'}
              className="border border-[#DADCE0] rounded-lg px-3 py-2 text-[13px] font-sans text-[#202124] placeholder:text-[#9AA0A6] outline-none focus:border-[#1A73E8] transition-colors"
              onKeyDown={e => e.key === 'Enter' && (modal === 'create' ? createTeam() : joinTeam())}
            />
            {error && <p className="text-[12px] font-sans text-[#D93025]">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal('none')}
                className="px-4 py-2 rounded-full text-[12px] font-sans text-[#5F6368] hover:bg-[#F1F3F4] transition-all">
                取消
              </button>
              <button onClick={modal === 'create' ? createTeam : joinTeam} disabled={busy}
                className="px-4 py-2 rounded-full text-[12px] font-sans font-medium bg-[#1A73E8] text-white hover:bg-[#1557B0] disabled:opacity-40 transition-all">
                {busy ? '…' : modal === 'create' ? '创建' : '加入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
