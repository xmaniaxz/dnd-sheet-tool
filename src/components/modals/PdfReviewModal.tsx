"use client";
import { useState, useEffect } from "react";
import Modal from "./Modal";
import AutoResizeTextarea from "@/components/inputs/AutoResizeTextarea";

export type CharacterData = {
  // Basic Info
  name?: string;
  level?: number;
  class?: string;
  race?: string;
  background?: string;
  alignment?: string;
  playerName?: string;
  experiencePoints?: number;
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  
  // Ability Scores
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  
  // Combat Stats
  proficiencyBonus?: number;
  armorClass?: number;
  initiative?: number;
  speed?: string | number;
  hitPointMaximum?: number;
  currentHitPoints?: number;
  temporaryHitPoints?: number;
  inspiration?: number;
  hitDice?: string;
  totalHitDice?: string;
  passivePerception?: number;
  
  // Spellcasting
  spells?: string[];
  spellcastingAbility?: string;
  spellSaveDC?: number;
  spellAttackBonus?: number;
  
  // Personality & Background
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  allies?: string;
  factionName?: string;
  backstory?: string;
  
  // Equipment & Features
  treasure?: string;
  equipment?: string;
  featuresAndTraits?: string;
  feats?: string;
  attacksAndSpellcasting?: string;
  proficienciesAndLanguages?: string;
  
  // Currency
  copperPieces?: number;
  silverPieces?: number;
  electrumPieces?: number;
  goldPieces?: number;
  platinumPieces?: number;
  
  // Notes
  notes?: string;
  
  // Proficiencies (separate from languages)
  proficiencies?: string;
  languages?: string;
  
  // Additional fields
  subClass?: string;
  appearance?: string;
  
  // Inventory items for categorization
  inventoryItems?: Array<{
    name: string;
    quantity: number;
    category: 'weapon' | 'armor' | 'consumable' | 'tool' | 'treasure' | 'misc';
  }>;
  
  [key: string]: string | number | string[] | Array<unknown> | undefined;
};

interface PdfReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CharacterData) => void;
  extractedData: CharacterData;
  filename?: string;
}

