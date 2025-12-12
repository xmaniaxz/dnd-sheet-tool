/* ============================================================================
 * CHARACTER PAGE - MAIN LAYOUT
 * ============================================================================
 * Main character sheet layout with three-column responsive design
 * Components:
 * - Left: Character stats, abilities, HP, skills
 * - Center: Portrait
 * - Right: Tabs for feats, languages, notes, character info, dice
 * ============================================================================ */

"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useSearchParams } from "next/navigation";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import HitPoints from "@/components/character/HpBar";
import DiceRoller from "@/components/dice/DiceRoller";
import DeathSaves from "@/components/character/DeathSaves";
import StatsRow from "@/components/character/StatsRow";
import NameLevel from "@/components/character/NameLevel";
import ThemePicker from "@/components/ui/ThemePicker";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguagesPanel from "@/components/character/LanguagesPanel";
import NotesPanel from "@/components/character/NotesPanel";
import IdentityPanel from "@/components/character/IdentityPanel";
import CharacterInfoPanel from "@/components/character/CharacterInfoPanel";
import AbilityScoresPanel from "@/components/character/AbilityScoresPanel";
import CoinsPanel from "@/components/character/CoinsPanel";
import InventoryPanel from "@/components/character/InventoryPanel";
import SpellsSection from "@/components/character/SpellsSection";
import { SaveIndicator } from "@/components/SaveIndicator";
import ProfileImageUpload from "@/components/character/ProfileImageUpload";

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

const tabs = ["Feats", "Notes", "Character Info", "Identity", "Dice"] as const;
type Tab = (typeof tabs)[number];

type Feat = {
  title: string;
  lines: string[];
};

/* ============================================================================
 * MAIN CHARACTER PAGE COMPONENT
 * ============================================================================ */

export default function CharacterPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("Feats");
  const { data, setData, setByPath, loadCharacter, createNewCharacter, isLoading } = useCharacter();
  const { editMode, toggleEditMode } = useEditMode();

  // Handle URL parameters for loading or creating characters
  useEffect(() => {
    const characterId = searchParams.get('id');
    const isNew = searchParams.get('new');
    
    if (isNew === 'true') {
      // Create a new character
      createNewCharacter();
    } else if (characterId) {
      // Load existing character
      loadCharacter(characterId);
    }
  }, [searchParams, loadCharacter, createNewCharacter]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="w-full min-h-screen theme-surface flex flex-col items-center gap-4 p-4">
      <SaveIndicator />
      <motion.section
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-7xl rounded-3xl backpanel text-(--text) shadow-2xl  border overflow-hidden"
      >
        {/* MAIN AREA */}
        <motion.div
          layout
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="
          grid gap-4 p-4 sm:p-6 lg:p-8
          grid-cols-1
          lg:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1.6fr)]
          items-start
        "
        >
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4 lg:pr-6 order-1">
            <Header>
              <div className="flex items-center justify-between gap-3">
                <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={toggleEditMode}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition-colors cursor-pointer
                ${editMode ? "accent-soft" : ""}`}
                aria-pressed={editMode}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${editMode ? "dot-accent active" : "dot-accent"}`}
                  aria-hidden
                />
                {editMode ? "Editing" : "Edit"}
              </motion.button>
                <div className="flex items-center gap-2">
                  <ThemePicker />
                  <ThemeToggle />
                </div>
              </div>
            </Header>
            <Header>
              <NameLevel />
            </Header>
            {/* Portrait for small screens (between header and HP) */}
            <div className="flex justify-center lg:hidden">
              <Portrait className="h-40 w-40" />
            </div>

            <HitPoints
              current={data.hp.current}
              max={data.hp.max}
              temp={data.hp.temp ?? 0}
              onChangeCurrent={(value: number) => setByPath("hp.current", value)}
              onChangeMax={(value: number) =>
                setData((prev) => {
                  const next = structuredClone(prev);
                  next.hp.max = Math.max(1, value);
                  return next;
                })
              }
              onChangeTemp={(value: number) => setByPath("hp.temp", value)}
            />
            <DeathSaves />
            <StatsRow />
          </div>

          {/* CENTER COLUMN â€“ big portrait on large screens */}
          <div className="hidden lg:flex justify-center order-2">
            <Portrait className="h-60 w-60 xl:h-72 xl:w-72" />
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-3 lg:gap-4 order-3">
            <Tabs active={activeTab} onChange={handleTabChange} />
            <RightPanel activeTab={activeTab} />
          </div>
        </motion.div>
      </motion.section>
       <motion.section
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-7xl rounded-3xl backpanel text-(--text) shadow-2xl  border overflow-hidden"
      >
        <div
          className="
          grid gap-4 p-4 sm:p-6 lg:p-8
          grid-cols-1
          items-start
        "
        >
          <AbilityScoresPanel />
        </div>
      
      </motion.section>
      <motion.section
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-7xl rounded-3xl backpanel text-(--text) shadow-2xl  border overflow-hidden"
      >
        <div
          className="
          grid gap-4 p-4 sm:p-6 lg:p-8
          grid-cols-1
          items-start
        "
        >
          <SpellsSection />
        </div>
      </motion.section>
    </div>
  );
}

