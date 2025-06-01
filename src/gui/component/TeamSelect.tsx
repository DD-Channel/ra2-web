import React from 'react';
import { Select } from './Select';
import { Option } from './Option';
import { NO_TEAM_ID } from '@/game/gameopts/constants';

const formatTeamId = (id: number): string => 
  String.fromCharCode('A'.charCodeAt(0) + id);

interface TeamSelectProps {
  teamId: number;
  required?: boolean;
  disabled?: boolean;
  maxTeams: number;
  onSelect?: (teamId: number) => void;
  strings: {
    get: (key: string, ...args: any[]) => string;
  };
}

export const TeamSelect: React.FC<TeamSelectProps> = ({
  teamId,
  required,
  disabled,
  maxTeams,
  onSelect,
  strings,
}) => {
  const teams = new Array(maxTeams).fill(0).map((_, index) => index);

  return (
    <Select
      className="player-team-select"
      initialValue={String(teamId)}
      disabled={disabled}
      tooltip={strings.get("STT:HostComboTeam")}
      onSelect={(value) => {
        onSelect?.(Number(value));
      }}
    >
      {!required && (
        <Option
          value={String(NO_TEAM_ID)}
          label={strings.get("GUI:NoneAsSymbols")}
        />
      )}
      {teams.map((team) => (
        <Option
          key={team}
          value={String(team)}
          label={formatTeamId(team)}
        />
      ))}
    </Select>
  );
};