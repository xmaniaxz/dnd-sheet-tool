import {
  abilityLabel,
  formatSigned,
  type AbilityKey,
  type SpellSlots,
} from "@/components/character/spells/spellUtils";

type SpellcastingStats = {
  ability: AbilityKey;
  abilityMod: number;
  proficiency: number;
  autoSpellSaveDC: number;
  autoSpellAttackModifier: number;
  spellSaveDC: number;
  spellAttackModifier: number;
  hasSpellSaveOverride: boolean;
  hasSpellAttackOverride: boolean;
};

type Props = {
  editMode: boolean;
  spellSlotsDirty: boolean;
  spellSlots: SpellSlots;
  editingSlots: number | null;
  spellcastingStats: SpellcastingStats;
  onResetSlots: () => void;
  onLongRest: () => void;
  onSetEditingSlots: (level: number | null) => void;
  onUpdateSpellSlot: (level: number, field: "current" | "max", value: number) => void;
  onSpendSpellSlot: (level: number) => void;
  onRestoreSpellSlot: (level: number) => void;
  onResetSpellSaveDC: () => void;
  onResetSpellAttackBonus: () => void;
};

export default function SpellSlotsPanel({
  editMode,
  spellSlotsDirty,
  spellSlots,
  editingSlots,
  spellcastingStats,
  onResetSlots,
  onLongRest,
  onSetEditingSlots,
  onUpdateSpellSlot,
  onSpendSpellSlot,
  onRestoreSpellSlot,
  onResetSpellSaveDC,
  onResetSpellAttackBonus,
}: Props) {
  return (
    <div className="panel-subtle border rounded-xl p-4 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Spell Slots</h3>
        <div className="flex gap-2">
          {editMode && (
            <button
              onClick={onResetSlots}
              disabled={!spellSlotsDirty}
              className={`text-xs px-3 py-1 rounded-lg transition ${
                spellSlotsDirty
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              }`}
              title={
                spellSlotsDirty
                  ? "Reset spell slots to class defaults"
                  : "Spell slots match class defaults"
              }
            >
              Reset to Default
            </button>
          )}
          <button
            onClick={onLongRest}
            className="text-xs px-3 py-1 bg-(--accent) text-(--accent-contrast) rounded-lg hover:opacity-90 transition"
          >
            Long Rest
          </button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
            const slot = spellSlots[level as keyof SpellSlots];
            const hasSlots = slot && slot.max > 0;

            return (
              <div
                key={level}
                className={`flex flex-col gap-1 ${!hasSlots ? "opacity-40" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium opacity-70">Level {level}</span>
                  {editMode &&
                    (editingSlots === level ? (
                      <button
                        onClick={() => onSetEditingSlots(null)}
                        className="text-xs text-(--accent)"
                      >
                        Done
                      </button>
                    ) : (
                      <button
                        onClick={() => onSetEditingSlots(level)}
                        className="text-xs opacity-50 hover:opacity-100"
                        title="Edit max slots"
                      >
                        ✎
                      </button>
                    ))}
                </div>

                {editMode && editingSlots === level ? (
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      min="0"
                      max="9"
                      value={slot?.max || 0}
                      onChange={(e) =>
                        onUpdateSpellSlot(level, "max", parseInt(e.target.value) || 0)
                      }
                      className="w-12 px-2 py-1 text-xs border rounded input"
                    />
                    <span className="text-xs opacity-70">max</span>
                  </div>
                ) : hasSlots ? (
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: slot.max }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (i < slot.current) {
                            onSpendSpellSlot(level);
                          } else {
                            onRestoreSpellSlot(level);
                          }
                        }}
                        className={`w-6 h-6 rounded border-2 transition-all ${
                          i < slot.current
                            ? "bg-(--accent) border-(--accent) hover:opacity-70"
                            : "border-white/30 hover:border-(--accent)"
                        }`}
                        title={i < slot.current ? "Click to use" : "Click to restore"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    <div className="w-6 h-6 rounded border-2 border-white/10 bg-white/5" />
                  </div>
                )}

                <span className="text-xs opacity-60">{slot ? `${slot.current}/${slot.max}` : "0/0"}</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
          <div className="panel-subtle border rounded-lg p-3">
            <p className="text-xs opacity-60">Spellcasting Ability</p>
            <p className="font-semibold">
              {abilityLabel(spellcastingStats.ability)} ({formatSigned(spellcastingStats.abilityMod)})
            </p>
          </div>
          <div className="panel-subtle border rounded-lg p-3 group relative">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs opacity-60">Spell Save DC</p>
              {editMode && spellcastingStats.hasSpellSaveOverride && (
                <button
                  onClick={onResetSpellSaveDC}
                  className="text-[10px] px-2 py-0.5 rounded border border-white/20 hover:border-(--accent)/60 transition"
                  title="Reset to auto-calculated value"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="font-semibold">{spellcastingStats.spellSaveDC}</p>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-zinc-700">
              8 + Prof ({spellcastingStats.proficiency}) + {abilityLabel(spellcastingStats.ability)} ({formatSigned(spellcastingStats.abilityMod)}) = {spellcastingStats.autoSpellSaveDC}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900"></div>
            </div>
          </div>
          <div className="panel-subtle border rounded-lg p-3 group relative">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs opacity-60">Spell Attack Modifier</p>
              {editMode && spellcastingStats.hasSpellAttackOverride && (
                <button
                  onClick={onResetSpellAttackBonus}
                  className="text-[10px] px-2 py-0.5 rounded border border-white/20 hover:border-(--accent)/60 transition"
                  title="Reset to auto-calculated value"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="font-semibold">{formatSigned(spellcastingStats.spellAttackModifier)}</p>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-zinc-700">
              Prof ({spellcastingStats.proficiency}) + {abilityLabel(spellcastingStats.ability)} ({formatSigned(spellcastingStats.abilityMod)}) = {formatSigned(spellcastingStats.autoSpellAttackModifier)}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}