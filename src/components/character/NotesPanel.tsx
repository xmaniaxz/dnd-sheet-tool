"use client";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import AutoResizeTextarea from "@/components/inputs/AutoResizeTextarea";

export default function NotesPanel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  return (
    <div className="space-y-2">
      <h2 className="text-lg sm:text-xl font-semibold">Notes</h2>
      {editMode ? (
        <AutoResizeTextarea
          value={data.notes ?? ""}
          onChange={(e) => setByPath("notes", (e.target as HTMLTextAreaElement).value)}
          minRows={6}
          placeholder="Write your character notes here..."
        />
      ) : (
        <p className="text-sm  whitespace-pre-wrap">{data.notes || ""}</p>
      )}
    </div>
  );
}