/* -------------------------------- Left side components -------------------------------- */

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl panel-subtle border px-4 py-3 sm:px-6 sm:py-4">
      {children}
    </div>
  );
}



/* -------------------------------- Right side components -------------------------------- */

const Tabs = memo(function Tabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="rounded-2xl panel-alt border px-2 py-1 flex gap-1 text-xs sm:text-sm overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`relative rounded-xl px-3 py-2 whitespace-nowrap font-medium transition
            ${
              isActive
                ? "bg-(--accent) text-(--accent-contrast) shadow-sm"
                : ""
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
});

function RightPanel({ activeTab }: { activeTab: Tab }) {
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (measureRef.current) {
        // Force a reflow to ensure accurate measurement
        const height = measureRef.current.getBoundingClientRect().height;
        setContentHeight(height);
      }
    };

    // Multiple measurement attempts to catch delayed renders
    const timeouts = [
      setTimeout(updateHeight, 0),
      setTimeout(updateHeight, 50),
      setTimeout(updateHeight, 150),
      setTimeout(updateHeight, 300),
    ];

    const resizeObserver = measureRef.current ? new ResizeObserver(() => {
      updateHeight();
    }) : null;

    if (measureRef.current) {
      resizeObserver?.observe(measureRef.current);
    }

    return () => {
      timeouts.forEach(clearTimeout);
      resizeObserver?.disconnect();
    };
  }, [activeTab]);

  return (
    <motion.div 
      animate={{ height: contentHeight }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="rounded-2xl panel border overflow-hidden"
    >
      <div ref={measureRef} className="p-4 sm:p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "Feats" && <FeatsPanel />}
            {activeTab === "Notes" && <NotesPanel />}
            {activeTab === "Character Info" && (
              <div className="space-y-4">
                <CharacterInfoPanel />
                <CoinsPanel />
                <InventoryPanel />
              </div>
            )}
            {activeTab === "Identity" && <IdentityPanel />}
            {activeTab === "Dice" && <DiceRoller count={1} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function FeatsPanel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const feats = (data.feats || []) as Feat[];

  const addFeat = useCallback(() => {
    const newFeats = [...feats, { title: "New Feat", lines: [""] }];
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const removeFeat = useCallback((index: number) => {
    const newFeats = feats.filter((_, i) => i !== index);
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const updateFeatTitle = useCallback((index: number, title: string) => {
    const newFeats = [...feats];
    newFeats[index] = { ...newFeats[index], title };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const updateFeatLine = useCallback((featIndex: number, lineIndex: number, value: string) => {
    const newFeats = [...feats];
    const newLines = [...newFeats[featIndex].lines];
    newLines[lineIndex] = value;
    newFeats[featIndex] = { ...newFeats[featIndex], lines: newLines };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const addFeatLine = useCallback((featIndex: number) => {
    const newFeats = [...feats];
    newFeats[featIndex] = {
      ...newFeats[featIndex],
      lines: [...newFeats[featIndex].lines, ""],
    };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const removeFeatLine = useCallback((featIndex: number, lineIndex: number) => {
    const newFeats = [...feats];
    newFeats[featIndex] = {
      ...newFeats[featIndex],
      lines: newFeats[featIndex].lines.filter((_, i) => i !== lineIndex),
    };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-semibold">Feats</h2>
        {editMode && (
          <button
            onClick={addFeat}
            className="px-3 py-1 bg-(--accent) text-(--accent-contrast) rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            + Add Feat
          </button>
        )}
      </div>
      <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin">
        {feats.length === 0 && !editMode ? (
          <p className="text-sm opacity-60">No feats yet.</p>
        ) : (
          feats.map((feat, featIndex) => (
            <div
              key={featIndex}
              className="rounded-xl border border-zinc-700/90 p-3 sm:p-4 relative"
            >
              {editMode && (
                <button
                  onClick={() => removeFeat(featIndex)}
                  className="absolute top-1 right-1 text-red-500 hover:text-red-300 text-sm font-bold"
                  title="Remove feat"
                >
                  ✕
                </button>
              )}
              
              {editMode ? (
                <input
                  type="text"
                  value={feat.title}
                  onChange={(e) => updateFeatTitle(featIndex, e.target.value)}
                  className="font-semibold mb-2 w-full input"
                  placeholder="Feat name"
                />
              ) : (
                <h3 className="font-semibold mb-2">{feat.title}</h3>
              )}

              <ul className="list-disc text-sm space-y-1 pl-5">
                {feat.lines.map((line, lineIndex) => (
                  <li key={lineIndex} className="flex items-start gap-2">
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          value={line}
                          onChange={(e) => updateFeatLine(featIndex, lineIndex, e.target.value)}
                          className="flex-1 input text-sm"
                          placeholder="Feat description"
                        />
                        {feat.lines.length > 1 && (
                          <button
                            onClick={() => removeFeatLine(featIndex, lineIndex)}
                            className="text-red-400 hover:text-red-300 text-xs"
                            title="Remove line"
                          >
                            ✕
                          </button>
                        )}
                      </>
                    ) : (
                      line
                    )}
                  </li>
                ))}
              </ul>

              {editMode && (
                <button
                  onClick={() => addFeatLine(featIndex)}
                  className="mt-2 text-xs opacity-60 hover:opacity-100 transition"
                >
                  + Add line
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
      <p className="text-sm ">{text}</p>
    </div>
  );
}

/* -------------------------------- Portrait -------------------------------- */

function Portrait({ className = "" }: { className?: string }) {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleImageChange = useCallback((imageUrl: string) => {
    setByPath("profilePicture", imageUrl);
  }, [setByPath]);

  return (
    <>
      <div className={`relative ${className} group`}>
        {/* Outer circle */}
        <div className="w-full aspect-square absolute inset-0 rounded-full accent-glow glow-full glow-pulse" />
        {/* Inner */}
        <div className="relative flex h-full w-full items-center justify-center rounded-full ring-2 ring-(--border) overflow-hidden">
          <img
            src={data.profilePicture || "/default_character.jpg"}
            alt={data.name || "Character"}
            className="object-cover h-full w-full"
          />
          
          {/* Edit overlay - only shows in edit mode */}
          {editMode && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2 text-white">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
                <span className="text-sm font-medium">Change Image</span>
              </div>
            </motion.button>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <ProfileImageUpload
            currentImage={data.profilePicture}
            onImageChange={handleImageChange}
            onClose={() => setShowUploadModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}







