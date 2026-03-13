"use client";

import { motion } from "framer-motion";
import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import HitPoints from "@/components/character/HpBar";
import DeathSaves from "@/components/character/DeathSaves";
import StatsRow from "@/components/character/StatsRow";
import NameLevel from "@/components/character/NameLevel";
import ThemePicker from "@/components/ui/ThemePicker";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AbilityScoresPanel from "@/components/character/AbilityScoresPanel";
import SpellsSection from "@/components/character/SpellsSection";
import { SaveIndicator } from "@/components/SaveIndicator";
import HeaderCard from "@/components/character/page/HeaderCard";
import CharacterTabs from "@/components/character/page/CharacterTabs";
import CharacterRightPanel from "@/components/character/page/CharacterRightPanel";
import CharacterPortrait from "@/components/character/page/CharacterPortrait";
import CharacterLoadingFallback from "@/components/character/page/CharacterLoadingFallback";
import { useCharacterPageEffects } from "@/components/character/page/useCharacterPageEffects";
import type { Tab } from "@/components/character/page/types";

function CharacterPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("Feats");
  const { data, setData, setByPath, loadCharacter, createNewCharacter } = useCharacter();
  const { editMode, toggleEditMode } = useEditMode();

  useCharacterPageEffects({
    searchParams,
    characterName: data.name,
    setByPath,
    loadCharacter,
    createNewCharacter,
  });

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
          <div className="flex flex-col gap-4 lg:pr-6 order-1">
            <HeaderCard>
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
            </HeaderCard>
            <HeaderCard>
              <NameLevel />
            </HeaderCard>

            <div className="flex justify-center lg:hidden">
              <CharacterPortrait className="h-40 w-40" />
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

          <div className="hidden lg:flex justify-center order-2">
            <CharacterPortrait className="h-60 w-60 xl:h-72 xl:w-72" />
          </div>

          <div className="flex flex-col gap-3 lg:gap-4 order-3">
            <CharacterTabs active={activeTab} onChange={handleTabChange} />
            <CharacterRightPanel activeTab={activeTab} />
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

export default function CharacterPage() {
  return (
    <Suspense fallback={<CharacterLoadingFallback />}>
      <CharacterPageContent />
    </Suspense>
  );
}
