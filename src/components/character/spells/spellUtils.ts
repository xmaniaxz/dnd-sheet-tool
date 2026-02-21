export type Spell = {
  name: string;
  level: number;
  school: string;
  source?: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  classes?: string;
};

export type SpellSlots = {
  1?: { current: number; max: number };
  2?: { current: number; max: number };
  3?: { current: number; max: number };
  4?: { current: number; max: number };
  5?: { current: number; max: number };
  6?: { current: number; max: number };
  7?: { current: number; max: number };
  8?: { current: number; max: number };
  9?: { current: number; max: number };
};

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const SPELL_SLOT_TABLE: Record<string, Record<number, number[]>> = {
  full: {
    1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
    3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
    4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
    5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
    6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
    7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
    8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
    9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
    10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
    11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  },
  half: {
    1: [0, 0, 0, 0, 0],
    2: [2, 0, 0, 0, 0],
    3: [3, 0, 0, 0, 0],
    4: [3, 0, 0, 0, 0],
    5: [4, 2, 0, 0, 0],
    6: [4, 2, 0, 0, 0],
    7: [4, 3, 0, 0, 0],
    8: [4, 3, 0, 0, 0],
    9: [4, 3, 2, 0, 0],
    10: [4, 3, 2, 0, 0],
    11: [4, 3, 3, 0, 0],
    12: [4, 3, 3, 0, 0],
    13: [4, 3, 3, 1, 0],
    14: [4, 3, 3, 1, 0],
    15: [4, 3, 3, 2, 0],
    16: [4, 3, 3, 2, 0],
    17: [4, 3, 3, 3, 1],
    18: [4, 3, 3, 3, 1],
    19: [4, 3, 3, 3, 2],
    20: [4, 3, 3, 3, 2],
  },
  third: {
    1: [0, 0, 0, 0],
    2: [0, 0, 0, 0],
    3: [2, 0, 0, 0],
    4: [3, 0, 0, 0],
    5: [3, 0, 0, 0],
    6: [3, 0, 0, 0],
    7: [4, 2, 0, 0],
    8: [4, 2, 0, 0],
    9: [4, 2, 0, 0],
    10: [4, 3, 0, 0],
    11: [4, 3, 0, 0],
    12: [4, 3, 0, 0],
    13: [4, 3, 2, 0],
    14: [4, 3, 2, 0],
    15: [4, 3, 2, 0],
    16: [4, 3, 3, 0],
    17: [4, 3, 3, 0],
    18: [4, 3, 3, 0],
    19: [4, 3, 3, 1],
    20: [4, 3, 3, 1],
  },
};

const CLASS_TO_CASTER_TYPE: Record<string, string> = {
  wizard: "full",
  sorcerer: "full",
  cleric: "full",
  druid: "full",
  bard: "full",
  paladin: "half",
  ranger: "half",
  artificer: "half",
  "eldritch knight": "third",
  "arcane trickster": "third",
};

const STANDARD_SOURCE_KEY = "player's handbook";
const UNEARTHED_ARCANA_SOURCE_KEY = "unearthed arcana";
const SOURCE_LABELS: Record<string, string> = {
  [STANDARD_SOURCE_KEY]: "Player's Handbook",
  [UNEARTHED_ARCANA_SOURCE_KEY]: "Unearthed Arcana",
};

export function isUnearthedArcanaSource(source?: string): boolean {
  return /\bunearthed\s+arcana\b/i.test(source || "");
}

export function canonicalizeSource(source?: string): string {
  const trimmed = (source || "").trim();
  if (!trimmed) {
    return "";
  }

  const withoutMultiSource = trimmed.split("/")[0]?.trim() || trimmed;
  return withoutMultiSource;
}

export function normalizeSourceKey(source?: string): string {
  if (isUnearthedArcanaSource(source)) {
    return UNEARTHED_ARCANA_SOURCE_KEY;
  }

  const canonical = canonicalizeSource(source);
  const trimmed = canonical.toLowerCase();

  if (/^player'?s handbook$/i.test(canonical)) {
    return STANDARD_SOURCE_KEY;
  }

  return trimmed || STANDARD_SOURCE_KEY;
}

