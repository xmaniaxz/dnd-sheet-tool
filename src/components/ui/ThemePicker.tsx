"use client";
import { useTheme } from "@/context/ThemeContext";

type Hue = { name: string; shades: [string, string, string] }; // [400,500,600]
const HUES: Hue[] = [
  { name: "None",    shades: ["#9ca3af", "#6b7280", "#4b5563"] },
  { name: "Emerald", shades: ["#34d399", "#22c55e", "#16a34a"] },
  // { name: "Sky",     shades: ["#7dd3fc", "#38bdf8", "#0284c7"] },
  { name: "Violet",  shades: ["#a78bfa", "#8b5cf6", "#6d28d9"] },
  { name: "Rose",    shades: ["#fb7185", "#f43f5e", "#e11d48"] },
  { name: "Amber",   shades: ["#fb923c", "#f97316", "#ea580c"] },
  { name: "Cyan",    shades: ["#22d3ee", "#06b6d4", "#0891b2"] },
];

export default function ThemePicker() {
  const { theme, setAccent } = useTheme();
  const lower = (s: string) => s.toLowerCase();

 return (
    <div className="relative z-10 pointer-events-auto select-none shrink-0 min-w-fit">
      <div className="flex items-center gap-2">
        {HUES.map(({ name, shades }) => {
          const base = shades[1];
          const isActive = lower(theme.accent) === lower(base);
          return (
            <button
              key={name}
              type="button"
              className={`h-4 w-4 rounded-full border ${isActive ? "border-zinc-400" : "border-zinc-600"} cursor-pointer appearance-none shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--accent)`}
              style={{ background: "transparent" }}
              aria-label={`Use ${name} theme`}
              title={name}
              aria-pressed={isActive}
              onClick={(e) => { e.stopPropagation(); setAccent(base); }}
            >
              <span className="block w-full aspect-square rounded-full" style={{ backgroundColor: base }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

