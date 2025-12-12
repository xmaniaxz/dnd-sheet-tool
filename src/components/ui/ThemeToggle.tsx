"use client";
import { useTheme } from "@/context/ThemeContext";

type Mode = "light" | "fullcolor" | "dark";
const ALL: Array<{ key: Mode; label: string; icon: string }> = [
  { key: "light", label: "Light", icon: "☀" },
  { key: "fullcolor", label: "Full", icon: "✨" },
  { key: "dark", label: "Dark", icon: "🌙" },
];

export default function ThemeToggle({ options = ["light", "fullcolor", "dark"] }: { options?: Mode[] }) {
  const { theme, setMode } = useTheme();
  const items = ALL.filter((m) => options.includes(m.key));
  return (
    <div className="inline-flex rounded-xl border border-(--border) overflow-hidden" role="group" aria-label="Theme">
      {items.map((m, i) => (
        <button
          key={m.key}
          type="button"
          aria-pressed={theme.mode === m.key}
          onClick={() => setMode(m.key)}
          className={`px-2 py-1 text-xs ${
            theme.mode === m.key ? "accent-soft" : "bg-transparent text-(--text)"
          } ${i > 0 ? "border-l border-[--border]" : ""}`}
          title={m.label}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
}
