"use client";

import "@/app/character/character.css";
import { useEditMode } from "@/context/EditModeContext";
import { useEffect, useState } from "react";

type HitPointsProps = {
  current: number;
  max: number;
  temp?: number;
  onChangeCurrent?: (value: number) => void;
  onChangeMax?: (value: number) => void;
  onChangeTemp?: (value: number) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function HitPoints({
  current,
  max,
  temp = 0,
  onChangeCurrent,
  onChangeMax,
  onChangeTemp,
}: HitPointsProps) {
  const { editMode } = useEditMode();

  // Local string state to allow clearing inputs without snapping to 0
  const [currentInput, setCurrentInput] = useState<string>(String(current));
  const [maxInput, setMaxInput] = useState<string>(String(max));
  const [tempInput, setTempInput] = useState<string>(String(temp ?? 0));
  const [curFocused, setCurFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);
  const [tempFocused, setTempFocused] = useState(false);

  useEffect(() => {
    if (!curFocused) setCurrentInput(String(current));
  }, [current, curFocused]);
  useEffect(() => {
    if (!maxFocused) setMaxInput(String(max));
  }, [max, maxFocused]);
  useEffect(() => {
    if (!tempFocused) setTempInput(String(temp ?? 0));
  }, [temp, tempFocused]);

  // When leaving edit mode, coerce empty/NaN to defaults and clamp
  useEffect(() => {
    if (!editMode) {
      const nMax = Number(maxInput);
      const finalMax = Number.isFinite(nMax) ? Math.max(1, nMax) : 1;

      const nCur = Number(currentInput);
      const finalCur = Number.isFinite(nCur) ? clamp(nCur, 0, finalMax) : 0;

      const nTemp = Number(tempInput);
      const finalTemp = Number.isFinite(nTemp) ? Math.max(0, nTemp) : 0;

      onChangeMax?.(finalMax);
      onChangeCurrent?.(finalCur);
      onChangeTemp?.(finalTemp);

      setMaxInput(String(finalMax));
      setCurrentInput(String(finalCur));
      setTempInput(String(finalTemp));
    }
  }, [editMode]);

  const basePercent = max > 0 ? clamp((Math.min(current, max) / max) * 100, 0, 100) : 0;
  const tempPercent = max > 0 ? clamp((Math.max(0, temp) / max) * 100, 0, 100) : 0;

  // 0% = red (0deg), 100% = green (120deg)
  const hue = (basePercent * 120) / 100;

  return (
    <div className="rounded-2xl panel-alt border px-4 py-3 space-y-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide ">
        <span>HP</span>

        {editMode ? (
          <div className="flex items-center gap-1 text-[11px]">
            <input
              type="number"
              min={0}
              value={currentInput}
              onFocus={() => setCurFocused(true)}
              onBlur={() => setCurFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              onChange={(e) => {
                const raw = e.target.value;
                setCurrentInput(raw);
                if (raw === "") return;
                const n = Number(raw);
                if (!Number.isNaN(n)) onChangeCurrent?.(clamp(n, 0, max));
              }}
              className="w-12 input text-right text-xs px-1.5 py-0.5"
            />
            <span>/</span>
            <input
              type="number"
              min={1}
              value={maxInput}
              onFocus={() => setMaxFocused(true)}
              onBlur={() => setMaxFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              onChange={(e) => {
                const raw = e.target.value;
                setMaxInput(raw);
                if (raw === "") return;
                const n = Number(raw);
                if (!Number.isNaN(n)) onChangeMax?.(Math.max(1, n));
              }}
              className="w-14 input text-right text-xs px-1.5 py-0.5"
            />
            <span className="ml-1">MaxHP</span>
            <span className="mx-1">|</span>
            <input
              type="number"
              min={0}
              value={tempInput}
              onFocus={() => setTempFocused(true)}
              onBlur={() => setTempFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              onChange={(e) => {
                const raw = e.target.value;
                setTempInput(raw);
                if (raw === "") return;
                const n = Number(raw);
                if (!Number.isNaN(n)) onChangeTemp?.(Math.max(0, n));
              }}
              className="w-12 input text-right text-xs px-1.5 py-0.5"
            />
            <span className="ml-1">TempHP</span>
          </div>
        ) : (
          <span className="text-zinc-200">
            {current} / {max} MaxHP{temp > 0 ? ` • Temp ${temp}` : ""}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="h-3 w-full rounded-full  overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${basePercent}%`,
              backgroundColor: `hsl(${hue}, 90%, 50%)`,
            }}
          />
        </div>

        <div
          className={`h-2 w-full rounded-full  overflow-hidden ${
            tempPercent === 0 ? "opacity-0" : ""
          }`}
        >
          {tempPercent > 0 && (
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${tempPercent}%`,
                backgroundColor: `var(--accent)`,
              }}
              title="Temp HP"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default HitPoints;

