"use client";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import NumericInput from "@/components/inputs/NumericInput";

const ALL_CLASSES = [
  "Artificer",
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
] as const;

export default function NameLevel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const identity = data.identity;
  const identityDisplay =
    [identity.race, identity.class, identity.subClass]
      .filter(Boolean)
      .join(" | ") || "Race | Class | Subclass";

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        {editMode ? (
          <input
            type="text"
            value={data.name}
            onChange={(e) => setByPath("name", e.target.value)}
            className="text-xl sm:text-2xl font-semibold leading-tight input w-full max-w-md"
          />
        ) : (
          <h1 className="text-xl sm:text-2xl font-semibold leading-tight">
            {data.name}
          </h1>
        )}
        {editMode ? (
          <div className="mt-1 grid grid-flow-col auto-cols-max items-center gap-1 sm:gap-2 text-xs sm:text-sm ">
            <input
              type="text"
              placeholder="Race"
              value={identity.race}
              onChange={(e) => setByPath("identity.race", e.target.value)}
              className="input w-20 sm:w-24 text-xs sm:text-sm px-2 py-1"
            />
            <span className="mx-1 leading-none text-zinc-500">|</span>
            <select
              value={identity.class}
              onChange={(e) => setByPath("identity.class", e.target.value)}
              className="w-24 sm:w-28 panel-subtle border rounded-md appearance-auto text-xs sm:text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-(--accent)"
            >
              <option value="">Class</option>
              {ALL_CLASSES.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
              {!!identity.class && !ALL_CLASSES.includes(identity.class as (typeof ALL_CLASSES)[number]) && (
                <option value={identity.class}>{identity.class}</option>
              )}
            </select>
            <span className="mx-1 leading-none text-zinc-500">|</span>
            <input
              type="text"
              placeholder="Subclass"
              value={identity.subClass}
              onChange={(e) => setByPath("identity.subClass", e.target.value)}
              className="input w-20 sm:w-24 text-xs sm:text-sm px-2 py-1"
            />
          </div>
        ) : (
          <p className="mt-1 text-xs sm:text-sm ">
            {identityDisplay}
          </p>
        )}
      </div>

      <div className="rounded-xl /90 px-3 py-2 text-right">
        <div className="text-[10px] uppercase tracking-wide ">
          Level
        </div>
        {editMode ? (
          <NumericInput
            value={data.level}
            min={1}
            defaultIfEmpty={1}
            normalize={(n) => Math.max(1, n)}
            onChange={(val) => setByPath("level", val)}
            className="w-12 text-center font-semibold input text-base px-1 py-1"
          />
        ) : (
          <div className="text-lg text-center font-semibold">{data.level}</div>
        )}
      </div>
    </div>
  );
}
