import { useTeams, TeamItem, _invalidateTeams } from './useTeams';
import { supabase } from '../lib/supabase';

export type { TeamItem };

export function useBrandTeams(_user?: any) {
  const { teams, reload } = useTeams();

  const disband = async (teamId: string, zh: boolean) => {
    if (!supabase || !window.confirm(zh ? '确定解散这个团队吗？' : 'Disband this team?')) return;
    const { error } = await supabase.from('gsyen_teams').delete().eq('id', teamId);
    if (error) { console.error('disband error:', error); return; }
    _invalidateTeams();
    reload();
  };

  return { teams, disband, loadTeams: reload };
}
