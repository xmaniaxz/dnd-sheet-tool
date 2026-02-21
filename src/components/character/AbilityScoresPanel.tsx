"use client";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import { useState } from "react";
import NumericInput from "@/components/inputs/NumericInput";
import { motion, AnimatePresence } from "framer-motion";
import type { SkillProficiencies, CharacterData } from "@/context/CharacterSaveFileContext";

export default function AbilityScoresPanel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const [expanded, setExpanded] = useState<Set<AbilityKey>>(new Set());

  const entries: Array<{ key: keyof typeof data.abilities; label: string }> = [
    { key: "str", label: "Strength" },
    { key: "dex", label: "Dexterity" },
    { key: "con", label: "Constitution" },
    { key: "int", label: "Intelligence" },
    { key: "wis", label: "Wisdom" },
    { key: "cha", label: "Charisma" },
  ];

  const allAbilityKeys = entries.map(({ key }) => key as AbilityKey);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-semibold">Ability Scores</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(new Set())}
            className="text-xs px-2 py-1 rounded-md panel-subtle border hover:border-(--accent)/50 transition-all duration-200"
          >
            Collapse all
          </button>
          <button
            type="button"
            onClick={() => setExpanded(new Set(allAbilityKeys))}
            className="text-xs px-2 py-1 rounded-md panel-subtle border hover:border-(--accent)/50 transition-all duration-200"
          >
            Uncollapse all
          </button>
        </div>
      </div>

      {/* outer flex just centers the grid if itâ€™s narrower than the panel */}
      <div className="flex justify-evenly items-center">
        {/* responsive grid that fills width */}
        <div className="grid w-full max-w-6xl gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {entries.map(({ key, label }) => {
            const isOpen = expanded.has(key as AbilityKey);
            const skills = skillsByAbility[key as keyof typeof skillsByAbility];
            return (
              <motion.div
                key={key}
                className="rounded-2xl panel-subtle border px-3 py-2 flex flex-col gap-2"
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  {editMode ? (
                    <NumericInput
                      value={data.abilities[key]}
                      onChange={(v) => setByPath(`abilities.${key}`, v)}
                      defaultIfEmpty={0}
                      className="w-full rounded-md  border border-zinc-700 px-2 py-1 text-center text-lg sm:text-xl  focus:outline-none focus:ring-1 focus:ring-(--accent)"
                    />
                  ) : (
                    <div className="group relative">
                      <div className="lg:text-5xl md:text-4xl sm:text-2xl font-semibold text-center">
                        {data.abilities[key]}
                      </div>
                      <div className="lg:text-xl md:text-lg sm:text-xl text-center">
                        {modifier(data.abilities[key])}
                      </div>
                      
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-zinc-700">
                        ({data.abilities[key]} - 10) ÷ 2 = {modifier(data.abilities[key])}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900"></div>
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-wide  text-center">
                    {label}
                  </div>
                </div>

                {/* Expand controls */}
                <button
                  type="button"
                  onClick={() => {
                    const abilityKey = key as AbilityKey;
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(abilityKey)) {
                        next.delete(abilityKey);
                      } else {
                        next.add(abilityKey);
                      }
                      return next;
                    });
                  }}
                  className="self-center cursor-pointer inline-flex items-center gap-1 text-[11px]  hover:text-white transition-colors"
                >
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block"
                    aria-hidden
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </motion.span>
                  Proficiencies
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-1 space-y-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between group relative">
                        <h4 className="text-[11px] uppercase tracking-wide ">Saving Throw</h4>
                        <span className="text-xs ">
                          {formatMod(modifier(data.abilities[key]) + (data.proficiencies.saves[key] ? (data.proficiency ?? 0) : 0))}
                        </span>
                        
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-zinc-700">
                          {label.slice(0, 3).toUpperCase()}: {formatMod(modifier(data.abilities[key]))}
                          {data.proficiencies.saves[key] && ` + Prof: +${data.proficiency ?? 0}`}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900"></div>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs ">
                        <input
                          type="checkbox"
                          disabled={!editMode}
                          checked={!!data.proficiencies.saves[key]}
                          onChange={(e) => setByPath(`proficiencies.saves.${key}`, e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-600 "
                        />
                        <span>Proficient</span>
                      </label>

                      {skills.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[11px] uppercase tracking-wide ">Skills</h4>
                          <div className="grid grid-cols-1 gap-1">
                            {skills.map(([skillKey, skillLabel]) => {
                              const base = modifier(data.abilities[key]);
                              const prof = data.proficiency ?? 0;
                              const isProf = !!data.proficiencies.skills[skillKey];
                              const isExpert = !!data.proficiencies.expertise?.[skillKey];
                              const total = base + (isProf ? (isExpert ? 2 * prof : prof) : 0);
                              return (
                                <div key={skillKey} className="flex items-center justify-between gap-2 group relative min-w-0">
                                  <label className="flex items-center gap-2 text-xs min-w-0 flex-1" title={skillLabel}>
                                    <input
                                      type="checkbox"
                                      disabled={!editMode}
                                      checked={isProf}
                                      onChange={(e) => setByPath(`proficiencies.skills.${skillKey}`, e.target.checked)}
                                      className="h-4 w-4 rounded border-zinc-600 "
                                    />
                                    <span className="truncate" title={skillLabel}>{skillLabel}</span>
                                  </label>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      disabled={!editMode || !isProf}
                                      onClick={() => setByPath(`proficiencies.expertise.${skillKey}`, !isExpert)}
                                      className={`px-1.5 py-0.5 text-[10px] rounded border ${isExpert ? "accent-soft" : " border-zinc-700 "} disabled:opacity-40`}
                                      title="Toggle expertise (double proficiency)"
                                    >
                                      x2
                                    </button>
                                    <span className="w-10 text-right text-xs font-mono tabular-nums">{formatMod(total)}</span>
                                  </div>
                                  
                                  <div className="absolute bottom-full mb-2 right-0 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-zinc-700">
                                    <div>{skillLabel}</div>
                                    {label.slice(0, 3).toUpperCase()}: {formatMod(base)}
                                    {isProf && (isExpert ? ` + Prof×2: +${2 * prof}` : ` + Prof: +${prof}`)}
                                    <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-zinc-900"></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function modifier(score: number) {
  return Math.floor((score - 10) / 2);
} 

function formatMod(n: number) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// Mapping of ability -> related skills (key, label)
type AbilityKey = keyof CharacterData["abilities"];
const skillsByAbility: Record<AbilityKey, Array<[keyof SkillProficiencies, string]>> = {
  str: [["athletics", "Athletics"]],
  dex: [
    ["acrobatics", "Acrobatics"],
    ["sleightOfHand", "Sleight of Hand"],
    ["stealth", "Stealth"],
  ],
  con: [],
  int: [
    ["arcana", "Arcana"],
    ["history", "History"],
    ["investigation", "Investigation"],
    ["nature", "Nature"],
    ["religion", "Religion"],
  ],
  wis: [
    ["animalHandling", "Animal Handling"],
    ["insight", "Insight"],
    ["medicine", "Medicine"],
    ["perception", "Perception"],
    ["survival", "Survival"],
  ],
  cha: [
    ["deception", "Deception"],
    ["intimidation", "Intimidation"],
    ["performance", "Performance"],
    ["persuasion", "Persuasion"],
  ],
};

function ChevronDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.354a.75.75 0 111.02 1.1l-4.22 3.815a.75.75 0 01-1.02 0L5.25 8.29a.75.75 0 01-.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}



