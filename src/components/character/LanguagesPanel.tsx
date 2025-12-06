"use client";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";

export default function LanguagesPanel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  return (
    <div className="space-y-2">
      <h2 className="text-lg sm:text-xl font-semibold">Languages</h2>
      {editMode ? (
        <input
          type="text"
          value={data.languages ?? ""}
          onChange={(e) => setByPath("languages", e.target.value)}
          placeholder="Common, Primordial"
      className="w-full rounded-md  border border-zinc-700 px-3 py-2 text-sm  focus:outline-none focus:ring-1 focus:ring-(--accent)"
        />
      ) : (
        <p className="text-sm ">{data.languages || ""}</p>
      )}
    </div>
  );
}