export function getSourceLabel(source?: string): string {
  const key = normalizeSourceKey(source);
  if (SOURCE_LABELS[key]) {
    return SOURCE_LABELS[key];
  }

  const trimmed = canonicalizeSource(source);
  return trimmed || SOURCE_LABELS[STANDARD_SOURCE_KEY];
}

export function getSpellRenderKey(spell: Spell): string {
  const level = isNaN(spell.level) ? 0 : spell.level;
  return `${spell.name}::${normalizeSourceKey(spell.source)}::${level}`;
}

export function summarizeComponents(components?: string): string {
  const raw = (components || "").toUpperCase();
  if (!raw.trim()) return "N/A";

  const parts: string[] = [];
  if (raw.includes("V")) parts.push("V");
  if (raw.includes("S")) parts.push("S");
  if (raw.includes("M")) parts.push("M");

  if (parts.length > 0) {
    return parts.join("/");
  }

  return raw.length > 12 ? `${raw.slice(0, 12)}…` : raw;
}

export function modifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function parseSpellcastingAbility(value?: string): AbilityKey | null {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("str") || normalized.includes("strength")) return "str";
  if (normalized.includes("dex") || normalized.includes("dexterity")) return "dex";
  if (normalized.includes("con") || normalized.includes("constitution")) return "con";
  if (normalized.includes("int") || normalized.includes("intelligence")) return "int";
  if (normalized.includes("wis") || normalized.includes("wisdom")) return "wis";
  if (normalized.includes("cha") || normalized.includes("charisma")) return "cha";

  return null;
}

export function inferSpellcastingAbility(characterClass: string, subClass: string): AbilityKey {
  const classLower = characterClass.toLowerCase();
  const subClassLower = (subClass || "").toLowerCase();

  if (["wizard", "artificer"].includes(classLower)) return "int";
  if (["cleric", "druid", "ranger"].includes(classLower)) return "wis";
  if (["bard", "paladin", "sorcerer", "warlock"].includes(classLower)) return "cha";
  if (classLower === "fighter" && (subClassLower.includes("eldritch knight") || subClassLower.includes("eldritch"))) return "int";
  if (classLower === "rogue" && (subClassLower.includes("arcane trickster") || subClassLower.includes("arcane") || subClassLower.includes("trickster"))) return "int";

  return "int";
}

export function abilityLabel(ability: AbilityKey): string {
  const labels: Record<AbilityKey, string> = {
    str: "STR",
    dex: "DEX",
    con: "CON",
    int: "INT",
    wis: "WIS",
    cha: "CHA",
  };

  return labels[ability];
}

export function calculateSpellSlots(
  characterClass: string,
  subClass: string,
  level: number,
): SpellSlots {
  const casterType = getCasterType(characterClass, subClass);

  if (!casterType) return {};

  const slots = SPELL_SLOT_TABLE[casterType]?.[Math.min(level, 20)] || [];
  const result: SpellSlots = {};

  slots.forEach((max, index) => {
    if (max > 0) {
      result[(index + 1) as keyof SpellSlots] = { current: max, max };
    }
  });

  return result;
}

export function getCasterType(characterClass: string, subClass: string): string | undefined {
  const classLower = characterClass.toLowerCase();
  const subClassLower = (subClass || "").toLowerCase();

  let casterType: string | undefined = CLASS_TO_CASTER_TYPE[classLower];

  if (classLower === "fighter") {
    casterType =
      subClassLower.includes("eldritch knight") ||
      subClassLower.includes("eldritch")
        ? "third"
        : undefined;
  } else if (classLower === "rogue") {
    casterType =
      subClassLower.includes("arcane trickster") ||
      subClassLower.includes("arcane") ||
      subClassLower.includes("trickster")
        ? "third"
        : undefined;
  }

  return casterType;
}