"use client";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";

export default function CharacterInfoPanel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  
  return (
    <div className="space-y-3">
      <h2 className="text-lg sm:text-xl font-semibold">Character Info</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Player Name">
          {editMode ? (
            <Input
              value={data.identity.playerName}
              onChange={(v) => setByPath("identity.playerName", v)}
            />
          ) : (
            <Read>{data.identity.playerName}</Read>
          )}
        </Field>
        
        <Field label="Character Name">
          {editMode ? (
            <Input
              value={data.identity.characterName}
              onChange={(v) => setByPath("identity.characterName", v)}
            />
          ) : (
            <Read>{data.identity.characterName}</Read>
          )}
        </Field>
        
        <Field label="Race">
          {editMode ? (
            <Input
              value={data.identity.race}
              onChange={(v) => setByPath("identity.race", v)}
            />
          ) : (
            <Read>{data.identity.race}</Read>
          )}
        </Field>
        
        <Field label="Class">
          {editMode ? (
            <Input
              value={data.identity.class}
              onChange={(v) => setByPath("identity.class", v)}
            />
          ) : (
            <Read>{data.identity.class}</Read>
          )}
        </Field>
        
        <Field label="Subclass">
          {editMode ? (
            <Input
              value={data.identity.subClass}
              onChange={(v) => setByPath("identity.subClass", v)}
            />
          ) : (
            <Read>{data.identity.subClass}</Read>
          )}
        </Field>
        
        <Field label="Background">
          {editMode ? (
            <Input
              value={data.identity.background}
              onChange={(v) => setByPath("identity.background", v)}
            />
          ) : (
            <Read>{data.identity.background}</Read>
          )}
        </Field>
        
        <Field label="Alignment">
          {editMode ? (
            <Input
              value={data.identity.alignment}
              onChange={(v) => setByPath("identity.alignment", v)}
            />
          ) : (
            <Read>{data.identity.alignment}</Read>
          )}
        </Field>
        
        <Field label="Experience">
          {editMode ? (
            <Input
              value={data.identity.experience}
              onChange={(v) => setByPath("identity.experience", v)}
            />
          ) : (
            <Read>{data.identity.experience}</Read>
          )}
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 rounded-xl panel-subtle border px-3 py-2">
      <span className="text-[10px] uppercase tracking-wide opacity-60">{label}</span>
      {children}
    </label>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-zinc-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
    />
  );
}

function Read({ children }: { children: React.ReactNode }) {
  return <span className="text-sm min-h-6">{children || "-"}</span>;
}
