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
  const sourceLinks = identity.sourceLinks || {};

  const normalizeLink = (link: string) =>
    /^https?:\/\//i.test(link) ? link : `https://${link}`;

  const setIdentitySourceLink = (field: "race" | "class" | "subClass", label: string) => {
    const currentValue = sourceLinks[field] || "";
    const nextValue = window.prompt(
      `Set source link for ${label}`,
      currentValue,
    );
    if (nextValue === null) return;
    const trimmed = nextValue.trim();
    setByPath(`identity.sourceLinks.${field}`, trimmed || undefined);
  };

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
          <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm max-w-full">
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                placeholder="Race"
                value={identity.race}
                onChange={(e) => setByPath("identity.race", e.target.value)}
                className="input w-20 sm:w-24 text-xs sm:text-sm px-2 py-1"
              />
              <button
                type="button"
                onClick={() => setIdentitySourceLink("race", "Race")}
                className="text-[10px] px-1.5 py-1 rounded border border-(--border) hover:opacity-80"
                title="Set race source link"
              >
                🔗
              </button>
            </div>
            <div className="inline-flex items-center gap-1">
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
                {!!identity.class &&
                  !ALL_CLASSES.includes(
                    identity.class as (typeof ALL_CLASSES)[number],
                  ) && <option value={identity.class}>{identity.class}</option>}
              </select>
              <button
                type="button"
                onClick={() => setIdentitySourceLink("class", "Class")}
                className="text-[10px] px-1.5 py-1 rounded border border-(--border) hover:opacity-80"
                title="Set class source link"
              >
                🔗
              </button>
            </div>
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                placeholder="Subclass"
                value={identity.subClass}
                onChange={(e) => setByPath("identity.subClass", e.target.value)}
                className="input w-20 sm:w-24 text-xs sm:text-sm px-2 py-1"
              />
              <button
                type="button"
                onClick={() => setIdentitySourceLink("subClass", "Subclass")}
                className="text-[10px] px-1.5 py-1 rounded border border-(--border) hover:opacity-80"
                title="Set subclass source link"
              >
                🔗
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1">
            {identity.race || identity.class || identity.subClass ? (
              <div className="text-xs sm:text-sm flex flex-wrap items-center gap-1">
                {identity.race && (
                  <>
                    <span>{identity.race}</span>
                    {sourceLinks.race && (
                      <a
                        href={normalizeLink(sourceLinks.race)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-1 py-0.5 rounded border border-(--border) hover:opacity-80"
                        title="Open race source"
                      >
                        ↗
                      </a>
                    )}
                  </>
                )}

                {identity.race && (identity.class || identity.subClass) && (
                  <span className="text-zinc-500">|</span>
                )}

                {identity.class && (
                  <>
                    <span>{identity.class}</span>
                    {sourceLinks.class && (
                      <a
                        href={normalizeLink(sourceLinks.class)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-1 py-0.5 rounded border border-(--border) hover:opacity-80"
                        title="Open class source"
                      >
                        ↗
                      </a>
                    )}
                  </>
                )}

                {identity.class && identity.subClass && (
                  <span className="text-zinc-500">|</span>
                )}

                {identity.subClass && (
                  <>
                    <span>{identity.subClass}</span>
                    {sourceLinks.subClass && (
                      <a
                        href={normalizeLink(sourceLinks.subClass)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-1 py-0.5 rounded border border-(--border) hover:opacity-80"
                        title="Open class source"
                      >
                        ↗
                      </a>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm">Race | Class | Subclass</p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl /90 px-3 py-2 text-right">
        <div className="text-[10px] uppercase tracking-wide ">Level</div>
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
