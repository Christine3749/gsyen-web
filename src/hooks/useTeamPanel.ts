import { useState, useEffect } from 'react';
import { TeamItem, TeamMember, loadTeamMembers } from './useTeams';

export function useTeamPanel(onTeamChange?: (active: boolean) => void) {
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [showPanel,    setShowPanel]    = useState(false);
  const [members,      setMembers]      = useState<TeamMember[]>([]);

  useEffect(() => {
    const toggle = () => setShowPanel(v => !v);
    window.addEventListener('gsyen-toggle-team-panel', toggle);
    return () => window.removeEventListener('gsyen-toggle-team-panel', toggle);
  }, []);

  const selectTeam = async (team: TeamItem) => {
    setSelectedTeam(team);
    onTeamChange?.(true);
    setMembers(await loadTeamMembers(team.id));
  };

  const clearTeam = () => {
    setSelectedTeam(null);
    setShowPanel(false);
    setMembers([]);
    onTeamChange?.(false);
  };

  return { selectedTeam, showPanel, members, selectTeam, clearTeam };
}
