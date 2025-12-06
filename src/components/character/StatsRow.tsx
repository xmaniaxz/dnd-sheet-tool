"use client";
import { motion } from "framer-motion";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import NumericInput from "@/components/inputs/NumericInput";
export default function StatsRow() {
  const { data, setByPath } = useCharacter();
  
  const calcInitiative = () => {
    const dexMod = Math.floor((data.abilities.dex - 10) / 2);
    const alertBonus = data.feats?.some(feat => 
      feat.title.toLowerCase().includes('alert')
    ) ? 5 : 0;
    return (data.initiative ?? 0) + dexMod + alertBonus;
  };

  const getInitiativeBreakdown = () => {
    const dexMod = Math.floor((data.abilities.dex - 10) / 2);
    const alertBonus = data.feats?.some(feat => 
      feat.title.toLowerCase().includes('alert')
    ) ? 5 : 0;
    const base = data.initiative ?? 0;
    
    const parts = [];
    if (base !== 0) parts.push(`Base: ${base}`);
    parts.push(`DEX: ${dexMod >= 0 ? '+' : ''}${dexMod}`);
    if (alertBonus > 0) parts.push(`Alert: +${alertBonus}`);
    
    return parts.join(' + ');
  };

  const getPassivePerceptionBreakdown = () => {
    const wisMod = Math.floor((data.abilities.wis - 10) / 2);
    const prof = data.proficiency ?? 0;
    const isProf = !!data.proficiencies?.skills?.perception;
    
    const parts = ['Base: 10'];
    parts.push(`WIS: ${wisMod >= 0 ? '+' : ''}${wisMod}`);
    if (isProf) parts.push(`Prof: +${prof}`);
    
    return parts.join(' + ');
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatShield
          value={data.ac ?? 0}
          label="Armor Class"
          onChange={(v) => setByPath("ac", v)}
        />
        <StatRect
          value={data.proficiency ?? 0}
          label="Proficiency"
        />
        <StatRect
          value={data.passivePerception ?? 0}
          label="Passive perception"
          onChange={(v) => setByPath("passivePerception", v)}
          tooltip={getPassivePerceptionBreakdown()}
        />
      </div>
      
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        <StatRect
          value={data.speed ?? 30}
          label="Speed"
          onChange={(v) => setByPath("speed", v)}
        />
        <StatRect
          value={calcInitiative()}
          label="Initiative"
          tooltip={getInitiativeBreakdown()}
        />
        <StatRect
          value={data.hitDice?.current ?? 0}
          label={`Hit Dice (${data.hitDice?.type ?? "d8"})`}
          onChange={(v) => setByPath("hitDice.current", v)}
        />
        <InspirationToggle />
      </div>
    </div>
  );
}
function StatShield({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange?: (n: number) => void;
}) {
  const { editMode } = useEditMode();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex flex-col items-center justify-center rounded-2xl panel-alt border py-3"
    >
      <div className="relative flex items-center justify-center h-16 w-16 rounded-xl border border-zinc-500/80">
      {editMode && onChange ? (
        <NumericInput
          value={value}
          min={0}
          defaultIfEmpty={0}
          normalize={(n) => Math.max(0, n)}
          onChange={(v) => onChange?.(v)}
          className="w-14 text-center rounded-md  border border-zinc-700 px-2 py-0.5 text-xs  focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      ) : (
        <span className="text-2xl font-semibold">{value}</span>
      )}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-wide  text-center px-2">{label}</div>
    </motion.div>
  );
}
function StatRect({
  value,
  label,
  onChange,
  tooltip,
}: {
  value: number;
  label: string;
  onChange?: (n: number) => void;
  tooltip?: string;
}) {
  const { editMode } = useEditMode();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="flex flex-col items-center justify-center rounded-2xl panel-alt border py-3 group relative"
    >
      {editMode && onChange ? (
        <NumericInput
          value={value}
          defaultIfEmpty={0}
          onChange={(v) => onChange?.(v)}
          className="w-16 text-center rounded-md  border border-zinc-700 px-2 py-0.5 text-xs  focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      ) : (
        <div className="text-2xl font-semibold">{value}</div>
      )}
      <div className="mt-2 text-[11px] uppercase tracking-wide  text-center px-2">{label}</div>
      
      {tooltip && !editMode && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-zinc-700">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900"></div>
        </div>
      )}
    </motion.div>
  );
}

function InspirationToggle() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const hasInspiration = data.inspiration ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex flex-col items-center justify-center rounded-2xl panel-alt border py-3"
    >
      <button
        onClick={() => setByPath("inspiration", !hasInspiration)}
        className={`h-12 w-12 rounded-full border-2 transition-all ${
          hasInspiration
            ? "bg-(--accent) border-(--accent) shadow-lg"
            : "border-zinc-600"
        } ${editMode ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
      >
        {hasInspiration && (
          <span className="text-2xl">✨</span>
        )}
      </button>
      <div className="mt-2 text-[11px] uppercase tracking-wide text-center px-2">
        Inspiration
      </div>
    </motion.div>
  );
}
