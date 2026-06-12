import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, User, RefreshCw } from 'lucide-react';
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

const TEAM_COLORS = [
  'bg-[#1A73E8]', 'bg-[#137333]', 'bg-[#B05E00]',
  'bg-[#9334E6]', 'bg-[#D93025]', 'bg-[#0097A7]',
];

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTeams = useCallback(async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from('gsyen_team_members')
      .select('role, gsyen_teams(*)')
      .eq('user_id', user.id);
    if (error || !data) {
      console.error('loadTeams error:', error);
      return;
    }
    const list = data
      .map((r: any) => r.gsyen_teams ? { ...r.gsyen_teams, role: r.role } : null)
      .filter(Boolean) as TeamItem[];
    setTeams(list);
    if (list.length && !selected) setSelected(list[0]);
  }, [user, selected]);

  const loadMembers = useCallback(async (teamId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('gsyen_team_members')
      .select('user_id, role, joined_at')
      .eq('team_id', teamId);
    if (error) console.error('loadMembers error:', error);
    setMembers((data as MemberItem[]) ?? []);
  }, []);

  const refreshTeams = async () => {
    setIsRefreshing(true);
    await loadTeams();
    setIsRefreshing(false);
  };

  useEffect(() => { if (user) loadTeams(); }, [user, loadTeams]);
  useEffect(() => { if (selected) loadMembers(selected.id); }, [selected, loadMembers]);

  async function createTeam() {
    if (!supabase || !user || !inputName.trim()) return;
    setBusy(true); setError(null);
    const { data: team, error: e1 } = await supabase
      .from('gsyen_teams')
      .insert({ name: inputName.trim(), owner_id: user.id })
      .select()
      .single();
    if (e1 || !team) { setError(e1?.message ?? '创建失败'); setBusy(false); return; }
    const { error: e2 } = await supabase
      .from('gsyen_team_members')
      .insert({ team_id: team.id, user_id: user.id, role: 'owner' });
    if (e2) { setError('创建团队成功，但添加成员失败'); setBusy(false); return; }
    setBusy(false); setInputName(''); setModal('none');
    await loadTeams();
    setSelected({ ...team, role: 'owner' });
  }

  async function joinTeam() {
    if (!supabase || !user || !inputCode.trim()) return;
    setBusy(true); setError(null);
    const { data: team, error: e1 } = await supabase
      .from('gsyen_teams')
      .select('*')
      .eq('invite_code', inputCode.trim())
      .single();
    if (e1 || !team) { setError('邀请码无效'); setBusy(false); return; }
    const { error: e2 } = await supabase
      .from('gsyen_team_members')
      .insert({ team_id: team.id, user_id: user.id, role: 'member' });
    if (e2) { setError('加入失败，可能已是成员'); setBusy(false); return; }
    setBusy(false); setInputCode(''); setModal('none');
    await loadTeams();
  }

  async function leaveOrDisband(disband: boolean) {
    if (!supabase || !user || !selected) return;
    if (disband) {
      await supabase.from('gsyen_teams').delete().eq('id', selected.id);
    } else {
      await supabase.from('gsyen_team_members').delete().eq('team_id', selected.id).eq('user_id', user.id);
    }
    setSelected(null); setMembers([]); loadTeams();
  }

  if (authLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#1A73E8] border-t-transparent animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#F8F9FA] to-[#EFEFEF]">
      <Plus className="w-16 h-16 text-[#1A73E8] opacity-60" strokeWidth={1.5} />
      <div className="flex flex-col items-center gap-1">
        <p className="text-[16px] font-medium text-[#202124]">开始团队协作</p>
        <p className="text-[13px] text-[#5F6368]">登录后创建或加入团队</p>
      </div>
      <button onClick={() => window.location.href = '/login'}
        className="mt-2 px-6 py-2.5 rounded-full text-[13px] font-medium bg-[#1A73E8] text-white hover:bg-[#1557B0] transition-all">
        前往登录
      </button>
    </div>
  );

  const myRole  = selected?.role;
  const roleLabel = myRole === 'owner' ? '团长' : myRole === 'member' ? '成员' : '—';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8F9FA]">

      {/* 汇总卡片 */}
      <div className="flex gap-4 px-6 py-5 shrink-0 items-end">
        <StatCard label="我的团队" value={String(teams.length)} icon={Shield} />
        <StatCard label="当前成员" value={selected ? String(members.length) : '—'} icon={Users} />
        <StatCard label="我的角色" value={roleLabel} icon={User}
          iconBg={myRole === 'owner' ? 'bg-[#E6F4EA]' : 'bg-[#E8F0FE]'}
          iconColor={myRole === 'owner' ? 'text-[#137333]' : 'text-[#1A73E8]'} />
        <button onClick={refreshTeams} disabled={isRefreshing}
          className="shrink-0 p-2.5 border border-[#1A1A1A]/15 rounded-lg hover:bg-[#F1F3F4] transition-all disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 text-[#1A1A1A]/70 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
        </button>
      </div>

      {/* 团队切换 avatar + 操作按钮 */}
      <div className="flex items-center gap-3 px-6 pb-4 shrink-0 flex-wrap">
        {teams.map(t => {
          const color = TEAM_COLORS[t.id.charCodeAt(0) % TEAM_COLORS.length];
          return (
            <button key={t.id} onClick={() => setSelected(t)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${color} ${
                selected?.id === t.id
                  ? 'ring-2 ring-offset-2 ring-[#1A73E8]'
                  : 'opacity-75 hover:opacity-100'
              }`}
              title={t.name}>
              {t.name[0].toUpperCase()}
            </button>
          );
        })}
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
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#F8F9FA] to-[#EFEFEF]">
          <Plus className="w-16 h-16 text-[#DADCE0]" strokeWidth={1.5} />
          <div className="flex flex-col items-center gap-1">
            <p className="text-[16px] font-medium text-[#202124]">创建第一个团队</p>
            <p className="text-[13px] text-[#5F6368]">点击下方"开团"开始协作</p>
          </div>
          <button onClick={() => { setModal('create'); setError(null); }}
            className="mt-3 px-6 py-2.5 rounded-full text-[13px] font-medium bg-[#1A73E8] text-white hover:bg-[#1557B0] transition-all flex items-center gap-1.5">
            <Plus className="w-4 h-4" strokeWidth={2} />
            开团
          </button>
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
