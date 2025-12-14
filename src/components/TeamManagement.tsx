"use client";
import { useState, useEffect, useCallback } from 'react';
import { useTeam } from '@/context/TeamContext';
import { characterService } from '@/lib/characterService';
import type { CharacterDocument } from '@/lib/characterService';

export function CharacterList() {
  const { teamId } = useTeam();
  const [characters, setCharacters] = useState<CharacterDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCharacters = useCallback(async () => {
    setLoading(true);
    try {
      const chars = await characterService.list({ teamId: teamId || undefined });
      setCharacters(chars);
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  if (loading) {
    return <div className="p-4">Loading characters...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        {teamId ? 'Team Characters' : 'Personal Characters'}
      </h2>
      <div className="space-y-2">
        {characters.length === 0 ? (
          <p className="text-gray-500">No characters found</p>
        ) : (
          characters.map((char) => (
            <div
              key={char.$id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <h3 className="font-semibold">{char.name}</h3>
              <p className="text-sm text-gray-600">
                Level {char.level} - {char.identity?.class || 'Unknown Class'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {new Date(char.$updatedAt || '').toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TeamSelector() {
  const { teamId, setTeamId } = useTeam();
  const [customTeamId, setCustomTeamId] = useState('');

  const handleSetTeam = () => {
    if (customTeamId.trim()) {
      setTeamId(customTeamId.trim());
      setCustomTeamId('');
    }
  };

  const handleClearTeam = () => {
    setTeamId(null);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Team Context</h3>
      
      {teamId ? (
        <div className="space-y-2">
          <p className="text-sm">
            Current Team: <span className="font-mono text-blue-600">{teamId}</span>
          </p>
          <button
            onClick={handleClearTeam}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            Switch to Personal
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Working with personal characters</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTeamId}
              onChange={(e) => setCustomTeamId(e.target.value)}
              placeholder="Enter Team ID"
              className="flex-1 px-3 py-1 text-sm border rounded"
            />
            <button
              onClick={handleSetTeam}
              disabled={!customTeamId.trim()}
              className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded disabled:opacity-50"
            >
              Join Team
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
