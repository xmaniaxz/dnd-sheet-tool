import { memo } from "react";
import { tabs, type Tab } from "./types";

const CharacterTabs = memo(function CharacterTabs({
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
            ${isActive ? "bg-(--accent) text-(--accent-contrast) shadow-sm" : ""}`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
});

export default CharacterTabs;
