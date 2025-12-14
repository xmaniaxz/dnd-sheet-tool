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

import { useEffect, useState, useRef, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import DiceBox from "@3d-dice/dice-box-threejs/dist/dice-box-threejs.es.js";
import "@/app/character/character.css";

/* ============================================================================
 * DICE CONFIGURATION
 * ============================================================================ */

const DiceOptions = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as string[];

// Random dice colors
const colors = [
  "#f6c928",
  "#FFFFFF",
  "#F9B333",
  "#f8d84f",
  "#f9b02d",
  "#f43c04",
  "#910200",
  "#4c1009",
  "#60E9FF",
  "#214fa3",
  "#3c6ac1",
  "#253f70",
  "#0b56e2",
  "#09317a",
  "#D6A8FF",
  "#313866",
  "#504099",
  "#66409e",
  "#934fc3",
  "#c949fc",
  "#A9FF70",
  "#a6ff00",
  "#83b625",
  "#5ace04",
  "#69f006",
  "#b0f006",
  "#93bc25",
  "#FFC500",
  "#F11602",
  "#FFC000",
  "#CDB800",
  "#6F0000",
  "#FFB5F5",
  "#7FC9FF",
  "#A17FFF",
  "#ffffff",
  "#000000",
  "#F3C3C2",
  "#EB8993",
  "#8EA1D2",
  "#7477AD",
];

// Dice texture options
const textures = [
  "cloudy",
  "cloudy_2",
  "fire",
  "marble",
  "water",
  "ice",
  "paper",
  "speckles",
  "glitter",
  "glitter_2",
  "stars",
  "stainedglass",
  "wood",
  "metal",
  "skulls",
  "leopard",
  "tiger",
  "cheetah",
  "dragon",
  "lizard",
  "bird",
  "astral",
  "bronze01",
  "bronze02",
  "bronze03",
  "bronze03a",
  "bronze03b",
  "bronze04",
];

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
  const [count] = useState(initialCount);
  const [advantageMode, setAdvantageMode] = useState<
    "none" | "advantage" | "disadvantage"
  >("none");
  const [pool, setPool] = useState<Record<string, number>>({});
  
  /* ----------------------------------------------------------------------------
   * REFS FOR DICEBOX MANAGEMENT
   * ---------------------------------------------------------------------------- */
  const advantageModeRef = useRef<"none" | "advantage" | "disadvantage">("none");
  const containerRef = useRef<HTMLDivElement | null>(null);
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
  const lastRollLabelRef = useRef<string>("");

  /* ----------------------------------------------------------------------------
   * SYNC ADVANTAGE MODE REF
   * ---------------------------------------------------------------------------- */
  useEffect(() => {
    advantageModeRef.current = advantageMode;
  }, [advantageMode]);

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
        /* ---- PERCENTILE DICE HANDLING ---- */
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
          
          const finalStr = String(percentileResult);
          const finalLabel = `d100 (${tensValue} + ${onesValue}) = ${finalStr}`;
          setResult(finalStr);
          setLastResult((prev) => [...prev, finalLabel]);
          
          setAnimateResult(false);
          requestAnimationFrame(() => setAnimateResult(true));
          
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            setShowDice(false);
            try {
              boxRef.current?.clear?.();
            } catch {}
          }, 1000);
          return;
        }

        /* ---- ADVANTAGE/DISADVANTAGE HANDLING ---- */
        const total = result?.value || result?.total || 0;
        if (advantageModeRef.current !== "none" && Array.isArray(result?.sets) && result.sets.length > 0) {
          const set = result.sets[0];
          const values: number[] = Array.isArray(set?.rolls)
            ? set.rolls.map((r: { value?: number }) => Number(r?.value)).filter((n: number) => !Number.isNaN(n))
            : [];
          if (values.length >= 2) {
            const finalVal = advantageModeRef.current === "advantage" ? Math.max(values[0], values[1]) : Math.min(values[0], values[1]);
            const finalStr = String(finalVal);
            const finalLabel = `${lastRollLabelRef.current} = ${finalStr} (${advantageModeRef.current === "advantage" ? "adv" : "dis"}: ${values[0]}, ${values[1]})`;
            setResult(finalStr);
            setLastResult((prev) => [finalLabel, ...prev]);
          } else {
            // Fallback
            setResult(String(total));
            const label = lastRollLabelRef.current ? `${lastRollLabelRef.current} = ${total}` : String(total);
            setLastResult((prev) => [label, ...prev]);
          }
        } else {
          /* ---- NORMAL ROLL ---- */
          // Extract base roll and modifier from the total
          let baseRoll = total;
          let modifier = 0;
          
          // Try to extract the actual dice roll value
          if (Array.isArray(result?.sets) && result.sets.length > 0) {
            const set = result.sets[0];
            if (Array.isArray(set?.rolls)) {
              baseRoll = set.rolls.reduce((sum: number, r: { value?: number }) => sum + Number(r?.value || 0), 0);
              modifier = total - baseRoll;
            }
          }
          
          setResult(String(total));
          
          // Format: "STR: d20 (9)+8 = 17" or "STR: d20 (9) = 9" if no modifier
          let label = lastRollLabelRef.current;
          if (modifier !== 0) {
            label = `${lastRollLabelRef.current}: (${baseRoll})${modifier >= 0 ? '+' : ''}${modifier} = ${total}`;
          } else {
            label = `${lastRollLabelRef.current}: (${baseRoll}) = ${total}`;
          }
          
          setLastResult((prev) => [label, ...prev]);
        }
        
        /* ---- POST-ROLL ANIMATION & CLEANUP ---- */
        setAnimateResult(false);
        requestAnimationFrame(() => setAnimateResult(true));
        
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          setShowDice(false);
          try {
            boxRef.current?.clear?.();
          } catch {}
        }, 1000);
      },
    });
    boxRef.current = box;

    (async () => {
      await box.initialize();
    })();
  }, []);

  /* ----------------------------------------------------------------------------
   * QUICK ROLL HANDLER
   * ---------------------------------------------------------------------------- */

  const handleQuickRoll = useCallback(async (notation: string, bonus: number, label: string) => {
    setShowDice(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomTexture = textures[Math.floor(Math.random() * textures.length)];
    
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
    
    // Store the label for the onRollComplete handler
    lastRollLabelRef.current = `${label}`;
    
    // Roll the dice with bonus - DiceBox supports notation like "1d20+2"
    const rollNotation = bonus !== 0 ? `${notation}${bonus >= 0 ? '+' : ''}${bonus}` : notation;
    await boxRef.current?.roll(rollNotation);
  }, []);

  /* ----------------------------------------------------------------------------
   * ROLL FUNCTIONS
   * ---------------------------------------------------------------------------- */

  // Single dice roll
  const handleRoll = async (die: string) => {
    // Reset the hide timer
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    
    setShowDice(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomTexture = textures[Math.floor(Math.random() * textures.length)];
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
    if (advantageMode !== "none") {
      // Roll two of the same die simultaneously
      lastRollLabelRef.current = `1${die}`;
      await boxRef.current?.roll(`2${die}`);
    } else {
      lastRollLabelRef.current = `${count}${die}`;
      await boxRef.current?.roll(`${count}${die}`);
    }
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

    // Reset the hide timer
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    // If adv/dis and pool is exactly 1x of a single die, use advantage logic
    if (advantageMode !== "none" && entries.length === 1 && entries[0][1] === 1) {
      const die = entries[0][0];
      await handleRoll(die);
      return;
    }

    // Build combined notation like "2d6+1d8"
    const notation = entries.map(([die, qty]) => `${qty}${die}`).join("+");
    lastRollLabelRef.current = notation;

    setShowDice(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomTexture = textures[Math.floor(Math.random() * textures.length)];
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
    await boxRef.current?.roll(notation);
  };

  /* ============================================================================
   * RENDER
   * ============================================================================ */

  return (
    <div className="space-y-4">
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
          advantageMode={advantageMode}
          setAdvantageMode={setAdvantageMode}
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
      {inventory.weapons.length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-2 opacity-70">Weapons</h4>
          <div className="space-y-2">
            {inventory.weapons.map((weapon, idx) => (
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
        </div>
      )}
    </div>
  );
});

/* ============================================================================
 * ADVANCED DICE CONTROLS COMPONENT
 * ============================================================================ */

function AdvancedDiceControls({
  count,
  advantageMode,
  setAdvantageMode,
  pool,
  addDieToPool,
  decrementDieInPool,
  removeDieFromPool,
  clearPool,
  handleRoll,
  handleRollPool,
}: {
  count: number;
  advantageMode: "none" | "advantage" | "disadvantage";
  setAdvantageMode: (mode: "none" | "advantage" | "disadvantage") => void;
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

      <div className="flex items-center gap-2 text-xs">
        <span className="">Mode:</span>
        <div className="inline-flex rounded-md overflow-hidden border border-zinc-700">
          <button
            className={`px-2 py-1 ${
              advantageMode === "none"
                ? " text-white"
                : " "
            }`}
            onClick={() => setAdvantageMode("none")}
          >
            Normal
          </button>
          <button
            className={`px-2 py-1 border-l border-zinc-700 ${
              advantageMode === "advantage"
                ? " text-white"
                : " "
            }`}
            onClick={() => setAdvantageMode("advantage")}
          >
            Advantage
          </button>
          <button
            className={`px-2 py-1 border-l border-zinc-700 ${
              advantageMode === "disadvantage"
                ? " text-white"
                : " "
            }`}
            onClick={() => setAdvantageMode("disadvantage")}
          >
            Disadvantage
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DiceOptions.map((die) => (
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


