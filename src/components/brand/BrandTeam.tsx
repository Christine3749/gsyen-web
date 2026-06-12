import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/useAuth';
import BrandTeamSidebar, { type TeamItem } from './BrandTeamSidebar';
import BrandTeamDetail, { type MemberItem } from './BrandTeamDetail';

type Modal = 'none' | 'create' | 'join';

export default function BrandTeam() {
  const { user } = useAuth();
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
      .from('team_members')
      .select('role, teams(*)')
      .eq('user_id', user.id);
    if (!data) return;
    const list = data.map((r: any) => ({ ...r.teams, role: r.role })) as TeamItem[];
    setTeams(list);
    if (list.length && !selected) setSelected(list[0]);
  }, [user, selected]);

  const loadMembers = useCallback(async (teamId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('team_members')
      .select('user_id, role, joined_at')
      .eq('team_id', teamId);
    setMembers((data as MemberItem[]) ?? []);
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);
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

  if (!user) return (
    <div className="flex-1 flex items-center justify-center text-[12px] font-mono text-[#9AA0A6]">
      请先登录
    </div>
  );

  return (
    <div className="flex-1 flex min-h-0">
      <BrandTeamSidebar
        teams={teams} selectedId={selected?.id ?? null}
        onSelect={t => setSelected(t)}
        onCreate={() => { setModal('create'); setError(null); }}
        onJoin={()   => { setModal('join');   setError(null); }}
      />

      {/* 主内容 */}
      {selected ? (
        <BrandTeamDetail
          team={selected} members={members} currentUserId={user.id}
          onLeave={()   => leaveOrDisband(false)}
          onDisband={()  => leaveOrDisband(true)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-[12px] font-mono text-[#9AA0A6]">
          点左侧 + 开团，或输入邀请码加入
        </div>
      )}

      {/* 开团 / 加入 Modal */}
      {modal !== 'none' && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModal('none')}>
          <div className="bg-white rounded-2xl border border-[#DADCE0] px-6 py-5 w-80 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-[#1A1A1A]/50">
              {modal === 'create' ? '开团' : '加入团队'}
            </p>
            <input
              autoFocus
              value={modal === 'create' ? inputName : inputCode}
              onChange={e => modal === 'create' ? setInputName(e.target.value) : setInputCode(e.target.value)}
              placeholder={modal === 'create' ? '团队名称…' : '粘贴邀请码…'}
              className="border border-[#DADCE0] rounded-lg px-3 py-2 text-[12px] font-mono text-[#202124] placeholder:text-[#9AA0A6] outline-none focus:border-[#1A73E8] transition-colors"
              onKeyDown={e => e.key === 'Enter' && (modal === 'create' ? createTeam() : joinTeam())}
            />
            {error && <p className="text-[11px] font-mono text-[#D93025]">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal('none')} className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase rounded-none border border-[#1A1A1A]/15 text-[#1A1A1A]/50 hover:bg-[#1A1A1A]/5 transition-all">取消</button>
              <button onClick={modal === 'create' ? createTeam : joinTeam} disabled={busy} className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase rounded-none bg-[#1A1A1A] text-[#F9F8F6] hover:bg-[#1A1A1A]/80 transition-all disabled:opacity-30">
                {busy ? '…' : modal === 'create' ? '创建' : '加入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
