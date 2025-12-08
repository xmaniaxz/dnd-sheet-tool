"use client";

import { useCharacter } from "@/context/CharacterSaveFileContext";
import { motion, AnimatePresence } from "framer-motion";

export function SaveIndicator() {
  const { dirty, isSaving, save } = useCharacter();

  return (
    <AnimatePresence>
      {(dirty || isSaving) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 shadow-lg">
            {isSaving ? (
              <>
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm text-zinc-300">Saving...</span>
              </>
            ) : dirty ? (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-sm text-zinc-300">Unsaved changes</span>
                <button
                  onClick={save}
                  className="ml-2 px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Save Now
                </button>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
