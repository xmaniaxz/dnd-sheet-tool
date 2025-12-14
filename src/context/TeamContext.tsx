"use client";
import { createContext, useContext, useState, type ReactNode } from 'react';
import { setCurrentTeamId as setTeamIdInStorage } from '@/lib/characterService';

type TeamContextValue = {
  teamId: string | null;
  setTeamId: (teamId: string | null) => void;
};

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [teamId, setTeamIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('current-team-id');
    }
    return null;
  });

  const setTeamId = (newTeamId: string | null) => {
    setTeamIdState(newTeamId);
    setTeamIdInStorage(newTeamId);
  };

  return (
    <TeamContext.Provider value={{ teamId, setTeamId }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error('useTeam must be used within TeamProvider');
  }
  return ctx;
}
