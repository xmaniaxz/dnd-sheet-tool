"use client";
import { EditModeProvider } from "@/context/EditModeContext";
import { CharacterSaveFileProvider } from "@/context/CharacterSaveFileContext";
import { TeamProvider } from "@/context/TeamContext";
import { ThemeProvider } from "@/context/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TeamProvider>
        <CharacterSaveFileProvider>
          <EditModeProvider>{children}</EditModeProvider>
        </CharacterSaveFileProvider>
      </TeamProvider>
    </ThemeProvider>
  );
}
