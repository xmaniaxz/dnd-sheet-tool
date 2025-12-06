"use client";
import { EditModeProvider } from "@/context/EditModeContext";
import { CharacterSaveFileProvider } from "@/context/CharacterSaveFileContext";
import { TeamProvider } from "@/context/TeamContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TeamProvider>
      <CharacterSaveFileProvider>
        <EditModeProvider>{children}</EditModeProvider>
      </CharacterSaveFileProvider>
    </TeamProvider>
  );
}
