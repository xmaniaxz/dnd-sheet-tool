"use client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type EditModeContextValue = {
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  toggleEditMode: () => void;
};

const EditModeContext = createContext<EditModeContextValue | undefined>(undefined);

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);

  const value = useMemo<EditModeContextValue>(
    () => ({
      editMode,
      setEditMode,
      toggleEditMode: () => setEditMode((prev) => !prev),
    }),
    [editMode]
  );

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) {
    throw new Error("useEditMode must be used within an EditModeProvider");
  }
  return ctx;
}

