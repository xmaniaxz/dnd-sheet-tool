"use client";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";

export default function NotesPanel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  return (
    <div className="space-y-2">
      <h2 className="text-lg sm:text-xl font-semibold">Notes</h2>
      {editMode ? (
        <textarea
          value={data.notes ?? ""}
          onChange={(e) => setByPath("notes", e.target.value)}
          rows={6}
          placeholder="Write your character notes here..."
      className="w-full rounded-md  border border-zinc-700 px-3 py-2 text-sm  focus:outline-none focus:ring-1 focus:ring-[--accent]"
        />
      ) : (
        <p className="text-sm  whitespace-pre-wrap">{data.notes || ""}</p>
      )}
    </div>
  );
}
