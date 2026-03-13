export const tabs = ["Feats", "Notes", "Character Info", "Identity", "Dice"] as const;

export type Tab = (typeof tabs)[number];

export type ImportedInventoryItem = {
  category: "weapon" | "armor" | "consumable" | "tool" | "treasure" | "misc";
  name: string;
  quantity: number;
  damage?: string;
};