export default function PdfReviewModal({
  isOpen,
  onClose,
  onConfirm,
  extractedData,
  filename,
}: PdfReviewModalProps) {
  const [editedData, setEditedData] = useState<CharacterData>(extractedData);
  const [selectedSpells, setSelectedSpells] = useState<Set<string>>(new Set());
  const [inventoryItems, setInventoryItems] = useState<Array<{ name: string; quantity: number; category: 'weapon' | 'armor' | 'consumable' | 'tool' | 'treasure' | 'misc' }>>(extractedData.inventoryItems || []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setEditedData(extractedData);
      // Initialize all spells as selected by default
      if (extractedData.spells && Array.isArray(extractedData.spells)) {
        setSelectedSpells(new Set(extractedData.spells));
      }
      // Initialize inventory items
      if (extractedData.inventoryItems) {
        setInventoryItems(extractedData.inventoryItems);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [extractedData]);

  const handleChange = (key: string, value: string | number) => {
    setEditedData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const toggleSpell = (spell: string) => {
    setSelectedSpells((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(spell)) {
        newSet.delete(spell);
      } else {
        newSet.add(spell);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    // Only include selected spells and categorized inventory items
    const dataToSubmit = {
      ...editedData,
      spells: Array.from(selectedSpells),
      inventoryItems: inventoryItems,
    };
    onConfirm(dataToSubmit);
  };
  
  const updateItemCategory = (index: number, category: 'weapon' | 'armor' | 'consumable' | 'tool' | 'treasure' | 'misc') => {
    setInventoryItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], category };
      return newItems;
    });
  };

  const fields: Array<{ key: string; label: string; type?: string; section?: string; multiline?: boolean }> = [
    // Basic Info
    { key: "name", label: "Character Name", section: "Basic Info" },
    { key: "playerName", label: "Player Name", section: "Basic Info" },
    { key: "class", label: "Class", section: "Basic Info" },
    { key: "level", label: "Level", type: "number", section: "Basic Info" },
    { key: "race", label: "Race", section: "Basic Info" },
    { key: "background", label: "Background", section: "Basic Info" },
    { key: "alignment", label: "Alignment", section: "Basic Info" },
    { key: "experiencePoints", label: "Experience Points", type: "number", section: "Basic Info" },
    { key: "age", label: "Age", section: "Basic Info" },
    { key: "height", label: "Height", section: "Basic Info" },
    { key: "weight", label: "Weight", section: "Basic Info" },
    { key: "eyes", label: "Eyes", section: "Basic Info" },
    { key: "skin", label: "Skin", section: "Basic Info" },
    { key: "hair", label: "Hair", section: "Basic Info" },
    
    // Ability Scores
    { key: "strength", label: "Strength", type: "number", section: "Abilities" },
    { key: "dexterity", label: "Dexterity", type: "number", section: "Abilities" },
    { key: "constitution", label: "Constitution", type: "number", section: "Abilities" },
    { key: "intelligence", label: "Intelligence", type: "number", section: "Abilities" },
    { key: "wisdom", label: "Wisdom", type: "number", section: "Abilities" },
    { key: "charisma", label: "Charisma", type: "number", section: "Abilities" },
    
    // Combat Stats
    { key: "armorClass", label: "Armor Class", type: "number", section: "Combat" },
    { key: "speed", label: "Speed", section: "Combat" },
    { key: "inspiration", label: "Inspiration", type: "number", section: "Combat" },
    
    // Hit Points
    { key: "hitPointMaximum", label: "Max HP", type: "number", section: "Hit Points" },
    { key: "currentHitPoints", label: "Current HP", type: "number", section: "Hit Points" },
    { key: "temporaryHitPoints", label: "Temp HP", type: "number", section: "Hit Points" },
    { key: "hitDice", label: "Hit Dice", section: "Hit Points" },
    { key: "totalHitDice", label: "Total Hit Dice", section: "Hit Points" },
    
    // Spellcasting
    { key: "spellcastingAbility", label: "Spellcasting Ability", section: "Spellcasting" },
    
    // Currency
    { key: "copperPieces", label: "Copper", type: "number", section: "Currency" },
    { key: "silverPieces", label: "Silver", type: "number", section: "Currency" },
    { key: "electrumPieces", label: "Electrum", type: "number", section: "Currency" },
    { key: "goldPieces", label: "Gold", type: "number", section: "Currency" },
    { key: "platinumPieces", label: "Platinum", type: "number", section: "Currency" },
    
    // Personality (multiline)
    { key: "personalityTraits", label: "Personality Traits", section: "Personality", multiline: true },
    { key: "ideals", label: "Ideals", section: "Personality", multiline: true },
    { key: "bonds", label: "Bonds", section: "Personality", multiline: true },
    { key: "flaws", label: "Flaws", section: "Personality", multiline: true },
    { key: "backstory", label: "Backstory", section: "Personality", multiline: true },
    
    // Other Info (multiline)
    { key: "allies", label: "Allies & Organizations", section: "Other", multiline: true },
    { key: "factionName", label: "Faction Name", section: "Other" },
    { key: "equipment", label: "Equipment", section: "Other", multiline: true },
    { key: "treasure", label: "Treasure", section: "Other", multiline: true },
    { key: "featuresAndTraits", label: "Features & Traits", section: "Other", multiline: true },
    { key: "feats", label: "Feats", section: "Other", multiline: true },
    { key: "attacksAndSpellcasting", label: "Attacks & Spellcasting", section: "Other", multiline: true },
    { key: "proficienciesAndLanguages", label: "Proficiencies & Languages (Raw)", section: "Other", multiline: true },
    { key: "proficiencies", label: "Proficiencies", section: "Other", multiline: true },
    { key: "languages", label: "Languages", section: "Other", multiline: true },
    { key: "subClass", label: "Subclass", section: "Basic Info" },
    { key: "appearance", label: "Appearance", section: "Personality", multiline: true },
    { key: "notes", label: "Notes", section: "Other", multiline: true },
  ];
  
  const spellsList = Array.isArray(editedData.spells) ? editedData.spells : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Review Imported Character"
      message={`Review the data extracted from ${filename || "the PDF"}. You can edit any fields before creating the character.`}
      confirmText="Create Character"
      cancelText="Cancel"
      size="large"
    >
      <div className="max-h-[500px] overflow-y-auto space-y-4 mt-4 scrollbar-thin">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ key, label, type = "text", multiline }) => {
            return (
              <div key={key} className={multiline ? "md:col-span-2" : ""}>
                <label
                  htmlFor={key}
                  className="block text-sm font-medium mb-1"
                  style={{
                    color: "color-mix(in oklab, var(--accent) 80%, var(--text))",
                  }}
                >
                  {label}
                </label>
                {multiline ? (
                  <AutoResizeTextarea
                    id={key}
                    value={String(editedData[key] ?? "")}
                    onChange={(e) => handleChange(key, (e.target as HTMLTextAreaElement).value)}
                    className="panel"
                    style={{
                      borderColor: "color-mix(in oklab, var(--accent) 30%, var(--border))",
                    }}
                    minRows={3}
                  />
                ) : (
                  <input
                    id={key}
                    type={type}
                    value={String(editedData[key] ?? "")}
                    onChange={(e) =>
                      handleChange(
                        key,
                        type === "number" ? Number(e.target.value) : e.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border transition-colors panel"
                    style={{
                      borderColor: "color-mix(in oklab, var(--accent) 30%, var(--border))",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Inventory Section */}
        {inventoryItems.length > 0 && (
          <div className="mt-6">
            <h4
              className="text-md font-semibold mb-2"
              style={{
                color: "color-mix(in oklab, var(--accent) 80%, var(--text))",
              }}
            >
              Inventory Items ({inventoryItems.length} items)
            </h4>
            <p className="text-xs mb-3" style={{ color: "color-mix(in oklab, var(--accent) 60%, var(--text))" }}>
              Review and adjust the category for each item
            </p>
            <div
              className="p-3 rounded-lg border max-h-80 overflow-y-auto scrollbar-thin"
              style={{
                borderColor: "color-mix(in oklab, var(--accent) 30%, var(--border))",
                backgroundColor: "color-mix(in oklab, var(--accent) 5%, var(--bg))",
              }}
            >
              <div className="space-y-2">
                {inventoryItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded"
                    style={{
                      backgroundColor: "color-mix(in oklab, var(--accent) 8%, transparent)",
                    }}
                  >
                    <span
                      className="text-sm flex-1"
                      style={{
                        color: "color-mix(in oklab, var(--accent) 80%, var(--text))",
                      }}
                    >
                      {item.name} {item.quantity > 1 && `(${item.quantity}x)`}
                    </span>
                    <select
                      value={item.category}
                      onChange={(e) => updateItemCategory(index, e.target.value as 'weapon' | 'armor' | 'consumable' | 'tool' | 'treasure' | 'misc')}
                      className="text-xs px-2 py-1 rounded-lg panel-subtle border hover:border-(--accent)/50 transition-all focus:outline-none focus:border-(--accent)"
                    >
                      <option value="weapon">Weapon</option>
                      <option value="armor">Armor</option>
                      <option value="consumable">Consumable</option>
                      <option value="tool">Tool</option>
                      <option value="treasure">Treasure</option>
                      <option value="misc">Misc</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Spells Section */}
        {spellsList.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h4
                className="text-md font-semibold"
                style={{
                  color: "color-mix(in oklab, var(--accent) 90%, var(--text))",
                }}
              >
                Spells ({selectedSpells.size} of {spellsList.length} selected)
              </h4>
              <button
                type="button"
                onClick={() => {
                  if (selectedSpells.size === spellsList.length) {
                    setSelectedSpells(new Set());
                  } else {
                    setSelectedSpells(new Set(spellsList));
                  }
                }}
                className="text-xs px-3 py-1 rounded transition-colors"
                style={{
                  color: "color-mix(in oklab, var(--accent) 80%, var(--text))",
                  borderColor: "color-mix(in oklab, var(--accent) 40%, var(--border))",
                  border: "1px solid",
                }}
              >
                {selectedSpells.size === spellsList.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div
              className="p-3 rounded-lg border max-h-60 overflow-y-auto scrollbar-thin"
              style={{
                borderColor: "color-mix(in oklab, var(--accent) 30%, var(--border))",
                backgroundColor: "color-mix(in oklab, var(--accent) 5%, var(--bg))",
              }}
            >
              <div className="space-y-2">
                {spellsList.map((spell: string, index: number) => (
                  <label
                    key={index}
                    className="flex items-center gap-2 cursor-pointer hover:bg-opacity-50 p-1 rounded transition-colors"
                    style={{
                      backgroundColor: selectedSpells.has(spell) 
                        ? "color-mix(in oklab, var(--accent) 10%, transparent)"
                        : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpells.has(spell)}
                      onChange={() => toggleSpell(spell)}
                      className="w-4 h-4 rounded"
                      style={{
                        accentColor: "var(--accent)",
                      }}
                    />
                    <span
                      className="text-sm flex-1"
                      style={{
                        color: "color-mix(in oklab, var(--accent) 80%, var(--text))",
                      }}
                    >
                      {spell}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
