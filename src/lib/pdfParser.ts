import type { CharacterData } from "@/components/modals/PdfReviewModal";
import { GetSpellsFromTable } from "@/app/character/node-appwrite";
import { levenshteinDistance } from "./fuzzyMatch";

type SpellRecord = { name: string; [key: string]: unknown };
type FieldValue = string | number | boolean | null | undefined;
type PdfjsLib = typeof import("pdfjs-dist");

// Track if worker has been set up
let workerInitialized = false;
let pdfjsLib: PdfjsLib | null = null;

// Cache for spell database
let spellDatabase: SpellRecord[] | null = null;

/**
 * Load spell database from Appwrite
 */
async function loadSpellDatabase(): Promise<SpellRecord[]> {
  if (spellDatabase) {
    return spellDatabase;
  }
  
  try {
    const spells = await GetSpellsFromTable();
    spellDatabase = Array.isArray(spells) ? spells : [];
    return spellDatabase;
  } catch (error) {
    console.error('Failed to load spell database from Appwrite:', error);
    return [];
  }
}

/**
 * Find the best matching spell name from the database
 */
function findBestSpellMatch(inputName: string, spells: SpellRecord[]): string | null {
  const input = inputName.toLowerCase().trim();
  
  // First try exact match
  for (const spell of spells) {
    if (spell.name.toLowerCase() === input) {
      return spell.name;
    }
  }
  
  // Find closest match using Levenshtein distance
  let bestMatch: string | null = null;
  let bestDistance = Infinity;
  const threshold = Math.max(3, Math.floor(input.length * 0.3)); // Allow up to 30% difference
  
  for (const spell of spells) {
    const spellName = spell.name.toLowerCase();
    const distance = levenshteinDistance(input, spellName);
    
    if (distance < bestDistance && distance <= threshold) {
      bestDistance = distance;
      bestMatch = spell.name;
    }
  }
  
  return bestMatch;
}

/**
 * Correct spell names using fuzzy matching against the spell database
 */
async function correctSpellNames(spellNames: string[]): Promise<string[]> {
  const spells = await loadSpellDatabase();
  const correctedNames: string[] = [];
  
  for (const name of spellNames) {
    const corrected = findBestSpellMatch(name, spells);
    if (corrected) {
      correctedNames.push(corrected);
    } else {
      correctedNames.push(name); // Keep original if no match
    }
  }
  
  return correctedNames;
}

/**
 * Parse PDF file and extract character data using pdf.js to access form fields
 */
export async function parsePdfCharacterSheet(
  file: File
): Promise<CharacterData> {
  try {
    // Dynamically import pdfjs-dist
    if (!pdfjsLib) {
      pdfjsLib = await import("pdfjs-dist");
      
      // Set up worker only once
      if (!workerInitialized) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        workerInitialized = true;
      }
    }
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
    });
    const pdfDoc = await loadingTask.promise;
    
    // Extract form field data by iterating through pages and annotations
    const formFields: Record<string, FieldValue> = {};
    
    // Try to get form data from annotations on each page
    const numPages = pdfDoc.numPages;
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const annotations = await page.getAnnotations();
      
      for (const annotation of annotations) {
        if (annotation.fieldName && annotation.fieldValue !== undefined && annotation.fieldValue !== null) {
          formFields[annotation.fieldName] = annotation.fieldValue;
        }
      }
    }
    
    // Fallback: Try getFieldObjects if annotations didn't work
    if (Object.keys(formFields).length === 0) {
      const fieldObjects = await pdfDoc.getFieldObjects();
      
      if (fieldObjects) {
        for (const [fieldName, fieldData] of Object.entries(fieldObjects)) {
          if (Array.isArray(fieldData) && fieldData.length > 0) {
            const field = fieldData[0] as Record<string, unknown>;
            const value = (field["value"] ?? field["defaultValue"] ?? field["exportValue"] ?? "") as FieldValue;
            formFields[fieldName] = value;
          }
        }
      }
    }
    
    // Check if we found any fields
    if (Object.keys(formFields).length === 0) {
      console.warn('No form fields found in PDF. This may not be a fillable D&D character sheet.');
      throw new Error('This PDF does not contain form fields. Please use a fillable D&D character sheet.');
    }
    
    const characterData = extractCharacterDataFromFields(formFields);

    // Apply fuzzy matching to spell names
    if (characterData.spells && Array.isArray(characterData.spells)) {
      characterData.spells = await correctSpellNames(characterData.spells);
    }

    if (!characterData.name && !characterData.level) {
      console.warn('No character name or level found. Field mapping may not match this PDF format.');
    }

    return characterData;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF: " + (error as Error).message);
  }
}

