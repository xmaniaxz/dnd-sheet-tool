"use client";
import { memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import NumericInput from "@/components/inputs/NumericInput";
export default function StatsRow() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();

  const dexMod = useMemo(() => Math.floor((data.abilities.dex - 10) / 2), [data.abilities.dex]);
  const wisMod = useMemo(() => Math.floor((data.abilities.wis - 10) / 2), [data.abilities.wis]);
  const hasAlert = useMemo(
    () => !!data.feats?.some((feat) => feat.title.toLowerCase().includes("alert")),
    [data.feats],
  );
  const alertBonus = hasAlert ? 5 : 0;
  const autoInitiative = dexMod + alertBonus;
  const hasInitiativeOverride = typeof data.initiative === "number";
  const effectiveInitiative = hasInitiativeOverride ? (data.initiative ?? autoInitiative) : autoInitiative;

  const perceptionProficiency = data.proficiency ?? 0;
  const isPerceptionProficient = !!data.proficiencies?.skills?.perception;
  const passivePerception = 10 + wisMod + (isPerceptionProficient ? perceptionProficiency : 0);

  const initiativeBreakdown = useMemo(() => {
    const parts: string[] = [];
    parts.push(`DEX: ${dexMod >= 0 ? '+' : ''}${dexMod}`);
    if (alertBonus > 0) parts.push(`Alert: +${alertBonus}`);
    parts.push(`= ${autoInitiative >= 0 ? '+' : ''}${autoInitiative}`);
    if (hasInitiativeOverride) {
      parts.push(`(Override: ${effectiveInitiative >= 0 ? '+' : ''}${effectiveInitiative})`);
    }

    return parts.join(' + ');
  }, [dexMod, alertBonus, autoInitiative, hasInitiativeOverride, effectiveInitiative]);

  const passivePerceptionBreakdown = useMemo(() => {
    const parts = ['Base: 10'];
    parts.push(`WIS: ${wisMod >= 0 ? '+' : ''}${wisMod}`);
    if (isPerceptionProficient) parts.push(`Prof: +${perceptionProficiency}`);
    parts.push(`= ${passivePerception}`);

    return parts.join(' + ');
  }, [wisMod, isPerceptionProficient, perceptionProficiency, passivePerception]);

  const handleAcChange = useCallback((v: number) => setByPath("ac", v), [setByPath]);
  const handleSpeedChange = useCallback((v: number) => setByPath("speed", v), [setByPath]);
  const handleInitiativeChange = useCallback((v: number) => setByPath("initiative", v), [setByPath]);
  const handleResetInitiative = useCallback(() => setByPath("initiative", undefined), [setByPath]);
  const handleHitDiceChange = useCallback((v: number) => setByPath("hitDice.current", v), [setByPath]);
  const handleInspirationToggle = useCallback(
    () => setByPath("inspiration", !(data.inspiration ?? false)),
    [setByPath, data.inspiration],
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatShield
          value={data.ac ?? 0}
          label="Armor Class"
          onChange={handleAcChange}
        />
        <StatRect
          value={data.proficiency ?? 0}
          label="Proficiency"
        />
        <StatRect
          value={passivePerception}
          label="Passive perception"
          tooltip={passivePerceptionBreakdown}
        />
      </div>
      
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        <StatRect
          value={data.speed ?? 30}
          label="Speed"
          onChange={handleSpeedChange}
        />
        <StatRect
          value={effectiveInitiative}
          label="Initiative"
          onChange={handleInitiativeChange}
          tooltip={initiativeBreakdown}
          onReset={hasInitiativeOverride ? handleResetInitiative : undefined}
        />
        <StatRect
          value={data.hitDice?.current ?? 0}
          label={`Hit Dice (${data.hitDice?.type ?? "d8"})`}
          onChange={handleHitDiceChange}
        />
        <InspirationToggle
          hasInspiration={data.inspiration ?? false}
          editMode={editMode}
          onToggle={handleInspirationToggle}
        />
      </div>
    </div>
  );
}
const StatShield = memo(function StatShield({
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
          className="w-16 h-8 text-center rounded-lg border border-zinc-700 px-2 text-sm leading-none focus:outline-none focus:ring-1 focus:ring-(--accent)"
        />
      ) : (
        <span className="text-2xl font-semibold">{value}</span>
      )}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-wide  text-center px-2">{label}</div>
    </motion.div>
  );
});

const StatRect = memo(function StatRect({
  value,
  label,
  onChange,
  tooltip,
  onReset,
}: {
  value: number;
  label: string;
  onChange?: (n: number) => void;
  tooltip?: string;
  onReset?: () => void;
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
          className="w-16 h-8 text-center rounded-lg border border-zinc-700 px-2 text-sm leading-none focus:outline-none focus:ring-1 focus:ring-(--accent)"
        />
      ) : (
        <div className="text-2xl font-semibold">{value}</div>
      )}
      <div className="mt-2 text-[11px] uppercase tracking-wide  text-center px-2">{label}</div>

      {editMode && onReset && (
        <button
          onClick={onReset}
          className="absolute top-1.5 right-1.5 h-5 min-w-5 px-1.5 rounded-md border border-white/20 hover:border-(--accent)/60 hover:text-(--accent) transition text-[10px] leading-none"
          title="Reset to auto-calculated value"
          aria-label="Reset to auto-calculated value"
        >
          ↺
        </button>
      )}
      
      {tooltip && !editMode && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-zinc-700">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900"></div>
        </div>
      )}
    </motion.div>
  );
});

const InspirationToggle = memo(function InspirationToggle({
  hasInspiration,
  editMode,
  onToggle,
}: {
  hasInspiration: boolean;
  editMode: boolean;
  onToggle: () => void;
}) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex flex-col items-center justify-center rounded-2xl panel-alt border py-3"
    >
      <button
        onClick={onToggle}
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
});
