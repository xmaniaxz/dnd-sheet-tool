"use client";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import NumericInput from "@/components/inputs/NumericInput";

export default function CoinsPanel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const coins = data.inventory.coins;
  const setCoin = (key: keyof typeof coins, val: number) => setByPath(`inventory.coins.${key}`, Math.max(0, val));
  return (
    <div className="space-y-2">
      <h2 className="text-lg sm:text-xl font-semibold">Coins</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          ["copper", "CP"],
          ["silver", "SP"],
          ["gold", "GP"],
          ["platinum", "PP"],
        ] as const).map(([key, label]) => (
          <div key={key} className="rounded-xl panel border px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide ">{label}</div>
            {editMode ? (
              <NumericInput
                value={coins[key]}
                min={0}
                defaultIfEmpty={0}
                normalize={(n) => Math.max(0, n)}
                onChange={(v) => setCoin(key, v)}
                className="mt-1 w-full text-center rounded-md  border border-zinc-700 px-2 py-1 text-sm  focus:outline-none focus:ring-1 focus:ring-[--accent]"
              />
            ) : (
              <div className="mt-1 text-lg font-semibold ">{coins[key]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
