import type { ReactNode } from "react";

export default function HeaderCard({ children }: { children?: ReactNode }) {
  return <div className="rounded-2xl panel-subtle border px-4 py-3 sm:px-6 sm:py-4">{children}</div>;
}