/**
 * Extract character data from PDF form fields
 */
function extractCharacterDataFromFields(fields: Record<string, FieldValue>): CharacterData {
  const data: CharacterData = {};
  
  // Map common D&D 5e character sheet field names to our data structure
  // Note: Order matters - base scores should come before modifiers
  const fieldMappings: Record<string, { key: keyof CharacterData; type: 'string' | 'number'; priority?: number }> = {
    // Basic Info
    'CharacterName': { key: 'name', type: 'string', priority: 10 },
    'character-name': { key: 'name', type: 'string', priority: 10 },
    'CharacterName 2': { key: 'name', type: 'string', priority: 5 },
    'CharName': { key: 'name', type: 'string' },
    'PlayerName': { key: 'playerName', type: 'string' },
    'player-name': { key: 'playerName', type: 'string' },
    'ClassLevel': { key: 'class', type: 'string' },
    'class-level': { key: 'class', type: 'string' },
    'Class': { key: 'class', type: 'string' },
    'Race': { key: 'race', type: 'string' },
    'race': { key: 'race', type: 'string' },
    'Race ': { key: 'race', type: 'string' }, // Note: has trailing space
    'Background': { key: 'background', type: 'string' },
    'background': { key: 'background', type: 'string' },
    'Alignment': { key: 'alignment', type: 'string' },
    'alignment': { key: 'alignment', type: 'string' },
    'XP': { key: 'experiencePoints', type: 'number' },
    'xp': { key: 'experiencePoints', type: 'number' },
    'ExperiencePoints': { key: 'experiencePoints', type: 'number' },
    'Age': { key: 'age', type: 'string' },
    'Height': { key: 'height', type: 'string' },
    'Weight': { key: 'weight', type: 'string' },
    'Eyes': { key: 'eyes', type: 'string' },
    'Skin': { key: 'skin', type: 'string' },
    'Hair': { key: 'hair', type: 'string' },
    
    // Ability Scores - base scores have higher priority than modifiers
    'STR': { key: 'strength', type: 'number', priority: 10 },
    'str': { key: 'strength', type: 'number', priority: 10 },
    'Strength': { key: 'strength', type: 'number', priority: 10 },
    'STRmod': { key: 'strength', type: 'number', priority: 1 },
    'DEX': { key: 'dexterity', type: 'number', priority: 10 },
    'dex': { key: 'dexterity', type: 'number', priority: 10 },
    'Dexterity': { key: 'dexterity', type: 'number', priority: 10 },
    'DEXmod': { key: 'dexterity', type: 'number', priority: 1 },
    'DEXmod ': { key: 'dexterity', type: 'number', priority: 1 }, // Note: trailing space
    'CON': { key: 'constitution', type: 'number', priority: 10 },
    'con': { key: 'constitution', type: 'number', priority: 10 },
    'Constitution': { key: 'constitution', type: 'number', priority: 10 },
    'CONmod': { key: 'constitution', type: 'number', priority: 1 },
    'INT': { key: 'intelligence', type: 'number', priority: 10 },
    'int': { key: 'intelligence', type: 'number', priority: 10 },
    'Intelligence': { key: 'intelligence', type: 'number', priority: 10 },
    'INTmod': { key: 'intelligence', type: 'number', priority: 1 },
    'WIS': { key: 'wisdom', type: 'number', priority: 10 },
    'wis': { key: 'wisdom', type: 'number', priority: 10 },
    'Wisdom': { key: 'wisdom', type: 'number', priority: 10 },
    'WISmod': { key: 'wisdom', type: 'number', priority: 1 },
    'CHA': { key: 'charisma', type: 'number', priority: 10 },
    'cha': { key: 'charisma', type: 'number', priority: 10 },
    'Charisma': { key: 'charisma', type: 'number', priority: 10 },
    'CHAmod': { key: 'charisma', type: 'number', priority: 1 },
    'CHamod': { key: 'charisma', type: 'number', priority: 1 }, // Typo variant
    
    // Combat Stats
    'ProfBonus': { key: 'proficiencyBonus', type: 'number' },
    'prof-bonus': { key: 'proficiencyBonus', type: 'number' },
    'ProficiencyBonus': { key: 'proficiencyBonus', type: 'number' },
    'AC': { key: 'armorClass', type: 'number' },
    'ArmorClass': { key: 'armorClass', type: 'number' },
    'Initiative': { key: 'initiative', type: 'number' },
    'Init': { key: 'initiative', type: 'number' },
    'Speed': { key: 'speed', type: 'string' }, // Changed to string to handle "30ft" format
    'HPMax': { key: 'hitPointMaximum', type: 'number' },
    'HPCurrent': { key: 'currentHitPoints', type: 'number' },
    'HPTemp': { key: 'temporaryHitPoints', type: 'number' },
    'HD': { key: 'hitDice', type: 'string' },
    'HDTotal': { key: 'totalHitDice', type: 'string' },
    'HitDice': { key: 'hitDice', type: 'string' },
    'Passive': { key: 'passivePerception', type: 'number' },
    'PassivePerception': { key: 'passivePerception', type: 'number' },
    'Inspiration': { key: 'inspiration', type: 'number' },
    
    // Personality
    'PersonalityTraits': { key: 'personalityTraits', type: 'string' },
    'PersonalityTraits ': { key: 'personalityTraits', type: 'string' }, // Note: trailing space
    'Ideals': { key: 'ideals', type: 'string' },
    'Bonds': { key: 'bonds', type: 'string' },
    'Flaws': { key: 'flaws', type: 'string' },
    
    // Other
    'Allies': { key: 'allies', type: 'string' },
    'FactionName': { key: 'factionName', type: 'string' },
    'Backstory': { key: 'backstory', type: 'string' },
    'Treasure': { key: 'treasure', type: 'string' },
    'Equipment': { key: 'equipment', type: 'string' },
    'Features and Traits': { key: 'featuresAndTraits', type: 'string' },
    'Feat+Traits': { key: 'feats', type: 'string' },
    'AttacksSpellcasting': { key: 'attacksAndSpellcasting', type: 'string' },
    'ProficienciesLang': { key: 'proficienciesAndLanguages', type: 'string' },
    
    // Currency
    'CP': { key: 'copperPieces', type: 'number' },
    'SP': { key: 'silverPieces', type: 'number' },
    'EP': { key: 'electrumPieces', type: 'number' },
    'GP': { key: 'goldPieces', type: 'number' },
    'PP': { key: 'platinumPieces', type: 'number' },
    
    // Spellcasting - these fields may have different names in various PDFs
    'SpellcastingAbility': { key: 'spellcastingAbility', type: 'string', priority: 10 },
    'SpellcastingAbility 2': { key: 'spellcastingAbility', type: 'string', priority: 10 },
    'SpellcastingClass': { key: 'spellcastingAbility', type: 'string', priority: 10 },
    'SpellcastingClass 2': { key: 'spellcastingAbility', type: 'string', priority: 10 },
    'Spellcasting Ability': { key: 'spellcastingAbility', type: 'string', priority: 10 },
    'SpellSaveDC': { key: 'spellSaveDC', type: 'number', priority: 10 },
    'SpellSaveDC  2': { key: 'spellSaveDC', type: 'number', priority: 10 }, // Note: 2 spaces before the 2
    'SpellDC': { key: 'spellSaveDC', type: 'number', priority: 10 },
    'Spell Save DC': { key: 'spellSaveDC', type: 'number', priority: 10 },
    'SpellAtkBonus': { key: 'spellAttackBonus', type: 'number', priority: 10 },
    'SpellAtkBonus 2': { key: 'spellAttackBonus', type: 'number', priority: 10 },
    'SpellAttackBonus': { key: 'spellAttackBonus', type: 'number', priority: 10 },
    'Spell Attack Bonus': { key: 'spellAttackBonus', type: 'number', priority: 10 },
  };
  
  // Track what we've already set and with what priority
  const setPriorities: Record<string, number> = {};
  const spells: string[] = [];
  
  // Track spellcasting metadata field numbers to exclude from spell list
  const spellcastingMetadataFields = new Set<string>();
  
  // First pass: identify spellcasting metadata from numbered "Spells " fields
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    // Only process numbered "Spells " fields (like "Spells 1014"), not named fields
    if (fieldName.startsWith('Spells ') && /^Spells \d+$/.test(fieldName) && fieldValue) {
      const valueStr = String(fieldValue).trim().toLowerCase();
      // Check if this looks like spellcasting metadata
      if (['int', 'wis', 'cha', 'intelligence', 'wisdom', 'charisma'].includes(valueStr) ||
          /^\d+$/.test(valueStr) || // Pure numbers (DC or attack bonus)
          /^[+-]?\d+$/.test(valueStr)) { // Numbers with +/- (attack bonus)
        spellcastingMetadataFields.add(fieldName);
        
        // Try to map these to the appropriate fields (only if not already set from proper fields)
        if (['int', 'wis', 'cha', 'intelligence', 'wisdom', 'charisma'].includes(valueStr)) {
          if (!data.spellcastingAbility) data.spellcastingAbility = String(fieldValue).trim();
        } else {
          const num = parseInt(String(fieldValue), 10);
          if (!isNaN(num)) {
            // Typically DC is 8-30, attack bonus is 0-15
            if (num >= 8 && num <= 30 && !data.spellSaveDC) {
              data.spellSaveDC = num;
            } else if (num >= 0 && num <= 15 && !data.spellAttackBonus) {
              data.spellAttackBonus = num;
            }
          }
        }
      }
    }
  }
  
  // Create case-insensitive field mappings lookup
  const fieldMappingsLower: Record<string, { key: keyof CharacterData; type: 'string' | 'number'; priority?: number }> = {};
  for (const [key, value] of Object.entries(fieldMappings)) {
    fieldMappingsLower[key.toLowerCase()] = value;
  }

  // Extract data from form fields, respecting priority
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    // Check if this is a spell name field (not metadata) - only numbered "Spells " fields
    if (fieldName.startsWith('Spells ') && /^Spells \d+$/.test(fieldName) && fieldValue && !spellcastingMetadataFields.has(fieldName)) {
      const spellName = String(fieldValue).trim();
      // Filter out invalid spell entries - must look like actual spell names
      if (spellName && spellName.length > 2) {
        spells.push(spellName);
      }
      continue;
    }
    
    // Try exact match first, then case-insensitive
    const mapping = fieldMappings[fieldName] || fieldMappingsLower[fieldName.toLowerCase()];
    
    if (mapping && fieldValue) {
      const valueStr = String(fieldValue).trim();
      if (valueStr) {
        const currentPriority = setPriorities[mapping.key] || 0;
        const newPriority = mapping.priority || 5;
        
        // Only set if this field has higher priority or if not set yet
        if (newPriority >= currentPriority) {
          if (mapping.type === 'number') {
            const num = parseInt(valueStr, 10);
            if (!isNaN(num)) {
              // For ability scores, modifiers are typically -5 to +10, base scores are 1-30
              // If we're setting from a modifier field and the value looks like a modifier, skip it
              if (mapping.key && ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(String(mapping.key))) {
                // If value is between -5 and +10 and we're using a "mod" field, it's likely a modifier
                if (fieldName.toLowerCase().includes('mod') && num >= -5 && num <= 10) {
                  continue;
                }
              }
              data[mapping.key] = num;
              setPriorities[mapping.key] = newPriority;
            }
          } else {
            data[mapping.key] = valueStr;
            setPriorities[mapping.key] = newPriority;
          }
        }
      }
    }
  }
  
  // Add spells to character data if any were found
  if (spells.length > 0) {
    data.spells = spells;
  }
  
  // Post-processing: Clean up values
  // Extract numeric values from speed ("30ft" -> 30)
  if (data.speed) {
    const speedStr = String(data.speed);
    const speedMatch = speedStr.match(/\d+/);
    if (speedMatch) {
      data.speed = parseInt(speedMatch[0], 10);
    } else if (typeof data.speed === 'string') {
      // If no number found but it's a string, try to parse it anyway
      const num = parseInt(speedStr, 10);
      if (!isNaN(num)) {
        data.speed = num;
      }
    }
  }
  
  // Extract numeric value from AC ("13+1" -> 14, or just "13" -> 13)
  if (data.armorClass) {
    const acStr = String(data.armorClass);
    if (acStr.includes('+')) {
      // Calculate the sum if it's like "13+1"
      const parts = acStr.split('+').map(p => parseInt(p.trim(), 10));
      data.armorClass = parts.reduce((sum, n) => sum + (isNaN(n) ? 0 : n), 0);
    } else {
      const acMatch = acStr.match(/\d+/);
      if (acMatch) {
        data.armorClass = parseInt(acMatch[0], 10);
      }
    }
  }
  
  // Extract class, subclass, and level from ClassLevel field
  // Format: "Artificer Runic Dragoon, 8" -> class: "Artificer", subClass: "Runic Dragoon", level: 8
  if (data.class && typeof data.class === 'string') {
    const classStr = data.class;
    const parts = classStr.split(',').map(p => p.trim());
    
    if (parts.length >= 2) {
      // Has comma - extract level from after comma
      const levelMatch = parts[parts.length - 1].match(/(\d+)/);
      if (levelMatch && !data.level) {
        data.level = parseInt(levelMatch[0], 10);
      }
      
      // Everything before the last comma is class info
      const classInfo = parts.slice(0, -1).join(',').trim();
      const classWords = classInfo.split(/\s+/);
      
      if (classWords.length > 1) {
        // First word is base class, rest is subclass
        data.class = classWords[0];
        if (!data.subClass) {
          data.subClass = classWords.slice(1).join(' ');
        }
      } else {
        // Just one word, it's the class
        data.class = classInfo;
      }
    } else {
      // No comma - might have level in the string or just class name
      const levelMatch = classStr.match(/\d+/);
      if (levelMatch && !data.level) {
        data.level = parseInt(levelMatch[0], 10);
        // Remove level from class string
        data.class = classStr.replace(/[,\s]*\d+/, '').trim();
      }
      
      // Check if there's a subclass (multiple words)
      const classWords = data.class.split(/\s+/);
      if (classWords.length > 1) {
        data.class = classWords[0];
        if (!data.subClass) {
          data.subClass = classWords.slice(1).join(' ');
        }
      }
    }
  }
  
  // Parse proficiencies and languages to separate them
  if (data.proficienciesAndLanguages) {
    const text = String(data.proficienciesAndLanguages);
    const lines = text.split('\n');
    
    const languageKeywords = ['language', 'common', 'elvish', 'dwarvish', 'dwarfish', 'orcish', 'giant', 'gnomish', 'goblin', 'halfling', 'abyssal', 'celestial', 'draconic', 'deep speech', 'infernal', 'primordial', 'sylvan', 'undercommon'];
    const languages: string[] = [];
    const proficiencies: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const lowerLine = trimmed.toLowerCase();
      // Check if this line mentions languages
      if (lowerLine.includes('language') || languageKeywords.some(kw => lowerLine.includes(kw))) {
        languages.push(trimmed);
      } else {
        proficiencies.push(trimmed);
      }
    });
    
    if (languages.length > 0) {
      data.languages = languages.join('\n');
    }
    if (proficiencies.length > 0) {
      data.proficiencies = proficiencies.join('\n');
    }
  }
  
  // Parse inventory items for categorization
  const inventoryItems: Array<{
    name: string;
    quantity: number;
    category: "treasure" | "weapon" | "armor" | "consumable" | "tool" | "misc";
  }> = [];
  const weaponKeywords = ['sword', 'axe', 'bow', 'crossbow', 'dagger', 'mace', 'staff', 'spear', 'hammer', 'gun', 'pistol', 'rifle', 'lance', 'whip', 'flail', 'scimitar', 'rapier', 'longsword', 'shortsword', 'greatsword', 'battleaxe', 'handaxe', 'greataxe', 'club', 'quarterstaff', 'javelin', 'dart', 'sling', 'shortbow', 'longbow', 'light crossbow', 'heavy crossbow', 'blowgun', 'net', 'weapon', 'launcher'];
  const armorKeywords = ['armor', 'shield', 'breastplate', 'chainmail', 'plate', 'leather', 'studded', 'hide', 'scale mail', 'chain shirt'];
  const excludeKeywords = ['ring', 'amulet', 'boots', 'glove', 'cloak', 'hat', 'helm', 'spell', 'potion', 'scroll', 'wand'];
  
  // Parse AttacksSpellcasting field
  if (data.attacksAndSpellcasting) {
    const lines = String(data.attacksAndSpellcasting).split('\n');
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const lowerTrimmed = trimmed.toLowerCase();
      const isExcluded = excludeKeywords.some(kw => lowerTrimmed.includes(kw));
      const isWeapon = weaponKeywords.some(kw => lowerTrimmed.includes(kw));
      const isArmor = armorKeywords.some(kw => lowerTrimmed.includes(kw));
      
      // Extract quantity if present
      const qtyMatch = trimmed.match(/^(\d+)x?\s+(.+)/);
      const name = qtyMatch ? qtyMatch[2] : trimmed;
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      
      if (!isExcluded && (isWeapon || lowerTrimmed.match(/\d+d\d+|damage|\d+\/\d+ft/))) {
        inventoryItems.push({ name, quantity, category: 'weapon' });
      } else if (isArmor) {
        inventoryItems.push({ name, quantity, category: 'armor' });
      } else if (!isExcluded) {
        inventoryItems.push({ name, quantity, category: 'misc' });
      }
    });
  }
  
  // Parse Equipment field
  if (data.equipment) {
    const lines = String(data.equipment).split('\n');
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const lowerTrimmed = trimmed.toLowerCase();
      const isWeapon = weaponKeywords.some(kw => lowerTrimmed.includes(kw));
      const isArmor = armorKeywords.some(kw => lowerTrimmed.includes(kw));
      
      const qtyMatch = trimmed.match(/^(\d+)x?\s+(.+)/);
      const name = qtyMatch ? qtyMatch[2] : trimmed;
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      
      if (isWeapon) {
        inventoryItems.push({ name, quantity, category: 'weapon' });
      } else if (isArmor) {
        inventoryItems.push({ name, quantity, category: 'armor' });
      } else if (lowerTrimmed.includes('potion') || lowerTrimmed.includes('scroll')) {
        inventoryItems.push({ name, quantity, category: 'consumable' });
      } else if (lowerTrimmed.includes('tool')) {
        inventoryItems.push({ name, quantity, category: 'tool' });
      } else {
        inventoryItems.push({ name, quantity, category: 'misc' });
      }
    });
  }
  
  // Parse Treasure field
  if (data.treasure) {
    const lines = String(data.treasure).split('\n');
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const qtyMatch = trimmed.match(/^(\d+)x?\s+(.+)/);
      const name = qtyMatch ? qtyMatch[2] : trimmed;
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      
      inventoryItems.push({ name, quantity, category: 'treasure' });
    });
  }
  
  if (inventoryItems.length > 0) {
    data.inventoryItems = inventoryItems;
  }
  
  return data;
}

