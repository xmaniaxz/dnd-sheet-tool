"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = {
  name: string;
  accent: string;
  mode: "dark" | "light" | "fullcolor";
};

type ThemeContextValue = {
  theme: Theme;
  setAccent: (hex: string) => void;
  setTheme: (t: Theme) => void;
  setMode: (mode: "dark" | "light" | "fullcolor") => void;
};

const STORAGE_KEY = "theme-v1";

const defaultTheme: Theme = {
  name: "amber",
  accent: "#f97316", // Tailwind orange-500 (more amber/orange than yellow)
  mode: "dark",
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setThemeState(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--accent", theme.accent);
      root.setAttribute("data-theme", theme.mode);
      // set surface variables for modes and derive contrast
      const a = theme.accent;
      const hex = a.replace('#','');
      const r = parseInt(hex.substring(0,2),16)/255;
      const g = parseInt(hex.substring(2,4),16)/255;
      const b = parseInt(hex.substring(4,6),16)/255;
      const toLin = (c:number) => (c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4));
      const L = 0.2126*toLin(r) + 0.7152*toLin(g) + 0.0722*toLin(b);
      root.style.setProperty('--accent-contrast', L > 0.5 ? '#0b0b0b' : '#ffffff');
      if (theme.mode === "dark") {
        root.style.setProperty("--surface", "#151518");
        root.style.setProperty("--surface-bg", "#151518");
        root.style.setProperty("--backpanel", "#101014");
        root.style.setProperty("--panel", "#0f0f14");
        root.style.setProperty("--panel-alt", `color-mix(in oklab, ${a} 16%, #0f0f14)`);
        root.style.setProperty("--panel-subtle", `color-mix(in oklab, ${a} 8%, #0f0f14)`);
        root.style.setProperty("--border", `color-mix(in oklab, ${a} 18%, #3f3f46)`);
        root.style.setProperty("--text", "#e4e4e7");
      } else if (theme.mode === "light") {
        root.style.setProperty("--surface", "#f3f4f6");
        root.style.setProperty("--surface-bg", "#f3f4f6");
        root.style.setProperty("--backpanel", "#ebedf0");
        root.style.setProperty("--panel", "#ffffff");
        root.style.setProperty("--panel-alt", `color-mix(in oklab, ${a} 8%, #ffffff)`);
        root.style.setProperty("--panel-subtle", `color-mix(in oklab, ${a} 4%, #ffffff)`);
        root.style.setProperty("--border", "#d4d4d8");
        root.style.setProperty("--text", "#18181b");
      } else {
        // fullcolor neon on dark base for readability, with distinct backpanel
        const surfaceDark = `color-mix(in oklab, ${a} 22%, #001014)`;
        root.style.setProperty("--surface", surfaceDark); root.style.setProperty("--surface-bg", surfaceDark);
        root.style.setProperty("--backpanel", `color-mix(in oklab, ${a} 32%, #020b10)`);
        root.style.setProperty("--panel", `color-mix(in oklab, ${a} 45%, #05050a)`);
        root.style.setProperty("--panel-alt", `color-mix(in oklab, ${a} 65%, #05050a)`);
        root.style.setProperty("--panel-subtle", `color-mix(in oklab, ${a} 35%, #05050a)`);
        root.style.setProperty("--border", `color-mix(in oklab, ${a} 70%, #1a1a2a)`);
        root.style.setProperty("--text", "#f8fafc");
      }
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch {}
  }, [theme]);

  const setAccent = (hex: string) => setThemeState((t) => ({ ...t, accent: hex }));
  const setTheme = (t: Theme) => setThemeState(t);
  const setMode = (mode: "dark" | "light" | "fullcolor") => setThemeState((t) => ({ ...t, mode }));

  const value = useMemo(() => ({ theme, setAccent, setTheme, setMode }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

