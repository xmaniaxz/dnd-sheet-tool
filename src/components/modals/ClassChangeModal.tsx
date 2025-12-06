export default function ClassChangeModal({
  onReset,
  onKeep,
}: {
  onReset: () => void;
  onKeep: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="panel-subtle border rounded-xl p-6 max-w-md mx-4 animate-fade-in-up">
        <h3 className="text-xl font-bold mb-3">Class Changed</h3>
        <p className="text-sm opacity-80 mb-4">
          Your character class has changed to a different caster type. 
          Would you like to reset your spell slots and prepared spells, or keep your current prepared spells?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition font-medium"
          >
            Reset All
          </button>
          <button
            onClick={onKeep}
            className="flex-1 px-4 py-2 bg-(--accent) text-(--accent-contrast) rounded-lg hover:opacity-90 transition font-medium"
          >
            Keep Spells
          </button>
        </div>
      </div>
    </div>
  );
}
