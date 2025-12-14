"use client";

import { useState } from "react";

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
  const [input, setInput] = useState<string>("");
  const [focused, setFocused] = useState(false);

  return (
    <input
      type="number"
      value={focused ? input : String(value)}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onFocus={() => {
        setFocused(true);
        setInput(String(value));
      }}
      onBlur={() => {
        setFocused(false);
        const n = Number(input);
        const next = Number.isFinite(n) ? n : defaultIfEmpty;
        const finalVal = normalize ? normalize(next) : next;
        if (finalVal !== value) onChange(finalVal);
      }}
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

