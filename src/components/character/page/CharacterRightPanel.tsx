"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import FeatsPanel from "@/components/character/FeatsPanel";
import NotesPanel from "@/components/character/NotesPanel";
import CharacterInfoPanel from "@/components/character/CharacterInfoPanel";
import CoinsPanel from "@/components/character/CoinsPanel";
import InventoryPanel from "@/components/character/InventoryPanel";
import IdentityPanel from "@/components/character/IdentityPanel";
import DiceRoller from "@/components/dice/DiceRoller";
import type { Tab } from "./types";

export default function CharacterRightPanel({ activeTab }: { activeTab: Tab }) {
  const { data } = useCharacter();
  const { editMode } = useEditMode();
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (measureRef.current) {
        const height = measureRef.current.scrollHeight;
        setContentHeight(height);
      }
    };

    const timeouts = [
      setTimeout(updateHeight, 0),
      setTimeout(updateHeight, 50),
      setTimeout(updateHeight, 150),
      setTimeout(updateHeight, 300),
    ];

    const resizeObserver = measureRef.current
      ? new ResizeObserver(() => {
          updateHeight();
        })
      : null;

    if (measureRef.current) {
      resizeObserver?.observe(measureRef.current);
      const noteTextarea = measureRef.current.querySelector("textarea");
      if (noteTextarea) {
        resizeObserver?.observe(noteTextarea);
      }
    }

    return () => {
      timeouts.forEach(clearTimeout);
      resizeObserver?.disconnect();
    };
  }, [activeTab, data.notes, editMode]);

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
