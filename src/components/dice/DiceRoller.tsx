/* ============================================================================
 * DICE ROLLER COMPONENT
 * ============================================================================
 * 3D dice roller with physics simulation
 * Features:
 * - Single dice rolls with customizable count
 * - Dice pool for rolling multiple types together
 * - Advantage/Disadvantage mode for d20 rolls
 * - Percentile dice support (d100 + d10)
 * - Visual 3D dice animation with customizable colors/textures
 * - Roll history tracking
 * ============================================================================ */

"use client";

import { useEffect, useState, useRef, memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import DiceBox from "@3d-dice/dice-box-threejs/dist/dice-box-threejs.es.js";
import { DICE_COLORS, DICE_OPTIONS, DICE_TEXTURES } from "@/components/dice/diceConfig";
import "@/app/character/character.css";

/* ============================================================================
 * MAIN DICE ROLLER COMPONENT
 * ============================================================================ */

export default function DiceBoxDemo({ count: initialCount }: { count: number }) {
  /* ----------------------------------------------------------------------------
   * STATE MANAGEMENT
   * ---------------------------------------------------------------------------- */
  const [result, setResult] = useState<string>("");
  const [lastresult, setLastResult] = useState<string[]>([]);
  const [showDice, setShowDice] = useState(false);
  const [animateResult, setAnimateResult] = useState(false);
  const count = initialCount;
  const [advantageMode, setAdvantageMode] = useState<
    "none" | "advantage" | "disadvantage"
  >("none");
  const [pool, setPool] = useState<Record<string, number>>({});
  
  /* ----------------------------------------------------------------------------
   * REFS FOR DICEBOX MANAGEMENT
   * ---------------------------------------------------------------------------- */
  const containerRef = useRef<HTMLDivElement | null>(null);
  type ModeContext = {
    mode: "advantage" | "disadvantage";
    bonus: number;
    label: string;
    diceSpec: Array<{ count: number; sides: number }>;
  };
  type DiceRollSet = { sides?: number; rolls?: Array<{ value?: number }> };
  type DiceRollResult = { value?: number; total?: number; sets?: DiceRollSet[] };
  type DiceBoxInstance = {
    initialize: () => Promise<void>;
    clear?: () => void;
    updateConfig: (cfg: Record<string, unknown>) => Promise<void> | void;
    roll: (notation: string) => Promise<void> | void;
    onRoll?: unknown;
  };

  const boxRef = useRef<DiceBoxInstance | null>(null);
  const initializedRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRollsRef = useRef(0);
  const lastRollLabelRef = useRef<string>("");
  const modeContextRef = useRef<ModeContext | null>(null);

  const beginRoll = () => {
    pendingRollsRef.current += 1;
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setShowDice(true);
  };

  const completeRollLifecycle = () => {
    setAnimateResult(false);
    requestAnimationFrame(() => setAnimateResult(true));

    pendingRollsRef.current = Math.max(0, pendingRollsRef.current - 1);
    if (pendingRollsRef.current > 0) {
      return;
    }

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowDice(false);
      try {
        boxRef.current?.clear?.();
      } catch {}
    }, 1000);
  };

  const formatSetBreakdown = useCallback((sets?: DiceRollSet[]) => {
    if (!Array.isArray(sets) || sets.length === 0) {
      return { text: "", total: 0, hasValues: false };
    }

    const parts: string[] = [];
    let total = 0;

    sets.forEach((set) => {
      const sides = Number(set?.sides || 0);
      const values = Array.isArray(set?.rolls)
        ? set.rolls
            .map((roll) => Number(roll?.value))
            .filter((value) => !Number.isNaN(value))
        : [];

      if (values.length === 0 || sides <= 0) return;

      total += values.reduce((sum, value) => sum + value, 0);
      parts.push(`[${values.join(",")}]`);
    });

    return {
      text: parts.join(" + "),
      total,
      hasValues: parts.length > 0,
    };
  }, []);

  const parseDiceNotation = useCallback((notation: string) => {
    const diceMatches = [...notation.matchAll(/(\d*)d(\d+)/g)];
    if (diceMatches.length === 0) return null;

    const diceSpec = diceMatches.map((match) => ({
      count: Number(match[1] || 1),
      sides: Number(match[2]),
    }));

    const modifierMatches = notation.replace(/(\d*)d(\d+)/g, "").match(/[+-]\d+/g);
    const modifier = modifierMatches
      ? modifierMatches.reduce((sum, val) => sum + Number(val), 0)
      : 0;

    return { diceSpec, modifier };
  }, []);

  const formatSingleRoll = useCallback((label: string, result: DiceRollResult) => {
    const isPercentileRoll = Array.isArray(result?.sets) &&
      result.sets.length === 2 &&
      result.sets.some((s: DiceRollSet) => s?.sides === 100) &&
      result.sets.some((s: DiceRollSet) => s?.sides === 10);

    if (isPercentileRoll && result.sets) {
      const d100Set = result.sets.find((s: DiceRollSet) => s?.sides === 100);
      const d10Set = result.sets.find((s: DiceRollSet) => s?.sides === 10);
      const tensValue = Number(d100Set?.rolls?.[0]?.value || 0);
      const onesValue = Number(d10Set?.rolls?.[0]?.value || 0);

      let percentileResult = tensValue + onesValue;
      if (percentileResult === 0) percentileResult = 100;

      const detail = `d100 (${tensValue} + ${onesValue}) = ${percentileResult}`;
      const fullLabel = label ? `${label}: ${detail}` : detail;
      return { total: percentileResult, detail, label: fullLabel };
    }

    const total = result?.value || result?.total || 0;
    const breakdown = formatSetBreakdown(result?.sets);
    const baseRoll = breakdown.hasValues ? breakdown.total : total;
    const modifier = total - baseRoll;

    let detail = "";
    if (breakdown.hasValues) {
      const modText = modifier !== 0 ? `${modifier >= 0 ? " + " : " - "}${Math.abs(modifier)}` : "";
      detail = `${breakdown.text}${modText} = ${total}`;
    } else if (modifier !== 0) {
      detail = `(${baseRoll})${modifier >= 0 ? "+" : ""}${modifier} = ${total}`;
    } else {
      detail = `(${baseRoll}) = ${total}`;
    }

    const fullLabel = label ? `${label}: ${detail}` : detail;
    return { total, detail, label: fullLabel };
  }, [formatSetBreakdown]);

  /* ----------------------------------------------------------------------------
   * DICEBOX INITIALIZATION & ROLL HANDLER
   * ---------------------------------------------------------------------------- */
  useEffect(() => {
    if (!containerRef.current) return;
    if (initializedRef.current) return;

    initializedRef.current = true;

    const box = new DiceBox("#dice-container", {
      assetPath: "/dice-box/",
      scale: 6,
      gravity: 2,
      mass: 1,
      friction: 0.6,
      restitution: 0.8,
      linearDamping: 0.3,
      angularDamping: 0.3,
      spinForce: 8,
      throwForce: 6,
      startingHeight: 10,
      settleTimeout: 5000,
      offscreen: false,
      delay: 10,
      onRollComplete: (result: DiceRollResult) => {
        const label = lastRollLabelRef.current;
        const rollSummary = formatSingleRoll(label, result);

        if (modeContextRef.current) {
          const { mode, bonus, diceSpec, label: modeLabel } = modeContextRef.current;
          const modeTag = mode === "advantage" ? "adv" : "dis";

          const detailPartsA: string[] = [];
          const detailPartsB: string[] = [];
          let totalA = 0;
          let totalB = 0;

          const isPercentile =
            diceSpec.length === 2 &&
            diceSpec.some((spec) => spec.sides === 100) &&
            diceSpec.some((spec) => spec.sides === 10);

          if (isPercentile) {
            const d100Set = result?.sets?.find((s) => Number(s?.sides) === 100);
            const d10Set = result?.sets?.find((s) => Number(s?.sides) === 10);

            const tensValues = Array.isArray(d100Set?.rolls)
              ? d100Set.rolls.map((roll) => Number(roll?.value)).filter((val) => !Number.isNaN(val))
              : [];
            const onesValues = Array.isArray(d10Set?.rolls)
              ? d10Set.rolls.map((roll) => Number(roll?.value)).filter((val) => !Number.isNaN(val))
              : [];

            const tensA = tensValues[0] ?? 0;
            const tensB = tensValues[1] ?? tensA;
            const onesA = onesValues[0] ?? 0;
            const onesB = onesValues[1] ?? onesA;

            const baseA = tensA + onesA;
            const baseB = tensB + onesB;
            totalA = baseA === 0 ? 100 : baseA;
            totalB = baseB === 0 ? 100 : baseB;

            totalA += bonus;
            totalB += bonus;

            const winner = mode === "advantage"
              ? (totalA >= totalB ? totalA : totalB)
              : (totalA <= totalB ? totalA : totalB);

            const bonusText = bonus !== 0 ? ` ${bonus >= 0 ? "+" : "-"} ${Math.abs(bonus)}` : "";
            const detailA = `d100 (${tensA} + ${onesA})${bonusText} = ${totalA}`;
            const detailB = `d100 (${tensB} + ${onesB})${bonusText} = ${totalB}`;
            const finalLabel = modeLabel
              ? `${modeLabel}: ${detailA} vs ${detailB} => ${winner} (${modeTag})`
              : `${detailA} vs ${detailB} => ${winner} (${modeTag})`;

            setResult(String(winner));
            setLastResult((prev) => [finalLabel, ...prev]);
            modeContextRef.current = null;
            completeRollLifecycle();
            return;
          }

          diceSpec.forEach((spec) => {
            const set = result?.sets?.find((s) => Number(s?.sides) === spec.sides);
            const values = Array.isArray(set?.rolls)
              ? set.rolls.map((roll) => Number(roll?.value)).filter((val) => !Number.isNaN(val))
              : [];

            if (values.length === 0) return;

            const expected = spec.count * 2;
            let first: number[] = [];
            let second: number[] = [];

            if (values.length >= expected) {
              first = values.slice(0, spec.count);
              second = values.slice(spec.count, spec.count * 2);
            } else if (values.length >= 2) {
              const half = Math.floor(values.length / 2);
              first = values.slice(0, half);
              second = values.slice(half, half * 2);
            } else {
              first = [values[0]];
              second = [values[0]];
            }

            totalA += first.reduce((sum, val) => sum + val, 0);
            totalB += second.reduce((sum, val) => sum + val, 0);

            detailPartsA.push(`[${first.join(",")}]`);
            detailPartsB.push(`[${second.join(",")}]`);
          });

          totalA += bonus;
          totalB += bonus;

          const winner = mode === "advantage"
            ? (totalA >= totalB ? totalA : totalB)
            : (totalA <= totalB ? totalA : totalB);

          const bonusText = bonus !== 0 ? ` ${bonus >= 0 ? "+" : "-"} ${Math.abs(bonus)}` : "";
          const detailA = `${detailPartsA.join(" + ")}${bonusText} = ${totalA}`;
          const detailB = `${detailPartsB.join(" + ")}${bonusText} = ${totalB}`;
          const finalLabel = modeLabel
            ? `${modeLabel}: ${detailA} vs ${detailB} => ${winner} (${modeTag})`
            : `${detailA} vs ${detailB} => ${winner} (${modeTag})`;

          setResult(String(winner));
          setLastResult((prev) => [finalLabel, ...prev]);
          modeContextRef.current = null;
        } else {
          setResult(String(rollSummary.total));
          setLastResult((prev) => [rollSummary.label, ...prev]);
        }
        
        /* ---- POST-ROLL ANIMATION & CLEANUP ---- */
        completeRollLifecycle();
      },
    });
    boxRef.current = box;

    (async () => {
      await box.initialize();
    })();
  }, [formatSingleRoll]);

  /* ----------------------------------------------------------------------------
   * QUICK ROLL HANDLER
   * ---------------------------------------------------------------------------- */

  const rollWithMode = useCallback(async (notation: string, label: string, bonus: number) => {
    lastRollLabelRef.current = label;

    let rollNotation = notation;
    if (advantageMode !== "none") {
      const parsed = parseDiceNotation(notation);
      if (parsed) {
        const combinedBonus = bonus + parsed.modifier;
        rollNotation = parsed.diceSpec
          .map((spec) => `${spec.count * 2}d${spec.sides}`)
          .join("+");
        modeContextRef.current = {
          mode: advantageMode,
          bonus: combinedBonus,
          label,
          diceSpec: parsed.diceSpec,
        };
      } else {
        rollNotation = bonus !== 0
          ? `${notation}${bonus >= 0 ? "+" : ""}${bonus}`
          : notation;
      }
    } else {
      rollNotation = bonus !== 0
        ? `${notation}${bonus >= 0 ? "+" : ""}${bonus}`
        : notation;
    }

    beginRoll();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const randomColor = DICE_COLORS[Math.floor(Math.random() * DICE_COLORS.length)];
    const randomTexture = DICE_TEXTURES[Math.floor(Math.random() * DICE_TEXTURES.length)];

    await boxRef.current?.updateConfig({
      shadows: true,
      sounds: true,
      volume: 100,
      sound_dieMaterial: "wood",
      color_spotlight: "#FFFFFF",
      light_intensity: 1,
      theme_customColorset: {
        background: randomColor,
        texture: randomTexture,
        foreground: "#ffffff",
      },
    });

    await boxRef.current?.roll(rollNotation);
  }, [advantageMode, parseDiceNotation]);

  const handleQuickRoll = useCallback(async (notation: string, bonus: number, label: string) => {
    await rollWithMode(notation, label, bonus);
  }, [rollWithMode]);

  /* ----------------------------------------------------------------------------
   * ROLL FUNCTIONS
   * ---------------------------------------------------------------------------- */

  // Single dice roll
  const handleRoll = async (die: string) => {
    const notation = `${count}${die}`;
    await rollWithMode(notation, notation, 0);
  };

  /* ----------------------------------------------------------------------------
   * DICE POOL MANAGEMENT
   * ---------------------------------------------------------------------------- */

  const addDieToPool = (die: string) => {
    setPool((prev) => ({ ...prev, [die]: (prev[die] ?? 0) + count }));
  };

  const decrementDieInPool = (die: string) => {
    setPool((prev) => {
      const current = prev[die] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[die];
        return next;
      }
      return { ...prev, [die]: current - 1 };
    });
  };

  const removeDieFromPool = (die: string) => {
    setPool((prev) => {
      const next = { ...prev };
      delete next[die];
      return next;
    });
  };

  const clearPool = () => setPool({});

  // Roll all dice in pool
  const handleRollPool = async () => {
    const entries = Object.entries(pool).filter(([, qty]) => qty > 0);
    if (entries.length === 0) return;

    // Build combined notation like "2d6+1d8"
    const notation = entries.map(([die, qty]) => `${qty}${die}`).join("+");
    await rollWithMode(notation, notation, 0);
  };

  /* ============================================================================
   * RENDER
   * ============================================================================ */

  return (
    <div className="space-y-4">
      <div className="rounded-2xl panel border px-4 py-3">
        <div className="text-[11px] uppercase tracking-wide mb-2">Roll Mode</div>
        <div className="inline-flex rounded-md overflow-hidden border border-zinc-700 text-xs">
          <button
            className={`px-2 py-1 transition-colors ${advantageMode === "none" ? "bg-(--accent)/30 text-white border border-(--accent) shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" : "opacity-70 hover:opacity-100"}`}
            onClick={() => setAdvantageMode("none")}
          >
            Normal
          </button>
          <button
            className={`px-2 py-1 border-l border-zinc-700 transition-colors ${advantageMode === "advantage" ? "bg-(--accent)/30 text-white border border-(--accent) shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" : "opacity-70 hover:opacity-100"}`}
            onClick={() => setAdvantageMode("advantage")}
          >
            Advantage
          </button>
          <button
            className={`px-2 py-1 border-l border-zinc-700 transition-colors ${advantageMode === "disadvantage" ? "bg-(--accent)/30 text-white border border-(--accent) shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" : "opacity-70 hover:opacity-100"}`}
            onClick={() => setAdvantageMode("disadvantage")}
          >
            Disadvantage
          </button>
        </div>
      </div>

      {/* Quick Rolls Section */}
      <QuickRollButtons onRoll={handleQuickRoll} />
      
      {/* Fullscreen Dice Container */}
      <div
        ref={containerRef}
        id="dice-container"
        className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-700 ${
          showDice ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ width: "100vw", height: "100vh" }}
      />

      {/* Result Display */}
      {result && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: animateResult ? 1 : 0.8, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="rounded-2xl panel-alt border p-6 text-center"
        >
          <div className="text-5xl font-bold accent-text">{result}</div>
        </motion.div>
      )}

      {/* Roll History */}
      {lastresult.length > 0 && (
        <div className="rounded-2xl panel border p-4">
          <h4 className="text-xs font-medium mb-2 opacity-70">Recent Rolls</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto overflow-x-hidden">
            {lastresult.slice(0,5).map((res: string, idx: number) => (
              <motion.div
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 0.7 }}
                transition={{ delay: idx * 0.05 }}
                className="text-xs font-mono"
              >
                {res}
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Advanced Dice Roller */}
      <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3">Advanced Dice Roller</h3>
        <AdvancedDiceControls 
          count={count}
          pool={pool}
          addDieToPool={addDieToPool}
          decrementDieInPool={decrementDieInPool}
          removeDieFromPool={removeDieFromPool}
          clearPool={clearPool}
          handleRoll={handleRoll}
          handleRollPool={handleRollPool}
        />
      </div>
    </div>
  );
}

