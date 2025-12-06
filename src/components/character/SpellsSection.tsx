/* ============================================================================
 * SPELLS SECTION COMPONENT
 * ============================================================================
 * Manages character spells, spell slots, and spell preparation
 * Features:
 * - Spell list with filtering by class and level
 * - Spell slot tracking and management
 * - Known/prepared spell management
 * - Automatic spell slot calculation based on class and level
 * - Class change detection with slot reset options
 * ============================================================================ */

"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import {GetSpellsFromTable} from "@/app/character/node-appwrite";
import ClassChangeModal from "@/components/modals/ClassChangeModal";
import SpellSlotChangesModal from "@/components/modals/SpellSlotChangesModal";

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

type Spell = {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  classes?: string; // comma-separated list of classes that can use this spell
};

type TabType = "spellbook" | "available";

type SpellSlots = {
  1?: { current: number; max: number };
  2?: { current: number; max: number };
  3?: { current: number; max: number };
  4?: { current: number; max: number };
  5?: { current: number; max: number };
  6?: { current: number; max: number };
  7?: { current: number; max: number };
  8?: { current: number; max: number };
  9?: { current: number; max: number };
};

/* ============================================================================
 * SPELL SLOT PROGRESSION TABLES
 * D&D 5e spell slot progressions by caster type and level
 * ============================================================================ */

const SPELL_SLOT_TABLE: Record<string, Record<number, number[]>> = {
  // Full casters: Wizard, Sorcerer, Cleric, Druid, Bard
  full: {
    1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
    3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
    4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
    5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
    6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
    7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
    8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
    9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
    10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
    11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  },
  // Half casters: Paladin, Ranger, Artificer
  half: {
    1: [0, 0, 0, 0, 0],
    2: [2, 0, 0, 0, 0],
    3: [3, 0, 0, 0, 0],
    4: [3, 0, 0, 0, 0],
    5: [4, 2, 0, 0, 0],
    6: [4, 2, 0, 0, 0],
    7: [4, 3, 0, 0, 0],
    8: [4, 3, 0, 0, 0],
    9: [4, 3, 2, 0, 0],
    10: [4, 3, 2, 0, 0],
    11: [4, 3, 3, 0, 0],
    12: [4, 3, 3, 0, 0],
    13: [4, 3, 3, 1, 0],
    14: [4, 3, 3, 1, 0],
    15: [4, 3, 3, 2, 0],
    16: [4, 3, 3, 2, 0],
    17: [4, 3, 3, 3, 1],
    18: [4, 3, 3, 3, 1],
    19: [4, 3, 3, 3, 2],
    20: [4, 3, 3, 3, 2],
  },
  // Third casters: Eldritch Knight, Arcane Trickster
  third: {
    1: [0, 0, 0, 0],
    2: [0, 0, 0, 0],
    3: [2, 0, 0, 0],
    4: [3, 0, 0, 0],
    5: [3, 0, 0, 0],
    6: [3, 0, 0, 0],
    7: [4, 2, 0, 0],
    8: [4, 2, 0, 0],
    9: [4, 2, 0, 0],
    10: [4, 3, 0, 0],
    11: [4, 3, 0, 0],
    12: [4, 3, 0, 0],
    13: [4, 3, 2, 0],
    14: [4, 3, 2, 0],
    15: [4, 3, 2, 0],
    16: [4, 3, 3, 0],
    17: [4, 3, 3, 0],
    18: [4, 3, 3, 0],
    19: [4, 3, 3, 1],
    20: [4, 3, 3, 1],
  },
};

/* ============================================================================
 * CLASS TO CASTER TYPE MAPPING
 * Maps D&D classes to their caster type (full/half/third)
 * ============================================================================ */

const CLASS_TO_CASTER_TYPE: Record<string, string> = {
  wizard: "full",
  sorcerer: "full",
  cleric: "full",
  druid: "full",
  bard: "full",
  paladin: "half",
  ranger: "half",
  artificer: "half",
  "eldritch knight": "third",
  "arcane trickster": "third",
};

/* ============================================================================
 * SPELL SLOT CALCULATION
 * Calculates available spell slots based on class, subclass, and level
 * ============================================================================ */

