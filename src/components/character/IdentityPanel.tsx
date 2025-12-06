"use client";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";

export default function IdentityPanel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  
  return (
    <div className="space-y-3">
      <h2 className="text-lg sm:text-xl font-semibold">Roleplay & Identity</h2>
      
      {/* Physical Appearance */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold opacity-70">Physical Appearance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Age">
            {editMode ? (
              <Input
                value={data.identity.age || ""}
                onChange={(v) => setByPath("identity.age", v)}
              />
            ) : (
              <Read>{data.identity.age}</Read>
            )}
          </Field>
          <Field label="Height">
            {editMode ? (
              <Input
                value={data.identity.height || ""}
                onChange={(v) => setByPath("identity.height", v)}
              />
            ) : (
              <Read>{data.identity.height}</Read>
            )}
          </Field>
          <Field label="Weight">
            {editMode ? (
              <Input
                value={data.identity.weight || ""}
                onChange={(v) => setByPath("identity.weight", v)}
              />
            ) : (
              <Read>{data.identity.weight}</Read>
            )}
          </Field>
          <Field label="Eyes">
            {editMode ? (
              <Input
                value={data.identity.eyes || ""}
                onChange={(v) => setByPath("identity.eyes", v)}
              />
            ) : (
              <Read>{data.identity.eyes}</Read>
            )}
          </Field>
          <Field label="Skin">
            {editMode ? (
              <Input
                value={data.identity.skin || ""}
                onChange={(v) => setByPath("identity.skin", v)}
              />
            ) : (
              <Read>{data.identity.skin}</Read>
            )}
          </Field>
          <Field label="Hair">
            {editMode ? (
              <Input
                value={data.identity.hair || ""}
                onChange={(v) => setByPath("identity.hair", v)}
              />
            ) : (
              <Read>{data.identity.hair}</Read>
            )}
          </Field>
        </div>
      </div>
      
      {/* Appearance Description */}
      <Field label="Appearance">
        {editMode ? (
          <TextArea
            value={data.identity.appearance || ""}
            onChange={(v) => setByPath("identity.appearance", v)}
            rows={2}
            placeholder="Describe your character's appearance..."
          />
        ) : (
          <ReadMultiline>{data.identity.appearance}</ReadMultiline>
        )}
      </Field>
      
      {/* Personality */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold opacity-70">Personality</h3>
        <Field label="Personality Traits">
          {editMode ? (
            <TextArea
              value={data.identity.personalityTraits || ""}
              onChange={(v) => setByPath("identity.personalityTraits", v)}
              rows={2}
              placeholder="Describe your character's personality..."
            />
          ) : (
            <ReadMultiline>{data.identity.personalityTraits}</ReadMultiline>
          )}
        </Field>
        
        <Field label="Ideals">
          {editMode ? (
            <TextArea
              value={data.identity.ideals || ""}
              onChange={(v) => setByPath("identity.ideals", v)}
              rows={2}
              placeholder="What does your character believe in?"
            />
          ) : (
            <ReadMultiline>{data.identity.ideals}</ReadMultiline>
          )}
        </Field>
        
        <Field label="Bonds">
          {editMode ? (
            <TextArea
              value={data.identity.bonds || ""}
              onChange={(v) => setByPath("identity.bonds", v)}
              rows={2}
              placeholder="What connections does your character have?"
            />
          ) : (
            <ReadMultiline>{data.identity.bonds}</ReadMultiline>
          )}
        </Field>
        
        <Field label="Flaws">
          {editMode ? (
            <TextArea
              value={data.identity.flaws || ""}
              onChange={(v) => setByPath("identity.flaws", v)}
              rows={2}
              placeholder="What are your character's weaknesses?"
            />
          ) : (
            <ReadMultiline>{data.identity.flaws}</ReadMultiline>
          )}
        </Field>
      </div>
      
      {/* Backstory & Allies */}
      <Field label="Backstory">
        {editMode ? (
          <TextArea
            value={data.identity.backstory || ""}
            onChange={(v) => setByPath("identity.backstory", v)}
            rows={4}
            placeholder="Tell your character's story..."
          />
        ) : (
          <ReadMultiline>{data.identity.backstory}</ReadMultiline>
        )}
      </Field>
      
      <Field label="Allies & Organizations">
        {editMode ? (
          <TextArea
            value={data.identity.allies || ""}
            onChange={(v) => setByPath("identity.allies", v)}
            rows={2}
            placeholder="Who are your character's allies?"
          />
        ) : (
          <ReadMultiline>{data.identity.allies}</ReadMultiline>
        )}
      </Field>
      
      {/* Languages */}
      <Field label="Languages">
        {editMode ? (
          <TextArea
            value={data.languages || ""}
            onChange={(v) => setByPath("languages", v)}
            rows={2}
            placeholder="Common, Elvish, Draconic..."
          />
        ) : (
          <ReadMultiline>{data.languages}</ReadMultiline>
        )}
      </Field>
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

function TextArea({ value, onChange, rows = 3, placeholder = "" }: { 
  value: string; 
  onChange: (v: string) => void; 
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-md border border-zinc-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
    />
  );
}

function Read({ children }: { children: React.ReactNode }) {
  return <span className="text-sm min-h-6">{children || "-"}</span>;
}

function ReadMultiline({ children }: { children: React.ReactNode }) {
  return <p className="text-sm min-h-6 whitespace-pre-wrap">{children || "-"}</p>;
}

