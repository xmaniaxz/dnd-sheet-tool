"use client";

import { useState } from "react";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { characterService } from "@/lib/characterService";

/**
 * Migration utility component - can be added temporarily to help migrate existing data
 * Add this to your page, run the migration, then remove it
 */
export function MigrationHelper() {
  const { data, loadCharacter } = useCharacter();
  const [status, setStatus] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");

  const handleMigrate = async () => {
    try {
      setStatus("Migrating localStorage data to Appwrite...");
      
      // Create new document with current data
      const created = await characterService.create(data);
      
      if (created.$id) {
        // Store document ID
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('character-document-id', created.$id);
        }
        setDocumentId(created.$id);
        setStatus(`Success! Document ID: ${created.$id}`);
      } else {
        setStatus("Error: No document ID returned");
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLoadById = async () => {
    if (!documentId.trim()) {
      setStatus("Please enter a document ID");
      return;
    }
    
    try {
      setStatus("Loading character...");
      await loadCharacter(documentId.trim());
      setStatus("Character loaded successfully!");
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-4 max-w-md">
      <h3 className="text-sm font-semibold mb-3 text-white">Migration Helper</h3>
      
      <div className="space-y-3">
        <button
          onClick={handleMigrate}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
        >
          Migrate to Appwrite
        </button>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="Document ID"
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
          />
          <button
            onClick={handleLoadById}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors"
          >
            Load
          </button>
        </div>
        
        {status && (
          <div className="text-xs p-2 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