function calculateSpellSlots(characterClass: string, subClass: string, level: number): SpellSlots {
  const classLower = characterClass.toLowerCase();
  const subClassLower = (subClass || "").toLowerCase();
  
  // Check for third casters based on subclass
  let casterType: string | undefined = CLASS_TO_CASTER_TYPE[classLower];
  
  // For Fighter and Rogue, check subclass to determine if they're spellcasters
  if (classLower === "fighter") {
    casterType = subClassLower.includes("eldritch knight") || subClassLower.includes("eldritch") ? "third" : undefined;
  } else if (classLower === "rogue") {
    casterType = subClassLower.includes("arcane trickster") || subClassLower.includes("arcane") || subClassLower.includes("trickster") ? "third" : undefined;
  }
  
  if (!casterType) return {};
  
  const slots = SPELL_SLOT_TABLE[casterType]?.[Math.min(level, 20)] || [];
  const result: SpellSlots = {};
  
  slots.forEach((max, index) => {
    if (max > 0) {
      result[(index + 1) as keyof SpellSlots] = { current: max, max };
    }
  });
  
  return result;
}

/* ============================================================================
 * MAIN SPELLS SECTION COMPONENT
 * ============================================================================ */

export default function SpellsSection() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();

  /* ----------------------------------------------------------------------------
   * STATE MANAGEMENT
   * ---------------------------------------------------------------------------- */
  const [activeTab, setActiveTab] = useState<TabType>("spellbook");
  const [selectedLevel, setSelectedLevel] = useState<number | "all">("all");
  const [selectedClass, setSelectedClass] = useState<string>(data.identity.class || "all");
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [editingSlots, setEditingSlots] = useState<number | null>(null);
  const [showClassChangeModal, setShowClassChangeModal] = useState(false);
  const [showEditModeExitModal, setShowEditModeExitModal] = useState(false);
  const [pendingEditModeValue, setPendingEditModeValue] = useState<boolean | null>(null);
  const [spells, setSpells] = useState<Spell[]>([]);
  
  /* ----------------------------------------------------------------------------
   * REFS FOR CHANGE DETECTION
   * ---------------------------------------------------------------------------- */
  const prevClassRef = useRef(data.identity.class);
  const prevLevelRef = useRef(data.level);
  const prevEditModeRef = useRef(editMode);
  const editModeChangesRef = useRef<string[]>([]);

  /* ----------------------------------------------------------------------------
   * CONSTANTS
   * ---------------------------------------------------------------------------- */
  const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const spellCastingClasses = [
    "Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard", "Artificer"
  ];
  
  /* ----------------------------------------------------------------------------
   * HELPER FUNCTIONS
   * ---------------------------------------------------------------------------- */
  
  // Get current caster type
  const getCasterType = (characterClass: string, subClass: string) => {
    const classLower = characterClass.toLowerCase();
    const subClassLower = (subClass || "").toLowerCase();
    
    let casterType: string | undefined = CLASS_TO_CASTER_TYPE[classLower];
    
    // For Fighter and Rogue, check subclass
    if (classLower === "fighter") {
      casterType = subClassLower.includes("eldritch knight") || subClassLower.includes("eldritch") ? "third" : undefined;
    } else if (classLower === "rogue") {
      casterType = subClassLower.includes("arcane trickster") || subClassLower.includes("arcane") || subClassLower.includes("trickster") ? "third" : undefined;
    }
    
    return casterType;
  };

  /* ----------------------------------------------------------------------------
   * SPELL DATA FROM CHARACTER
   * ---------------------------------------------------------------------------- */

  // Get known spells from character data
  const knownSpellNames = useMemo(() => {
    const spellData = data.spells as { known?: string[] } | undefined;
    return new Set(spellData?.known || []);
  }, [data.spells]);

  // Get prepared spells from character data
  const preparedSpellNames = useMemo(() => {
    const spellData = data.spells as { prepared?: string[] } | undefined;
    return new Set(spellData?.prepared || []);
  }, [data.spells]);

  /* ----------------------------------------------------------------------------
   * SPELL MANAGEMENT FUNCTIONS
   * ---------------------------------------------------------------------------- */

  // Toggle spell known state
  const toggleSpellKnown = (spellName: string) => {
    const currentKnown = Array.from(knownSpellNames);
    const currentPrepared = Array.from(preparedSpellNames);
    
    if (currentKnown.includes(spellName)) {
      // Removing from known - also remove from prepared
      const newKnown = currentKnown.filter(name => name !== spellName);
      const newPrepared = currentPrepared.filter(name => name !== spellName);
      setByPath("spells.known", newKnown);
      setByPath("spells.prepared", newPrepared);
    } else {
      // Adding to known
      const newKnown = [...currentKnown, spellName];
      setByPath("spells.known", newKnown);
    }
  };

  // Toggle spell prepared state (can only prepare known spells)
  const toggleSpellPrepared = (spellName: string) => {
    if (!isSpellKnown(spellName)) return; // Can't prepare unknown spells
    
    const currentPrepared = Array.from(preparedSpellNames);
    const newPrepared = currentPrepared.includes(spellName)
      ? currentPrepared.filter(name => name !== spellName)
      : [...currentPrepared, spellName];
    
    setByPath("spells.prepared", newPrepared);
  };

  // Check if spell is known
  const isSpellKnown = (spellName: string) => {
    if (!spellName) return false;
    return knownSpellNames.has(spellName);
  };

  // Check if spell is prepared
  const isSpellPrepared = (spellName: string) => {
    if (!spellName) return false;
    return preparedSpellNames.has(spellName);
  };

  // Check if spell slots are dirty (modified from defaults)
  const spellSlotsDirty = useMemo(() => {
    const spellData = data.spells as { slots?: SpellSlots } | undefined;
    const currentSlots = spellData?.slots || {};
    const defaultSlots = calculateSpellSlots(data.identity.class, data.identity.subClass, data.level);
    
    editModeChangesRef.current = [];
    
    // Check if any max values differ from defaults
    for (let i = 1; i <= 9; i++) {
      const level = i as keyof SpellSlots;
      const currentMax = currentSlots[level]?.max || 0;
      const defaultMax = defaultSlots[level]?.max || 0;
      
      if (currentMax !== defaultMax) {
        editModeChangesRef.current.push(`Level ${i}: ${currentMax} slots (default: ${defaultMax})`);
      }
    }
    
    return editModeChangesRef.current.length > 0;
  }, [data.spells, data.identity.class, data.identity.subClass, data.level]);

  // Detect edit mode exit with dirty spell slots or class change
  useEffect(() => {
    const wasEditMode = prevEditModeRef.current;
    const isEditMode = editMode;
    
    // Exiting edit mode
    if (wasEditMode && !isEditMode) {
      const currentClass = data.identity.class;
      const currentSubClass = data.identity.subClass;
      const prevClass = prevClassRef.current;
      
      // Check if class changed to different caster type
      if (currentClass !== prevClass && prevClass) {
        const prevCasterType = getCasterType(prevClass, data.identity.subClass);
        const currentCasterType = getCasterType(currentClass, currentSubClass);
        
        if (prevCasterType !== currentCasterType) {
          // Show class change modal
          setShowClassChangeModal(true);
          prevEditModeRef.current = editMode;
          return; // Don't check for spell slot changes
        }
      }
      
      // No class change, check for spell slot modifications
      if (spellSlotsDirty) {
        setShowEditModeExitModal(true);
        setPendingEditModeValue(false);
      }
    }
    
    prevEditModeRef.current = editMode;
  }, [editMode, spellSlotsDirty, data.identity.class, data.identity.subClass]);

  // Detect class or level changes
  useEffect(() => {
    const currentClass = data.identity.class;
    const currentSubClass = data.identity.subClass;
    const currentLevel = data.level;
    const prevClass = prevClassRef.current;
    const prevLevel = prevLevelRef.current;

    // Class changed - update the selected class filter
    if (currentClass !== prevClass && currentClass) {
      setSelectedClass(currentClass);
      
      const prevCasterType = getCasterType(prevClass, data.identity.subClass);
      const currentCasterType = getCasterType(currentClass, currentSubClass);
      
      // If same caster type, just update slots immediately
      if (prevCasterType === currentCasterType && currentCasterType) {
        const defaultSlots = calculateSpellSlots(currentClass, currentSubClass, currentLevel);
        setByPath("spells.slots", defaultSlots);
      }
      // Different caster type - modal will be shown when exiting edit mode
    }
    // Level changed but not class
    else if (currentLevel !== prevLevel && currentClass === prevClass) {
      const casterType = getCasterType(currentClass, currentSubClass);
      if (casterType) {
        // Update spell slots to match new level
        const spellData = data.spells as { slots?: SpellSlots } | undefined;
        const currentSlots = spellData?.slots || {};
        const defaultSlots = calculateSpellSlots(currentClass, currentSubClass, currentLevel);
        
        // Update max values but keep current values proportional
        const newSlots: SpellSlots = {};
        for (let i = 1; i <= 9; i++) {
          const level = i as keyof SpellSlots;
          if (defaultSlots[level]) {
            const oldMax = currentSlots[level]?.max || 0;
            const newMax = defaultSlots[level]!.max;
            const oldCurrent = currentSlots[level]?.current || 0;
            
            // Keep current value, but cap at new max
            newSlots[level] = {
              max: newMax,
              current: Math.min(oldCurrent, newMax)
            };
          }
        }
        
        setByPath("spells.slots", newSlots);
      }
    }

    prevClassRef.current = currentClass;
    prevLevelRef.current = currentLevel;
  }, [data.identity.class, data.identity.subClass, data.level, data.spells, setByPath]);

  useEffect(() => {
    async function fetchSpells() {
      try {
        const result = (await GetSpellsFromTable()) as Spell[];
        setSpells(result || []);
        
      } catch (e) {
        console.error("Failed to fetch spells", e);
        setSpells([]);
      }
    }
    fetchSpells();
  }, []);

  const handleClassChangeReset = () => {
    // Reset spell slots
    const defaultSlots = calculateSpellSlots(data.identity.class, data.identity.subClass, data.level);
    setByPath("spells.slots", defaultSlots);
    
    // Clear prepared spells
    setByPath("spells.prepared", []);
    
    setShowClassChangeModal(false);
  };

  const handleClassChangeKeep = () => {
    // Just update spell slots, keep prepared spells
    const defaultSlots = calculateSpellSlots(data.identity.class, data.identity.subClass, data.level);
    setByPath("spells.slots", defaultSlots);
    
    setShowClassChangeModal(false);
  };

  const handleKeepChanges = () => {
    // User wants to keep the modified spell slots
    setShowEditModeExitModal(false);
    setPendingEditModeValue(null);
  };

  const handleDiscardChanges = () => {
    // Reset spell slots to defaults
    const defaultSlots = calculateSpellSlots(data.identity.class, data.identity.subClass, data.level);
    setByPath("spells.slots", defaultSlots);
    
    setShowEditModeExitModal(false);
    setPendingEditModeValue(null);
  };
  
  // Get spell slots from character data
  const spellSlots = useMemo(() => {
    const spellData = data.spells as { slots?: SpellSlots } | undefined;
    const currentSlots = spellData?.slots || {};
    
    // Calculate default slots based on class, subclass, and level
    const defaultSlots = calculateSpellSlots(data.identity.class, data.identity.subClass, data.level);
    
    // Merge current with defaults, keeping current values if they exist
    const merged: SpellSlots = {};
    for (let i = 1; i <= 9; i++) {
      const level = i as keyof SpellSlots;
      if (currentSlots[level]) {
        merged[level] = currentSlots[level];
      } else if (defaultSlots[level]) {
        merged[level] = defaultSlots[level];
      }
    }
    
    return merged;
  }, [data.spells, data.identity.class, data.identity.subClass, data.level]);

  // Update spell slot
  const updateSpellSlot = (level: number, field: "current" | "max", value: number) => {
    const newSlots = { ...spellSlots };
    const slotLevel = level as keyof SpellSlots;
    
    if (!newSlots[slotLevel]) {
      newSlots[slotLevel] = { current: 0, max: 0 };
    }
    
    newSlots[slotLevel]![field] = Math.max(0, value);
    
    // Ensure current doesn't exceed max
    if (field === "max" && newSlots[slotLevel]!.current > value) {
      newSlots[slotLevel]!.current = value;
    }
    
    setByPath("spells.slots", newSlots);
  };

  // Use a spell slot
  const useSpellSlot = (level: number) => {
    const slotLevel = level as keyof SpellSlots;
    const slot = spellSlots[slotLevel];
    if (slot && slot.current > 0) {
      updateSpellSlot(level, "current", slot.current - 1);
    }
  };

  // Restore a spell slot
  const restoreSpellSlot = (level: number) => {
    const slotLevel = level as keyof SpellSlots;
    const slot = spellSlots[slotLevel];
    if (slot && slot.current < slot.max) {
      updateSpellSlot(level, "current", slot.current + 1);
    }
  };

  // Long rest - restore all slots
  const longRest = () => {
    const newSlots = { ...spellSlots };
    Object.keys(newSlots).forEach(key => {
      const level = parseInt(key) as keyof SpellSlots;
      if (newSlots[level]) {
        newSlots[level]!.current = newSlots[level]!.max;
      }
    });
    setByPath("spells.slots", newSlots);
  };

  // Reset spell slots to class defaults
  const resetSpellSlots = () => {
    const defaultSlots = calculateSpellSlots(data.identity.class, data.identity.subClass, data.level);
    setByPath("spells.slots", defaultSlots);
  };
  
  // Filter based on tab and level
  const baseSpells = activeTab === "spellbook" 
    ? spells.filter(spell => isSpellKnown(spell.name))
    : spells;
    
  // Filter by class if not "all"
  const classFiltredSpells = selectedClass === "all"
    ? baseSpells
    : baseSpells.filter(spell => {
        if (!spell.classes) return false;
        const spellClasses = spell.classes.toLowerCase().split(',').map(c => c.trim());
        return spellClasses.includes(selectedClass.toLowerCase());
      });
    
  const filteredSpells = selectedLevel === "all" 
    ? classFiltredSpells 
    : classFiltredSpells.filter(spell => spell.level === selectedLevel);

  // Group spells by level for better organization
  const spellsByLevel = useMemo(() => {
    const grouped: Record<number, Spell[]> = {};
    filteredSpells.forEach(spell => {
      // Ensure level is a valid number
      const level = isNaN(spell.level) ? 0 : spell.level;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(spell);
    });
    return grouped;
  }, [filteredSpells]);

  const sortedLevels = Object.keys(spellsByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  // Count prepared and known spells
  const preparedCount = preparedSpellNames.size;
  const knownCount = knownSpellNames.size;

  return (
    <div className="flex flex-col gap-4">
      {/* Class Change Modal */}
      {showClassChangeModal && (
        <ClassChangeModal
          onReset={handleClassChangeReset}
          onKeep={handleClassChangeKeep}
        />
      )}

      {/* Edit Mode Exit Modal */}
      {showEditModeExitModal && (
        <SpellSlotChangesModal
          changes={editModeChangesRef.current}
          onDiscard={handleDiscardChanges}
          onKeep={handleKeepChanges}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Spells</h2>
        <div className="text-sm opacity-70">
          {knownCount} known • {preparedCount} prepared
        </div>
      </div>

      {/* Spell Slots Display */}
      <div className="panel-subtle border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Spell Slots</h3>
          <div className="flex gap-2">
            {editMode && (
              <button
                onClick={resetSpellSlots}
                disabled={!spellSlotsDirty}
                className={`text-xs px-3 py-1 rounded-lg transition ${
                  spellSlotsDirty
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
                title={spellSlotsDirty ? "Reset spell slots to class defaults" : "Spell slots match class defaults"}
              >
                Reset to Default
              </button>
            )}
            <button
              onClick={longRest}
              className="text-xs px-3 py-1 bg-(--accent) text-(--accent-contrast) rounded-lg hover:opacity-90 transition"
            >
              Long Rest
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
            const slot = spellSlots[level as keyof SpellSlots];
            const hasSlots = slot && slot.max > 0;
            
            return (
              <div key={level} className={`flex flex-col gap-1 ${!hasSlots ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium opacity-70">Level {level}</span>
                  {editMode && (editingSlots === level ? (
                    <button
                      onClick={() => setEditingSlots(null)}
                      className="text-xs text-(--accent)"
                    >
                      Done
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingSlots(level)}
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
                      onChange={(e) => updateSpellSlot(level, "max", parseInt(e.target.value) || 0)}
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
                            useSpellSlot(level);
                          } else {
                            restoreSpellSlot(level);
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
                
                <span className="text-xs opacity-60">
                  {slot ? `${slot.current}/${slot.max}` : '0/0'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 panel-subtle border rounded-xl p-1">
        <button
          onClick={() => {
            setActiveTab("spellbook");
            setExpandedSpell(null);
          }}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === "spellbook"
              ? "bg-(--accent) text-(--accent-contrast) shadow-lg scale-105"
              : "hover:bg-white/5"
          }`}
        >
          Spellbook ({knownCount})
        </button>
        <button
          onClick={() => {
            setActiveTab("available");
            setExpandedSpell(null);
          }}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === "available"
              ? "bg-(--accent) text-(--accent-contrast) shadow-lg scale-105"
              : "hover:bg-white/5"
          }`}
        >
          All Spells
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex gap-4 flex-wrap items-end">
        {/* Class Filter Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs opacity-60 mb-1 block">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all duration-200 focus:outline-none focus:border-(--accent)"
          >
            <option value="all">All Classes</option>
            {spellCastingClasses.map(className => {
              const isCurrentClass = data.identity.class.toLowerCase() === className.toLowerCase();
              return (
                <option key={className} value={className}>
                  {className}{isCurrentClass ? ' ★' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Level Filter Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs opacity-60 mb-1 block">Level</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all duration-200 focus:outline-none focus:border-(--accent)"
          >
            <option value="all">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>
                {level === 0 ? "Cantrips" : `Level ${level}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spell List organized by level */}
      <div className="space-y-6 animate-fade-in">
        {sortedLevels.map(level => {
          const levelSpells = spellsByLevel[level] || [];
          return (
            <div key={level}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  {level === 0 ? "Cantrips" : `Level ${level}`}
                </h3>
                <span className="text-sm opacity-60">
                  {levelSpells.length} spell{levelSpells.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {levelSpells.map((spell, index) => (
                <SpellCard
                  key={spell.name}
                  spell={spell}
                  isExpanded={expandedSpell === spell.name}
                  isKnown={isSpellKnown(spell.name)}
                  isPrepared={isSpellPrepared(spell.name)}
                  onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
                  onToggleKnown={() => toggleSpellKnown(spell.name)}
                  onTogglePrepared={() => toggleSpellPrepared(spell.name)}
                  onCast={spell.level > 0 ? () => useSpellSlot(spell.level) : undefined}
                  index={index}
                  activeTab={activeTab}
                  hasSlots={spell.level === 0 || (spellSlots[spell.level as keyof SpellSlots]?.current ?? 0) > 0}
                />
              ))}
            </div>
          </div>
          );
        })}

        {filteredSpells.length === 0 && (
          <div className="text-center py-8 panel-subtle rounded-xl border animate-fade-in">
            <p className="text-sm opacity-70">
              {activeTab === "spellbook"
                ? "No known spells" + (selectedLevel !== "all" ? " at this level" : "")
                : "No spells available"}
            </p>
            {activeTab === "spellbook" && knownCount === 0 && (
              <button
                onClick={() => setActiveTab("available")}
                className="mt-3 px-4 py-2 bg-(--accent) text-(--accent-contrast) rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Learn Spells
              </button>
            )}
            {activeTab === "available" && filteredSpells.length === 0 && (
              <button
                onClick={() => setActiveTab("spellbook")}
                className="mt-3 px-4 py-2 bg-(--accent) text-(--accent-contrast) rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Browse Spellbook
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SpellCard({ 
  spell, 
  isExpanded, 
  isKnown,
  isPrepared,
  onToggle,
  onToggleKnown,
  onTogglePrepared,
  onCast,
  index,
  activeTab,
  hasSlots
}: { 
  spell: Spell; 
  isExpanded: boolean;
  isKnown: boolean;
  isPrepared: boolean;
  onToggle: () => void;
  onToggleKnown: () => void;
  onTogglePrepared: () => void;
  onCast?: () => void;
  index: number;
  activeTab: TabType;
  hasSlots: boolean;
}) {
  // Validate spell data
  if (!spell || !spell.name) {
    return null;
  }

  return (
    <div 
      className="panel-subtle border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-(--accent)/50"
      style={{
        animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
      }}
    >
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            {isPrepared && (
              <span 
                className="h-2 w-2 rounded-full bg-(--accent) animate-pulse" 
                title="Prepared" 
              />
            )}
            {isKnown && !isPrepared && (
              <span 
                className="h-2 w-2 rounded-full bg-blue-400" 
                title="Known" 
              />
            )}
            <div className="text-left">
              <h4 className="font-semibold">{spell.name}</h4>
              <p className="text-xs opacity-70">
                {spell.level === 0 ? "Cantrip" : `Level ${isNaN(spell.level) ? '?' : spell.level}`} • {spell.school}
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Cast Button (only for prepared spells in Spellbook tab) */}
        {activeTab === "spellbook" && isPrepared && onCast && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasSlots) {
                onCast();
              }
            }}
            disabled={!hasSlots}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-l border-white/10 ${
              hasSlots
                ? "text-(--accent) hover:bg-(--accent)/10"
                : "opacity-30 cursor-not-allowed"
            }`}
            title={hasSlots ? "Cast spell (uses slot)" : "No spell slots available"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        )}
        
        {/* Learn/Unlearn Button (in All Spells tab) */}
        {activeTab === "available" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleKnown();
            }}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-l border-white/10 ${
              isKnown 
                ? "text-blue-400 hover:bg-red-500/10" 
                : "opacity-70 hover:opacity-100 hover:text-blue-400"
            }`}
            title={isKnown ? "Forget spell" : "Learn spell"}
          >
            {isKnown ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
          </button>
        )}
        
        {/* Prepare/Unprepare Button (in Spellbook tab) */}
        {activeTab === "spellbook" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePrepared();
            }}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-l border-white/10 ${
              isPrepared 
                ? "text-(--accent) hover:bg-red-500/10" 
                : "opacity-70 hover:opacity-100 hover:text-(--accent)"
            }`}
            title={isPrepared ? "Unprepare spell" : "Prepare spell"}
          >
            {isPrepared ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 space-y-2 text-sm border-t border-white/10">
          <div className="grid grid-cols-2 gap-2 pt-3">
            <div>
              <span className="opacity-70 text-xs">Casting Time</span>
              <p className="font-medium">{spell.castingTime}</p>
            </div>
            <div>
              <span className="opacity-70 text-xs">Range</span>
              <p className="font-medium">{spell.range}</p>
            </div>
            <div>
              <span className="opacity-70 text-xs">Components</span>
              <p className="font-medium">{spell.components}</p>
            </div>
            <div>
              <span className="opacity-70 text-xs">Duration</span>
              <p className="font-medium">{spell.duration}</p>
            </div>
          </div>
          <div className="pt-2">
            <span className="opacity-70 text-xs">Description</span>
            <p className="opacity-90 mt-1">{spell.description}</p>
          </div>
          
          {/* Action buttons in expanded view */}
          <div className="flex gap-2 pt-2">
            {activeTab === "spellbook" && (
              <>
                {isPrepared && onCast && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasSlots) {
                        onCast();
                      }
                    }}
                    disabled={!hasSlots}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      hasSlots
                        ? "bg-(--accent) text-(--accent-contrast) hover:opacity-90"
                        : "bg-white/10 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {hasSlots ? "Cast Spell" : "No Slots"}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePrepared();
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isPrepared
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-(--accent) text-(--accent-contrast) hover:opacity-90"
                  }`}
                >
                  {isPrepared ? "Unprepare" : "Prepare Spell"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleKnown();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Forget Spell
                </button>
              </>
            )}
            
            {activeTab === "available" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleKnown();
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isKnown
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                }`}
              >
                {isKnown ? "Forget Spell" : "Learn Spell"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
