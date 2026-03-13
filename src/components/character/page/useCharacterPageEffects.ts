"use client";

import { useEffect } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { Item, Weapon } from "@/context/CharacterSaveFileContext";
import { fuzzyMatchObject } from "@/lib/fuzzyMatch";
import type { ImportedInventoryItem } from "./types";

type UseCharacterPageEffectsArgs = {
  searchParams: ReadonlyURLSearchParams;
  characterName: string;
  setByPath: (path: string, value: unknown) => void;
  loadCharacter: (documentId: string) => Promise<void>;
  createNewCharacter: () => Promise<void>;
};

const validClasses = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

const validRaces = [
  "Dragonborn",
  "Dwarf",
  "Elf",
  "Gnome",
  "Half-Elf",
  "Halfling",
  "Half-Orc",
  "Human",
  "Tiefling",
];

const validAlignments = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
];

const validBackgrounds = [
  "Acolyte",
  "Charlatan",
  "Criminal",
  "Entertainer",
  "Folk Hero",
  "Guild Artisan",
  "Hermit",
  "Noble",
  "Outlander",
  "Sage",
  "Sailor",
  "Soldier",
  "Urchin",
];

function applyImportedData(setByPath: (path: string, value: unknown) => void, rawImportedData: Record<string, unknown>) {
  const importedData = rawImportedData as Record<string, unknown>;
  const matchedData = fuzzyMatchObject(importedData, {
    class: validClasses,
    race: validRaces,
    alignment: validAlignments,
    background: validBackgrounds,
  });

  if (matchedData.name) {
    setByPath("name", matchedData.name);
    setByPath("identity.characterName", matchedData.name);
  }
  if (matchedData.level) setByPath("level", matchedData.level);
  if (matchedData.playerName) setByPath("identity.playerName", matchedData.playerName);

  if (matchedData.class) setByPath("identity.class", matchedData.class);
  if (matchedData.subClass) setByPath("identity.subClass", matchedData.subClass);
  if (matchedData.race) setByPath("identity.race", matchedData.race);
  if (matchedData.background) setByPath("identity.background", matchedData.background);
  if (matchedData.alignment) setByPath("identity.alignment", matchedData.alignment);
  if (importedData.experiencePoints) setByPath("identity.experience", String(importedData.experiencePoints));
  if (importedData.age) setByPath("identity.age", importedData.age);
  if (importedData.height) setByPath("identity.height", importedData.height);
  if (importedData.weight) setByPath("identity.weight", importedData.weight);
  if (importedData.eyes) setByPath("identity.eyes", importedData.eyes);
  if (importedData.skin) setByPath("identity.skin", importedData.skin);
  if (importedData.hair) setByPath("identity.hair", importedData.hair);

  if (importedData.personalityTraits) setByPath("identity.personalityTraits", importedData.personalityTraits);
  if (importedData.ideals) setByPath("identity.ideals", importedData.ideals);
  if (importedData.bonds) setByPath("identity.bonds", importedData.bonds);
  if (importedData.flaws) setByPath("identity.flaws", importedData.flaws);
  if (importedData.backstory) setByPath("identity.backstory", importedData.backstory);
  if (importedData.allies) setByPath("identity.allies", importedData.allies);
  if (importedData.appearance) setByPath("identity.appearance", importedData.appearance);

  if (importedData.strength) setByPath("abilities.str", importedData.strength);
  if (importedData.dexterity) setByPath("abilities.dex", importedData.dexterity);
  if (importedData.constitution) setByPath("abilities.con", importedData.constitution);
  if (importedData.intelligence) setByPath("abilities.int", importedData.intelligence);
  if (importedData.wisdom) setByPath("abilities.wis", importedData.wisdom);
  if (importedData.charisma) setByPath("abilities.cha", importedData.charisma);

  if (importedData.proficiencyBonus) setByPath("proficiency", importedData.proficiencyBonus);
  if (importedData.armorClass) setByPath("ac", importedData.armorClass);
  if (importedData.initiative !== undefined) setByPath("initiative", importedData.initiative);
  if (importedData.speed) setByPath("speed", importedData.speed);
  if (importedData.inspiration !== undefined) {
    setByPath("inspiration", Number(importedData.inspiration) > 0);
  }
  if (importedData.passivePerception) setByPath("passivePerception", importedData.passivePerception);

  if (importedData.hitPointMaximum) setByPath("hp.max", importedData.hitPointMaximum);
  if (importedData.currentHitPoints !== undefined) setByPath("hp.current", importedData.currentHitPoints);
  if (importedData.temporaryHitPoints) setByPath("hp.temp", importedData.temporaryHitPoints);
  if (importedData.hitDice || importedData.totalHitDice) {
    const diceString = importedData.totalHitDice || importedData.hitDice;
    const match = String(diceString).match(/(\d+)d(\d+)/);
    if (match) {
      setByPath("hitDice", {
        total: parseInt(match[1], 10),
        current: parseInt(match[1], 10),
        type: `d${match[2]}`,
      });
    }
  }

  if (importedData.languages) setByPath("languages", importedData.languages);

  if (importedData.proficiencies) {
    const profSection = `Proficiencies:\n${importedData.proficiencies}\n\n`;
    const currentNotes = importedData.notes || "";
    importedData.notes = profSection + currentNotes;
  }

  if (importedData.feats || importedData.featuresAndTraits) {
    const featsText = [importedData.feats, importedData.featuresAndTraits].filter(Boolean).join("\n\n");
    const featLines = String(featsText)
      .split("\n")
      .filter((line) => line.trim());
    const featsArray = featLines.map((line) => ({
      title: line.substring(0, 50),
      lines: [line],
    }));
    if (featsArray.length > 0) setByPath("feats", featsArray);
  }

  if (importedData.backstory) setByPath("notes", importedData.backstory);

  if (importedData.inventoryItems && Array.isArray(importedData.inventoryItems)) {
    const weapons: Weapon[] = [];
    const items: Item[] = [];

    importedData.inventoryItems.forEach((item: ImportedInventoryItem) => {
      if (item.category === "weapon") {
        weapons.push({
          id: `weapon_${weapons.length}`,
          name: item.name,
          quantity: item.quantity,
          category: "weapon",
          damage: item.damage || "",
          equipped: true,
        });
      } else {
        items.push({
          id: `item_${items.length}`,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
        });
      }
    });

    if (weapons.length > 0) setByPath("inventory.weapons", weapons);
    if (items.length > 0) setByPath("inventory.items", items);
  }

  const allText = [importedData.attacksAndSpellcasting, importedData.equipment, importedData.treasure]
    .filter(Boolean)
    .join("\n\n");
  if (allText) setByPath("inventory.inventoryText", allText);

  if (importedData.copperPieces !== undefined) setByPath("inventory.coins.copper", importedData.copperPieces);
  if (importedData.silverPieces !== undefined) setByPath("inventory.coins.silver", importedData.silverPieces);
  if (importedData.goldPieces !== undefined) setByPath("inventory.coins.gold", importedData.goldPieces);
  if (importedData.platinumPieces !== undefined) setByPath("inventory.coins.platinum", importedData.platinumPieces);

  if (importedData.spells && Array.isArray(importedData.spells) && importedData.spells.length > 0) {
    setByPath("spells.known", importedData.spells);
    setByPath("spells.prepared", importedData.spells);
  }

  if (importedData.spellcastingAbility) setByPath("spells.spellcastingAbility", importedData.spellcastingAbility);
  if (importedData.spellSaveDC) setByPath("spells.spellSaveDC", importedData.spellSaveDC);
  if (importedData.spellAttackBonus) setByPath("spells.spellAttackBonus", importedData.spellAttackBonus);
}

