/* ============================================================================
 * SPELLS SECTION COMPONENT
 * ============================================================================
 * Manages character spells, spell slots, and spell preparation
 * Features:
 * - Spell list with filtering by class, level, and source
 * - Spell slot tracking and management
 * - Known/prepared spell management
 * - Automatic spell slot calculation based on class and level
 * - Class change detection with slot reset options
 * ============================================================================ */

"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import { GetSpellsFromTable } from "@/app/character/node-appwrite";
import ClassChangeModal from "@/components/modals/ClassChangeModal";
import SpellSlotChangesModal from "@/components/modals/SpellSlotChangesModal";
import SpellCard from "@/components/character/spells/SpellCard";
import SpellSlotsPanel from "@/components/character/spells/SpellSlotsPanel";
import {
  calculateSpellSlots,
  getCasterType,
  getSourceLabel,
  getSpellRenderKey,
  inferSpellcastingAbility,
  modifier,
  normalizeSourceKey,
  parseSpellcastingAbility,
  type Spell,
  type SpellSlots,
} from "@/components/character/spells/spellUtils";

type TabType = "spellbook" | "available";
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
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [expandedSpells, setExpandedSpells] = useState<Set<string>>(new Set());
  const [editingSlots, setEditingSlots] = useState<number | null>(null);
  const [showClassChangeModal, setShowClassChangeModal] = useState(false);
  const [showEditModeExitModal, setShowEditModeExitModal] = useState(false);
  const [spells, setSpells] = useState<Spell[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

  /* ----------------------------------------------------------------------------
   * REFS FOR CHANGE DETECTION
   * ---------------------------------------------------------------------------- */
  const prevClassRef = useRef(data.identity.class);
  const prevLevelRef = useRef(data.level);
  const prevEditModeRef = useRef(editMode);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /* ----------------------------------------------------------------------------
   * DEBOUNCED SEARCH
   * ---------------------------------------------------------------------------- */
  useEffect(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    searchDebounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  /* ----------------------------------------------------------------------------
   * CONSTANTS
   * ---------------------------------------------------------------------------- */
  const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const spellCastingClasses = [
    "Bard",
    "Cleric",
    "Druid",
    "Paladin",
    "Ranger",
    "Sorcerer",
    "Warlock",
    "Wizard",
    "Artificer",
  ];

  /* ----------------------------------------------------------------------------
   * HELPER FUNCTIONS
   * ---------------------------------------------------------------------------- */

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
  const toggleSpellKnown = useCallback((spellName: string) => {
    const currentKnown = Array.from(knownSpellNames);
    const currentPrepared = Array.from(preparedSpellNames);

    if (currentKnown.includes(spellName)) {
      // Removing from known - also remove from prepared
      const newKnown = currentKnown.filter((name) => name !== spellName);
      const newPrepared = currentPrepared.filter((name) => name !== spellName);
      setByPath("spells.known", newKnown);
      setByPath("spells.prepared", newPrepared);
    } else {
      // Adding to known
      const newKnown = [...currentKnown, spellName];
      setByPath("spells.known", newKnown);
    }
  }, [knownSpellNames, preparedSpellNames, setByPath]);

  // Toggle spell prepared state (can only prepare known spells)
  const toggleSpellPrepared = useCallback((spellName: string) => {
    if (!spellName || !knownSpellNames.has(spellName)) return; // Can't prepare unknown spells

    const currentPrepared = Array.from(preparedSpellNames);
    const newPrepared = currentPrepared.includes(spellName)
      ? currentPrepared.filter((name) => name !== spellName)
      : [...currentPrepared, spellName];

    setByPath("spells.prepared", newPrepared);
  }, [knownSpellNames, preparedSpellNames, setByPath]);

  // Check if spell is known
  const isSpellKnown = useCallback((spellName: string) => {
    if (!spellName) return false;
    return knownSpellNames.has(spellName);
  }, [knownSpellNames]);

  // Check if spell is prepared
  const isSpellPrepared = useCallback((spellName: string) => {
    if (!spellName) return false;
    return preparedSpellNames.has(spellName);
  }, [preparedSpellNames]);

  // Check if spell slots are dirty (modified from defaults)
  const slotChanges = useMemo(() => {
    const spellData = data.spells as { slots?: SpellSlots } | undefined;
    const currentSlots = spellData?.slots || {};
    const defaultSlots = calculateSpellSlots(
      data.identity.class,
      data.identity.subClass,
      data.level,
    );
    const changes: string[] = [];

    // Check if any max values differ from defaults
    for (let i = 1; i <= 9; i++) {
      const level = i as keyof SpellSlots;
      const currentMax = currentSlots[level]?.max || 0;
      const defaultMax = defaultSlots[level]?.max || 0;

      if (currentMax !== defaultMax) {
        changes.push(
          `Level ${i}: ${currentMax} slots (default: ${defaultMax})`,
        );
      }
    }
    return changes;
  }, [data.spells, data.identity.class, data.identity.subClass, data.level]);

  const spellSlotsDirty = slotChanges.length > 0;

  // Detect edit mode exit with dirty spell slots or class change
  useEffect(() => {
    const wasEditMode = prevEditModeRef.current;
    const isEditMode = editMode;
    let scheduleId: number | null = null;

    if (wasEditMode && !isEditMode) {
      const currentClass = data.identity.class;
      const currentSubClass = data.identity.subClass;
      const prevClass = prevClassRef.current;

      if (currentClass !== prevClass && prevClass) {
        const prevCasterType = getCasterType(prevClass, data.identity.subClass);
        const currentCasterType = getCasterType(currentClass, currentSubClass);

        if (prevCasterType !== currentCasterType) {
          scheduleId = requestAnimationFrame(() => {
            setShowClassChangeModal(true);
            prevEditModeRef.current = editMode;
          });
          return () => {
            if (scheduleId !== null) cancelAnimationFrame(scheduleId);
          };
        }
      }

      if (spellSlotsDirty) {
        scheduleId = requestAnimationFrame(() => {
          setShowEditModeExitModal(true);
        });
      }
    }

    prevEditModeRef.current = editMode;

    return () => {
      if (scheduleId !== null) cancelAnimationFrame(scheduleId);
    };
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
      // Extract base class name - first word only (e.g., "Artificer" from "Artificer Runic Dragoon, 8")
      const baseClass = currentClass.split(/[\s,]+/)[0].trim();
      requestAnimationFrame(() => {
        setSelectedClass(baseClass);
      });

      const prevCasterType = getCasterType(prevClass, data.identity.subClass);
      const currentCasterType = getCasterType(currentClass, currentSubClass);

      // If same caster type, just update slots immediately
      if (prevCasterType === currentCasterType && currentCasterType) {
        const defaultSlots = calculateSpellSlots(
          currentClass,
          currentSubClass,
          currentLevel,
        );
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
        const defaultSlots = calculateSpellSlots(
          currentClass,
          currentSubClass,
          currentLevel,
        );

        // Update max values but keep current values proportional
        const newSlots: SpellSlots = {};
        for (let i = 1; i <= 9; i++) {
          const level = i as keyof SpellSlots;
          if (defaultSlots[level]) {
            const newMax = defaultSlots[level]!.max;
            const oldCurrent = currentSlots[level]?.current || 0;

            // Keep current value, but cap at new max
            newSlots[level] = {
              max: newMax,
              current: Math.min(oldCurrent, newMax),
            };
          }
        }

        setByPath("spells.slots", newSlots);
      }
    }

    prevClassRef.current = currentClass;
    prevLevelRef.current = currentLevel;
  }, [
    data.identity.class,
    data.identity.subClass,
    data.level,
    data.spells,
    setByPath,
  ]);

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
    const defaultSlots = calculateSpellSlots(
      data.identity.class,
      data.identity.subClass,
      data.level,
    );
    setByPath("spells.slots", defaultSlots);

    // Clear prepared spells
    setByPath("spells.prepared", []);

    setShowClassChangeModal(false);
  };

  const handleClassChangeKeep = () => {
    // Just update spell slots, keep prepared spells
    const defaultSlots = calculateSpellSlots(
      data.identity.class,
      data.identity.subClass,
      data.level,
    );
    setByPath("spells.slots", defaultSlots);

    setShowClassChangeModal(false);
  };

  const handleKeepChanges = () => {
    // User wants to keep the modified spell slots
    setShowEditModeExitModal(false);
  };

  const handleDiscardChanges = () => {
    // Reset spell slots to defaults
    const defaultSlots = calculateSpellSlots(
      data.identity.class,
      data.identity.subClass,
      data.level,
    );
    setByPath("spells.slots", defaultSlots);

    setShowEditModeExitModal(false);
  };

  // Get spell slots from character data
  const spellSlots = useMemo(() => {
    const spellData = data.spells as { slots?: SpellSlots } | undefined;
    const currentSlots = spellData?.slots || {};

    // Calculate default slots based on class, subclass, and level
    const defaultSlots = calculateSpellSlots(
      data.identity.class,
      data.identity.subClass,
      data.level,
    );

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
  const updateSpellSlot = useCallback((
    level: number,
    field: "current" | "max",
    value: number,
  ) => {
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
  }, [spellSlots, setByPath]);

  // Spend a spell slot
  const spendSpellSlot = useCallback((level: number) => {
    const slotLevel = level as keyof SpellSlots;
    const slot = spellSlots[slotLevel];
    if (slot && slot.current > 0) {
      updateSpellSlot(level, "current", slot.current - 1);
    }
  }, [spellSlots, updateSpellSlot]);

  // Restore a spell slot
  const restoreSpellSlot = useCallback((level: number) => {
    const slotLevel = level as keyof SpellSlots;
    const slot = spellSlots[slotLevel];
    if (slot && slot.current < slot.max) {
      updateSpellSlot(level, "current", slot.current + 1);
    }
  }, [spellSlots, updateSpellSlot]);

  const handleToggleExpanded = useCallback((spellKey: string) => {
    setExpandedSpells((prev) => {
      const next = new Set(prev);
      if (next.has(spellKey)) {
        next.delete(spellKey);
      } else {
        next.add(spellKey);
      }
      return next;
    });
  }, []);

  // Long rest - restore all slots
  const longRest = () => {
    const newSlots = { ...spellSlots };
    Object.keys(newSlots).forEach((key) => {
      const level = parseInt(key) as keyof SpellSlots;
      if (newSlots[level]) {
        newSlots[level]!.current = newSlots[level]!.max;
      }
    });
    setByPath("spells.slots", newSlots);
  };

  // Reset spell slots to class defaults
  const resetSpellSlots = () => {
    const defaultSlots = calculateSpellSlots(
      data.identity.class,
      data.identity.subClass,
      data.level,
    );
    setByPath("spells.slots", defaultSlots);
  };

  // Filter based on tab and level with memoization
  const baseFilteredSpells = useMemo(() => {
    return activeTab === "spellbook"
      ? spells.filter((spell) => knownSpellNames.has(spell.name))
      : spells;
  }, [activeTab, spells, knownSpellNames]);

  const sourceOptions = useMemo(() => {
    const baseSpells = baseFilteredSpells;

    const options = new Map<string, string>();

    baseSpells.forEach((spell) => {
      const key = normalizeSourceKey(spell.source);
      if (!options.has(key)) {
        options.set(key, getSourceLabel(spell.source));
      }
    });

    if (!options.has("player's handbook")) {
      options.set("player's handbook", "Player's Handbook");
    }

    return Array.from(options.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [baseFilteredSpells]);

  // Filter based on tab, class, source, and level
  const filteredSpells = useMemo(() => {
    const baseSpells = baseFilteredSpells;
    const normalizedSearch = debouncedSearchQuery.toLowerCase();

    const searchFilteredSpells =
      !debouncedSearchQuery || debouncedSearchQuery.trim() === ""
        ? baseSpells
        : baseSpells.filter(
            (spell) =>
              spell.name.toLowerCase().includes(normalizedSearch) ||
              spell.description.toLowerCase().includes(normalizedSearch) ||
              spell.school.toLowerCase().includes(normalizedSearch),
          );

    const classFiltredSpells =
      selectedClass === "all"
        ? searchFilteredSpells
        : searchFilteredSpells.filter((spell) => {
            if (!spell.classes) return false;
            const spellClasses = spell.classes
              .toLowerCase()
              .split(",")
              .map((c) => c.trim());
            return spellClasses.includes(selectedClass.toLowerCase());
          });

    const sourceFilteredSpells =
      selectedSource === "all"
        ? classFiltredSpells
        : classFiltredSpells.filter(
            (spell) => normalizeSourceKey(spell.source) === selectedSource,
          );

    return selectedLevel === "all"
      ? sourceFilteredSpells
      : sourceFilteredSpells.filter((spell) => spell.level === selectedLevel);
  }, [
    baseFilteredSpells,
    debouncedSearchQuery,
    selectedClass,
    selectedSource,
    selectedLevel,
  ]);

  // Group spells by level for better organization
  const spellsByLevel: Record<number, Spell[]> = useMemo(() => {
    const grouped: Record<number, Spell[]> = {};
    filteredSpells.forEach((spell) => {
      const level = isNaN(spell.level) ? 0 : spell.level;
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(spell);
    });
    return grouped;
  }, [filteredSpells]);

  const sortedLevels = useMemo(() => {
    return Object.keys(spellsByLevel)
      .map(Number)
      .sort((a, b) => a - b);
  }, [spellsByLevel]);

  const spellcastingStats = useMemo(() => {
    const spellData = data.spells as {
      spellcastingAbility?: string;
      spellSaveDC?: number;
      spellAttackBonus?: number;
    } | undefined;
    const parsed = parseSpellcastingAbility(spellData?.spellcastingAbility);
    const ability = parsed || inferSpellcastingAbility(data.identity.class || "", data.identity.subClass || "");
    const abilityScore = data.abilities[ability] ?? 10;
    const abilityMod = modifier(abilityScore);
    const proficiency = data.proficiency ?? 0;
    const autoSpellSaveDC = 8 + proficiency + abilityMod;
    const autoSpellAttackModifier = proficiency + abilityMod;
    const saveOverride = typeof spellData?.spellSaveDC === "number" ? spellData.spellSaveDC : undefined;
    const attackOverride = typeof spellData?.spellAttackBonus === "number" ? spellData.spellAttackBonus : undefined;

    return {
      ability,
      abilityMod,
      proficiency,
      autoSpellSaveDC,
      autoSpellAttackModifier,
      spellSaveDC: saveOverride ?? autoSpellSaveDC,
      spellAttackModifier: attackOverride ?? autoSpellAttackModifier,
      hasSpellSaveOverride: saveOverride !== undefined,
      hasSpellAttackOverride: attackOverride !== undefined,
    };
  }, [data.spells, data.identity.class, data.identity.subClass, data.abilities, data.proficiency]);

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
          changes={slotChanges}
          onDiscard={handleDiscardChanges}
          onKeep={handleKeepChanges}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Spells</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm opacity-70">
            {knownCount} known • {preparedCount} prepared
          </div>
        </div>
      </div>

      {/* Spell Slots Display */}
      <SpellSlotsPanel
        editMode={editMode}
        spellSlotsDirty={spellSlotsDirty}
        spellSlots={spellSlots}
        editingSlots={editingSlots}
        spellcastingStats={spellcastingStats}
        onResetSlots={resetSpellSlots}
        onLongRest={longRest}
        onSetEditingSlots={setEditingSlots}
        onUpdateSpellSlot={updateSpellSlot}
        onSpendSpellSlot={spendSpellSlot}
        onRestoreSpellSlot={restoreSpellSlot}
        onResetSpellSaveDC={() => setByPath("spells.spellSaveDC", undefined)}
        onResetSpellAttackBonus={() =>
          setByPath("spells.spellAttackBonus", undefined)
        }
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 panel-subtle border rounded-xl p-1">
        <button
          onClick={() => {
            setActiveTab("spellbook");
            setExpandedSpells(new Set());
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
            setExpandedSpells(new Set());
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

      {/* Search and Filters Row */}
      <div className="flex gap-4 flex-wrap items-end">
        {/* Search Bar */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs opacity-60 mb-1 block">Search</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spells..."
              className="w-full px-3 py-2 pl-9 pr-9 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all duration-200 focus:outline-none focus:border-(--accent)"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                title="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Class Filter Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs opacity-60 mb-1 block">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all duration-200 focus:outline-none focus:border-(--accent)"
          >
            <option value="all">All Classes</option>
            {spellCastingClasses.map((className) => {
              const isCurrentClass =
                data.identity.class.toLowerCase() === className.toLowerCase();
              return (
                <option key={className} value={className}>
                  {className}
                  {isCurrentClass ? " ★" : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* Level Filter Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs opacity-60 mb-1 block">Source</label>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all duration-200 focus:outline-none focus:border-(--accent)"
          >
            <option value="all">All Sources</option>
            {sourceOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Level Filter Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs opacity-60 mb-1 block">Level</label>
          <select
            value={selectedLevel}
            onChange={(e) =>
              setSelectedLevel(
                e.target.value === "all" ? "all" : parseInt(e.target.value),
              )
            }
            className="w-full px-3 py-2 rounded-lg text-sm font-medium panel-subtle border hover:border-(--accent)/50 transition-all duration-200 focus:outline-none focus:border-(--accent)"
          >
            <option value="all">All Levels</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level === 0 ? "Cantrips" : `Level ${level}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spell List organized by level */}
      <div className="space-y-6 animate-fade-in">
        {sortedLevels.map((level) => {
          const levelSpells = spellsByLevel[level] || [];
          const levelSpellKeys = levelSpells.map((spell) => getSpellRenderKey(spell));
          return (
            <div key={level}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-lg font-semibold flex justify-start items-center gap-4">
                  {level === 0 ? "Cantrips" : `Level ${level}`}
                  <div className="flex items-start gap-2">
                  <button 
                    onClick={() => {
                      setExpandedSpells((prev) => {
                        const next = new Set(prev);
                        levelSpellKeys.forEach((key) => next.delete(key));
                        return next;
                      });
                    }}
                    className="text-xs px-2 py-1 rounded-md panel-subtle border hover:border-(--accent)/50 transition-all duration-200"
                  >
                    Collapse
                  </button>
                  <button
                    onClick={() => {
                      setExpandedSpells((prev) => {
                        const next = new Set(prev);
                        levelSpellKeys.forEach((key) => next.add(key));
                        return next;
                      });
                    }}
                    className="text-xs px-2 py-1 rounded-md panel-subtle border hover:border-(--accent)/50 transition-all duration-200"
                  >
                    Uncollapse
                  </button>
                </div>
                </h3>
                
                <span className="text-sm opacity-60">
                  {levelSpells.length} spell
                  {levelSpells.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {levelSpells.map((spell, index) => {
                  const spellKey = getSpellRenderKey(spell);
                  return (
                    <SpellCard
                      key={spellKey}
                      spell={spell}
                      spellKey={spellKey}
                      isExpanded={expandedSpells.has(spellKey)}
                      isKnown={isSpellKnown(spell.name)}
                      isPrepared={isSpellPrepared(spell.name)}
                      onToggle={handleToggleExpanded}
                      onToggleKnown={toggleSpellKnown}
                      onTogglePrepared={toggleSpellPrepared}
                      onCast={
                        spell.level > 0
                          ? spendSpellSlot
                          : undefined
                      }
                      index={index}
                      activeTab={activeTab}
                      hasSlots={
                        spell.level === 0 ||
                        (spellSlots[spell.level as keyof SpellSlots]?.current ??
                          0) > 0
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredSpells.length === 0 && (
          <div className="text-center py-8 panel-subtle rounded-xl border animate-fade-in">
            <p className="text-sm opacity-70">
              {activeTab === "spellbook"
                ? "No known spells" +
                  (selectedLevel !== "all" ? " at this level" : "")
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