/**
 * DEPRECATED: Extract character data from PDF text (kept as fallback)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractCharacterData(text: string, lines: string[]): CharacterData {
  const data: CharacterData = {};

  // Clean up the text - remove extra spaces and normalize
  const cleanText = text.replace(/\s+/g, " ").trim();
  
  // Helper to find value on the same line or next line after a label
  const findValue = (label: string, lineIndex?: number): string | null => {
    // Try to find in specific line if provided
    if (lineIndex !== undefined && lines[lineIndex]) {
      const line = lines[lineIndex];
      const parts = line.split(label);
      if (parts.length > 1) {
        const value = parts[1].trim().split(/\s{2,}/)[0]; // Get first part after label
        if (value) return value;
      }
    }
    
    // Try to find in any line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(label.toLowerCase())) {
        // Check if value is on same line
        const parts = line.split(new RegExp(label, 'i'));
        if (parts.length > 1 && parts[1].trim()) {
          return parts[1].trim().split(/\s{2,}/)[0];
        }
        // Check next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.match(/^[A-Z\s]+:/)) {
            return nextLine.split(/\s{2,}/)[0];
          }
        }
      }
    }
    return null;
  };

  // Extract basic character info
  const nameValue = findValue('CharacterName') || findValue('Character Name');
  if (nameValue) data.name = nameValue.replace(/[^a-zA-Z\s'-]/g, '').trim();
  
  const playerValue = findValue('PlayerName') || findValue('Player Name');
  if (playerValue) data.playerName = playerValue.replace(/[^a-zA-Z\s'-]/g, '').trim();
  
  const classValue = findValue('ClassLevel') || findValue('Class & Level') || findValue('Class');
  if (classValue) {
    // Extract class name (before any numbers)
    const classOnly = classValue.match(/([A-Za-z\s]+)/);
    if (classOnly) data.class = classOnly[1].trim();
  }
  
  const raceValue = findValue('Race');
  if (raceValue) data.race = raceValue.replace(/[^a-zA-Z\s'-]/g, '').trim();
  
  const backgroundValue = findValue('Background');
  if (backgroundValue) data.background = backgroundValue.replace(/[^a-zA-Z\s'-]/g, '').trim();
  
  const alignmentValue = findValue('Alignment');
  if (alignmentValue) data.alignment = alignmentValue.replace(/[^a-zA-Z\s]/g, '').trim();
  
  // Extract numeric values
  const levelMatch = cleanText.match(/(?:Level|ClassLevel)[^\d]*(\d+)/i);
  if (levelMatch) data.level = parseInt(levelMatch[1], 10);
  
  const xpMatch = cleanText.match(/(?:Experience\s*Points?|ExperiencePoints)[^\d]*(\d+)/i);
  if (xpMatch) data.experiencePoints = parseInt(xpMatch[1], 10);

  // Extract Ability Scores - look for numbers following ability names
  // Try multiple patterns for each ability score
  const abilities = [
    { key: "strength", names: ["Strength", "STR"] },
    { key: "dexterity", names: ["Dexterity", "DEX"] },
    { key: "constitution", names: ["Constitution", "CON"] },
    { key: "intelligence", names: ["Intelligence", "INT"] },
    { key: "wisdom", names: ["Wisdom", "WIS"] },
    { key: "charisma", names: ["Charisma", "CHA"] },
  ];

  for (const ability of abilities) {
    for (const name of ability.names) {
      const match = cleanText.match(
        new RegExp(name + "\\s*[:]*\\s*(\\d{1,2})(?:\\D|$)", "i")
      );
      if (match) {
        data[ability.key] = parseInt(match[1], 10);
        break;
      }
    }
  }

  // Extract Proficiency Bonus
  const profMatch = cleanText.match(
    /(?:Proficiency\s*Bonus|ProficiencyBonus)\s*[:]*\s*[+]?(\d+)/i
  );
  if (profMatch) data.proficiencyBonus = parseInt(profMatch[1], 10);

  // Extract Armor Class
  const acMatch = cleanText.match(
    /(?:Armor\s*Class|ArmorClass|AC)\s*[:]*\s*(\d+)/i
  );
  if (acMatch) data.armorClass = parseInt(acMatch[1], 10);

  // Extract Initiative
  const initMatch = cleanText.match(/Initiative\s*[:]*\s*[+\-]?(\d+)/i);
  if (initMatch) data.initiative = parseInt(initMatch[1], 10);

  // Extract Speed
  const speedMatch = cleanText.match(/Speed\s*[:]*\s*(\d+)/i);
  if (speedMatch) data.speed = parseInt(speedMatch[1], 10);

  // Extract Hit Points
  const maxHpMatch = cleanText.match(
    /(?:Hit\s*Point\s*Maximum|HitPointMaximum|Max\s*HP)\s*[:]*\s*(\d+)/i
  );
  if (maxHpMatch) data.hitPointMaximum = parseInt(maxHpMatch[1], 10);

  const currentHpMatch = cleanText.match(
    /(?:Current\s*Hit\s*Points|CurrentHitPoints)\s*[:]*\s*(\d+)/i
  );
  if (currentHpMatch) data.currentHitPoints = parseInt(currentHpMatch[1], 10);

  const tempHpMatch = cleanText.match(
    /(?:Temporary\s*Hit\s*Points|TemporaryHitPoints|Temp\s*HP)\s*[:]*\s*(\d+)/i
  );
  if (tempHpMatch) data.temporaryHitPoints = parseInt(tempHpMatch[1], 10);

  // Extract Hit Dice
  const hitDiceMatch = cleanText.match(
    /(?:Total\s*)?Hit\s*Dice\s*[:]*\s*(\d+d\d+)/i
  );
  if (hitDiceMatch) data.hitDice = hitDiceMatch[1];

  // Extract Inspiration
  const inspirationMatch = cleanText.match(/Inspiration\s*[:]*\s*(\d)/i);
  if (inspirationMatch) data.inspiration = parseInt(inspirationMatch[1], 10);

  // Extract Passive Perception
  const passiveMatch = cleanText.match(
    /(?:Passive\s*(?:Wisdom\s*)?\(?Perception\)?)\s*[:]*\s*(\d+)/i
  );
  if (passiveMatch) data.passivePerception = parseInt(passiveMatch[1], 10);

  return data;
}