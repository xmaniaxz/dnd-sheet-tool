"use client";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import { motion } from "framer-motion";

export default function DeathSaves() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const deathSaves = data.deathSaves ?? { successes: 0, failures: 0 };
  
  // Only show death saves when HP is 0
  if (data.hp.current > 0) {
    return null;
  }

  const toggleSuccess = (index: number) => {
    if (!editMode) return;
    const current = deathSaves.successes;
    const newValue = current > index ? index : index + 1;
    setByPath("deathSaves.successes", Math.min(3, Math.max(0, newValue)));
  };

  const toggleFailure = (index: number) => {
    if (!editMode) return;
    const current = deathSaves.failures;
    const newValue = current > index ? index : index + 1;
    setByPath("deathSaves.failures", Math.min(3, Math.max(0, newValue)));
  };

  const reset = () => {
    if (!editMode) return;
    setByPath("deathSaves", { successes: 0, failures: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl panel border p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Death Saves</h3>
        {editMode && (deathSaves.successes > 0 || deathSaves.failures > 0) && (
          <button
            onClick={reset}
            className="text-xs px-2 py-1 rounded border border-zinc-600 hover:border-zinc-500"
          >
            Reset
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-emerald-400 w-20">Successes</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <button
                key={`success-${index}`}
                onClick={() => toggleSuccess(index)}
                disabled={!editMode}
                className={`h-6 w-6 rounded-full border-2 transition-all ${
                  index < deathSaves.successes
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-zinc-600"
                } ${editMode ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
              />
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-red-400 w-20">Failures</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <button
                key={`failure-${index}`}
                onClick={() => toggleFailure(index)}
                disabled={!editMode}
                className={`h-6 w-6 rounded-full border-2 transition-all ${
                  index < deathSaves.failures
                    ? "bg-red-500 border-red-500"
                    : "border-zinc-600"
                } ${editMode ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