export function useCharacterPageEffects({
  searchParams,
  characterName,
  setByPath,
  loadCharacter,
  createNewCharacter,
}: UseCharacterPageEffectsArgs) {
  useEffect(() => {
    const trimmedName = characterName.trim();
    document.title = trimmedName ? `LCN | Sheet | ${trimmedName}` : "LCN | DnD Sheet Tool";

    return () => {
      document.title = "LCN | DnD Sheet Tool";
    };
  }, [characterName]);

  useEffect(() => {
    const characterId = searchParams.get("id");
    const isNew = searchParams.get("new");
    const importType = searchParams.get("import");

    if (importType === "pdf") {
      if (typeof window !== "undefined") {
        const characterDataStr = window.sessionStorage.getItem("pending-character-data");

        if (characterDataStr) {
          window.sessionStorage.removeItem("pending-character-data");

          try {
            const importedData = JSON.parse(characterDataStr) as Record<string, unknown>;
            createNewCharacter();
            setTimeout(() => {
              applyImportedData(setByPath, importedData);
            }, 100);
          } catch (error) {
            console.error("Failed to parse imported character data:", error);
            createNewCharacter();
          }
        } else {
          createNewCharacter();
        }
      }
    } else if (isNew === "true") {
      createNewCharacter();
    } else if (characterId) {
      loadCharacter(characterId);
    }
  }, [searchParams, loadCharacter, createNewCharacter, setByPath]);
}
