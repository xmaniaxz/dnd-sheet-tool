export default function SpellSlotChangesModal({
  changes,
  onDiscard,
  onKeep,
}: {
  changes: string[];
  onDiscard: () => void;
  onKeep: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="panel-subtle border rounded-xl p-6 max-w-md mx-4 animate-fade-in-up">
        <h3 className="text-xl font-bold mb-3">Unsaved Spell Slot Changes</h3>
        <p className="text-sm opacity-80 mb-3">
          You have modified spell slot maximums. Would you like to keep or discard these changes?
        </p>
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs font-semibold opacity-70 mb-2">Modified Slots:</p>
          <ul className="text-sm space-y-1">
            {changes.map((change, index) => (
              <li key={index} className="opacity-90">• {change}</li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition font-medium"
          >
            Discard Changes
          </button>
          <button
            onClick={onKeep}
            className="flex-1 px-4 py-2 bg-(--accent) text-(--accent-contrast) rounded-lg hover:opacity-90 transition font-medium"
          >
            Keep Changes
          </button>
        </div>
      </div>
    </div>
  );
}
