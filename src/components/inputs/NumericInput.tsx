"use client";

import { useEffect, useState } from "react";
import { useEditMode } from "@/context/EditModeContext";

type NumericInputProps = {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  // Normalization to apply to valid numeric inputs (typing and commit)
  normalize?: (n: number) => number;
  // Value used if input is empty/NaN when leaving edit mode
  defaultIfEmpty?: number;
};

export default function NumericInput({
  value,
  onChange,
  className,
  min,
  max,
  step,
  placeholder,
  normalize,
  defaultIfEmpty = 0,
}: NumericInputProps) {
  const { editMode } = useEditMode();

  const [input, setInput] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  // Keep input in sync with external value when not actively editing
  useEffect(() => {
    if (!focused) setInput(String(value));
  }, [value, focused]);

  // When edit mode turns off, coerce empty/NaN and apply normalization
  useEffect(() => {
    if (!editMode) {
      const n = Number(input);
      const next = Number.isFinite(n) ? n : defaultIfEmpty;
      const finalVal = normalize ? normalize(next) : next;
      onChange(finalVal);
      setInput(String(finalVal));
    }
  }, [editMode]);

  return (
    <input
      type="number"
      value={input}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setInput(raw);
        if (raw === "") return; // allow empty while editing
        const n = Number(raw);
        if (!Number.isNaN(n)) {
          onChange(normalize ? normalize(n) : n);
        }
      }}
      className={className}
    />
  );
}

