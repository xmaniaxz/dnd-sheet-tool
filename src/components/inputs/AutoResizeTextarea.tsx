"use client";
import { useLayoutEffect, useRef } from "react";

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  minRows?: number;
};

export default function AutoResizeTextarea({
  value,
  onChange,
  className,
  placeholder,
  minRows = 2,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.overflowY = "hidden";
    el.rows = minRows;
    el.style.height = `${el.scrollHeight}px`;
  }, [value, minRows]);

  const base = "w-full rounded-md border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none";
  const merged = className ? `${base} ${className}` : base;
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={merged}
      {...rest}
    />
  );
}
