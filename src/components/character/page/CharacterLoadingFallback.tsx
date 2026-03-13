export default function CharacterLoadingFallback() {
  return (
    <div className="w-full min-h-screen theme-surface flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
        </div>
        <p className="text-lg opacity-70 animate-pulse">Loading character...</p>
      </div>
    </div>
  );
}