/* ============================================================================
 * QUICK ROLL BUTTONS COMPONENT
 * ============================================================================ */

const QuickRollButtons = memo(function QuickRollButtons({ onRoll }: { onRoll: (notation: string, bonus: number, label: string) => void }) {
  const { data } = useCharacter();
  const { abilities, proficiencies, proficiency, feats, initiative, inventory } = data;

  const equippedWeapons = useMemo(
    () => inventory.weapons.filter((weapon) => weapon.equipped),
    [inventory.weapons]
  );

  const modifier = useCallback((score: number) => Math.floor((score - 10) / 2), []);

  const rollAbilityCheck = useCallback((ability: keyof typeof abilities) => {
    const abilityMod = modifier(abilities[ability]);
    onRoll("1d20", abilityMod, `${ability.toUpperCase()}`);
  }, [abilities, modifier, onRoll]);

  const rollSave = useCallback((ability: keyof typeof abilities) => {
    const abilityMod = modifier(abilities[ability]);
    const profBonus = proficiencies.saves[ability] ? (proficiency ?? 0) : 0;
    onRoll("1d20", abilityMod + profBonus, `${ability.toUpperCase()} Save`);
  }, [abilities, proficiency, proficiencies.saves, modifier, onRoll]);

  const rollInitiative = useCallback(() => {
    const dexMod = modifier(abilities.dex);
    const alertBonus = feats?.some(feat => feat.title.toLowerCase().includes('alert')) ? 5 : 0;
    const initBonus = (initiative ?? 0) + dexMod + alertBonus;
    onRoll("1d20", initBonus, "Initiative");
  }, [abilities.dex, feats, initiative, modifier, onRoll]);

  const rollAttack = useCallback((weapon: typeof inventory.weapons[0]) => {
    const isFinesse = weapon.properties?.includes('finesse');
    const isRanged = weapon.range && weapon.range.normal > 10;
    
    let abilityMod: number;
    if (isFinesse) {
      abilityMod = Math.max(modifier(abilities.str), modifier(abilities.dex));
    } else if (isRanged) {
      abilityMod = modifier(abilities.dex);
    } else {
      abilityMod = modifier(abilities.str);
    }
    
    const profBonus = proficiency ?? 0;
    const weaponBonus = weapon.attackBonus ?? 0;
    const totalBonus = abilityMod + profBonus + weaponBonus;
    
        onRoll("1d20", totalBonus, `${weapon.name} Attack`);
      }, [abilities, proficiency, modifier, onRoll, inventory]);

  const rollDamage = useCallback((weapon: typeof inventory.weapons[0]) => {
    const match = weapon.damage.match(/(\d+)d(\d+)/);
    if (!match) return;
    
    const numDice = parseInt(match[1]);
    const diceSize = parseInt(match[2]);
    
    const isFinesse = weapon.properties?.includes('finesse');
    const isRanged = weapon.range && weapon.range.normal > 10;
    
    let abilityMod: number;
    if (isFinesse) {
      abilityMod = Math.max(modifier(abilities.str), modifier(abilities.dex));
    } else if (isRanged) {
      abilityMod = modifier(abilities.dex);
    } else {
      abilityMod = modifier(abilities.str);
    }
    
        onRoll(`${numDice}d${diceSize}`, abilityMod, `${weapon.name} Damage`);
      }, [abilities, modifier, onRoll, inventory]);

  return (
    <div className="rounded-2xl panel border p-4 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide">Quick Rolls</h3>
      
      {/* Initiative */}
      <div>
        <button
          onClick={rollInitiative}
          className="w-full px-3 py-2 rounded-lg border accent-solid text-sm font-medium"
        >
          Roll Initiative
        </button>
      </div>
      
      {/* Ability Checks */}
      <div>
        <h4 className="text-xs font-medium mb-2 opacity-70">Ability Checks</h4>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(abilities) as Array<keyof typeof abilities>).map((ability) => (
            <button
              key={ability}
              onClick={() => rollAbilityCheck(ability)}
              className="px-2 py-1.5 rounded border border-zinc-700 text-xs hover:border-zinc-600"
            >
              {ability.toUpperCase()} {modifier(abilities[ability]) >= 0 ? '+' : ''}{modifier(abilities[ability])}
            </button>
          ))}
        </div>
      </div>
      
      {/* Saving Throws */}
      <div>
        <h4 className="text-xs font-medium mb-2 opacity-70">Saving Throws</h4>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(abilities) as Array<keyof typeof abilities>).map((ability) => {
            const abilityMod = modifier(abilities[ability]);
            const profBonus = proficiencies.saves[ability] ? (proficiency ?? 0) : 0;
            const total = abilityMod + profBonus;
            return (
              <button
                key={ability}
                onClick={() => rollSave(ability)}
                className="px-2 py-1.5 rounded border border-zinc-700 text-xs hover:border-zinc-600"
              >
                {ability.toUpperCase()} {total >= 0 ? '+' : ''}{total}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Weapons */}
      <div>
        <h4 className="text-xs font-medium mb-2 opacity-70">Weapons</h4>
        {equippedWeapons.length === 0 ? (
          <p className="text-xs opacity-60">No weapons equipped.</p>
        ) : (
          <div className="space-y-2">
            {equippedWeapons.map((weapon, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-700/90 p-2">
                <div className="text-xs font-medium mb-1">{weapon.name}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => rollAttack(weapon)}
                    className="flex-1 px-2 py-1 rounded border border-zinc-700 text-xs hover:border-emerald-600"
                  >
                    Attack
                  </button>
                  <button
                    onClick={() => rollDamage(weapon)}
                    className="flex-1 px-2 py-1 rounded border border-zinc-700 text-xs hover:border-red-600"
                  >
                    Damage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

/* ============================================================================
 * ADVANCED DICE CONTROLS COMPONENT
 * ============================================================================ */

function AdvancedDiceControls({
  count,
  pool,
  addDieToPool,
  decrementDieInPool,
  removeDieFromPool,
  clearPool,
  handleRoll,
  handleRollPool,
}: {
  count: number;
  pool: Record<string, number>;
  addDieToPool: (die: string) => void;
  decrementDieInPool: (die: string) => void;
  removeDieFromPool: (die: string) => void;
  clearPool: () => void;
  handleRoll: (die: string) => Promise<void>;
  handleRollPool: () => Promise<void>;
}) {
  return (
    <div className="rounded-2xl panel-alt border px-4 py-3 space-y-3">
      <div className="text-[11px] uppercase tracking-wide ">
        Dice
      </div>

      <div className="flex flex-wrap gap-2">
        {DICE_OPTIONS.map((die) => (
          <div key={die} className="flex items-center gap-2">
            <button
            className="px-3 py-1.5 text-sm rounded-md border border-zinc-700   hover: hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-(--accent) transition-colors"
              onClick={() => handleRoll(die)}
              title={`Quick roll ${count}${die}`}
            >
              {count} {die}
            </button>
            <button
              className="px-2 py-1 text-xs rounded-md border border-zinc-700   hover:"
              onClick={() => addDieToPool(die)}
              title={`Add ${count}${die} to pool`}
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* Selected dice pool */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wide ">Selected</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(pool).length === 0 && (
            <span className="text-xs text-zinc-500">No dice selected</span>
          )}
          {Object.entries(pool).map(([die, qty]) => (
            <span
              key={die}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full /70 border border-zinc-700 text-zinc-200"
            >
              {qty} {die}
              <button
                className="ml-1 h-5 w-5 inline-flex items-center justify-center rounded /70 border border-zinc-700  hover:"
                onClick={() => decrementDieInPool(die)}
                title="Remove one"
              >
                -
              </button>
              <button
                className="ml-0.5 h-5 w-5 inline-flex items-center justify-center rounded /70 border border-zinc-700  hover:"
                onClick={() => removeDieFromPool(die)}
                title="Remove all"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded-md border accent-solid disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleRollPool}
            disabled={Object.keys(pool).length === 0}
          >
            Roll Selected
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md border border-zinc-700   disabled:opacity-40"
            onClick={clearPool}
            disabled={Object.keys(pool).length === 0}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}


