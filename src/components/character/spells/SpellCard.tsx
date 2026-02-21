import { memo } from "react";
import {
  getSourceLabel,
  summarizeComponents,
  type Spell,
} from "@/components/character/spells/spellUtils";

type TabType = "spellbook" | "available";

function SpellCard({
  spell,
  spellKey,
  isExpanded,
  isKnown,
  isPrepared,
  onToggle,
  onToggleKnown,
  onTogglePrepared,
  onCast,
  index,
  activeTab,
  hasSlots,
}: {
  spell: Spell;
  spellKey: string;
  isExpanded: boolean;
  isKnown: boolean;
  isPrepared: boolean;
  onToggle: (spellKey: string) => void;
  onToggleKnown: (spellName: string) => void;
  onTogglePrepared: (spellName: string) => void;
  onCast?: (level: number) => void;
  index: number;
  activeTab: TabType;
  hasSlots: boolean;
}) {
  if (!spell || !spell.name) {
    return null;
  }

  const sourceLabel = getSourceLabel(spell.source);
  const levelLabel =
    spell.level === 0
      ? "Cantrip"
      : `Level ${isNaN(spell.level) ? "?" : spell.level}`;
  const rangeLabel = (spell.range || "").trim() || "N/A";
  const componentsLabel = summarizeComponents(spell.components);

  return (
    <div
      className="panel-subtle border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-(--accent)/50"
      style={{
        animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
      }}
    >
      <div className="flex items-center">
        <button
          onClick={() => onToggle(spellKey)}
          className="flex-1 px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            {isPrepared && (
              <span
                className="h-2 w-2 rounded-full bg-(--accent) animate-pulse"
                title="Prepared"
              />
            )}
            {isKnown && !isPrepared && (
              <span
                className="h-2 w-2 rounded-full bg-blue-400"
                title="Known"
              />
            )}
            <div className="text-left">
              <h4 className="font-semibold flex gap-4 justify-center">
                {spell.name}
                <div className="flex flex-wrap gap-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium panel-subtle border opacity-90">
                    {sourceLabel}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium panel-subtle border opacity-90">
                    {rangeLabel}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium panel-subtle border opacity-90">
                    {componentsLabel}
                  </span>
                </div>
              </h4>
              <p className="text-xs opacity-70">
                {levelLabel} • {spell.school}
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {activeTab === "spellbook" && isPrepared && onCast && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasSlots) {
                onCast(spell.level);
              }
            }}
            disabled={!hasSlots}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-l border-white/10 ${
              hasSlots
                ? "text-(--accent) hover:bg-(--accent)/10"
                : "opacity-30 cursor-not-allowed"
            }`}
            title={
              hasSlots ? "Cast spell (uses slot)" : "No spell slots available"
            }
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>
        )}

        {activeTab === "available" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleKnown(spell.name);
            }}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-l border-white/10 ${
              isKnown
                ? "text-blue-400 hover:bg-red-500/10"
                : "opacity-70 hover:opacity-100 hover:text-blue-400"
            }`}
            title={isKnown ? "Forget spell" : "Learn spell"}
          >
            {isKnown ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            )}
          </button>
        )}

        {activeTab === "spellbook" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePrepared(spell.name);
            }}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-l border-white/10 ${
              isPrepared
                ? "text-(--accent) hover:bg-red-500/10"
                : "opacity-70 hover:opacity-100 hover:text-(--accent)"
            }`}
            title={isPrepared ? "Unprepare spell" : "Prepare spell"}
          >
            {isPrepared ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 space-y-2 text-sm border-t border-white/10">
          <div className="grid grid-cols-2 gap-2 pt-3">
            <div>
              <span className="opacity-70 text-xs">Casting Time</span>
              <p className="font-medium">{spell.castingTime}</p>
            </div>
            <div>
              <span className="opacity-70 text-xs">Range</span>
              <p className="font-medium">{spell.range}</p>
            </div>
            <div>
              <span className="opacity-70 text-xs">Components</span>
              <p className="font-medium">{spell.components}</p>
            </div>
            <div>
              <span className="opacity-70 text-xs">Duration</span>
              <p className="font-medium">{spell.duration}</p>
            </div>
          </div>
          <div className="pt-2">
            <span className="opacity-70 text-xs">Description</span>
            <p className="opacity-90 mt-1">{spell.description}</p>
          </div>

          <div className="flex gap-2 pt-2">
            {activeTab === "spellbook" && (
              <>
                {isPrepared && onCast && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasSlots) {
                        onCast(spell.level);
                      }
                    }}
                    disabled={!hasSlots}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      hasSlots
                        ? "bg-(--accent) text-(--accent-contrast) hover:opacity-90"
                        : "bg-white/10 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {hasSlots ? "Cast Spell" : "No Slots"}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePrepared(spell.name);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isPrepared
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-(--accent) text-(--accent-contrast) hover:opacity-90"
                  }`}
                >
                  {isPrepared ? "Unprepare" : "Prepare Spell"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleKnown(spell.name);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Forget Spell
                </button>
              </>
            )}

            {activeTab === "available" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleKnown(spell.name);
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isKnown
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                }`}
              >
                {isKnown ? "Forget Spell" : "Learn Spell"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(SpellCard);