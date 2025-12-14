"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { characterService } from "@/lib/characterService";

export type Feat = {
  title: string;
  lines: string[];
};

export type Abilities = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

export type SaveProficiencies = {
  str: boolean;
  dex: boolean;
  con: boolean;
  int: boolean;
  wis: boolean;
  cha: boolean;
};

export type SkillProficiencies = {
  acrobatics: boolean;
  animalHandling: boolean;
  arcana: boolean;
  athletics: boolean;
  deception: boolean;
  history: boolean;
  insight: boolean;
  intimidation: boolean;
  investigation: boolean;
  medicine: boolean;
  nature: boolean;
  perception: boolean;
  performance: boolean;
  persuasion: boolean;
  religion: boolean;
  sleightOfHand: boolean;
  stealth: boolean;
  survival: boolean;
};

export type Identity = {
  playerName: string;
  characterName: string;
  race: string;
  class: string;
  subClass: string;
  background: string;
  alignment: string;
  experience: string;
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  appearance?: string;
  backstory?: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  allies?: string;
};

export type Item = {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  value?: { amount: number; currency: 'cp' | 'sp' | 'gp' | 'pp' };
  description?: string;
  equipped?: boolean;
  category: 'weapon' | 'armor' | 'consumable' | 'tool' | 'treasure' | 'misc';
};

export type Weapon = Item & {
  category: 'weapon';
  attackBonus?: number;
  damage: string;
  damageType?: 'slashing' | 'piercing' | 'bludgeoning' | 'magic' | 'fire' | 'cold' | 'lightning' | 'acid' | 'poison' | 'necrotic' | 'radiant' | 'psychic' | 'thunder' | 'force';
  properties?: string[];
  range?: { normal: number; long?: number };
};

export type DeathSaves = {
  successes: number;
  failures: number;
};

export type HitDice = {
  total: number;
  current: number;
  type: string;
};

export type Inventory = {
  weapons: Weapon[];
  items: Item[];
  coins: { copper: number; silver: number; gold: number; platinum: number };
  inventoryText: string;
};

export type CharacterData = {
  id?: string | null;
  sheetId?: string | null;
  profilePicture?: string | null;
  name: string;
  level: number;
  identity: Identity;
  hp: { current: number; max: number; temp?: number };
  abilities: Abilities;
  proficiencies: { saves: SaveProficiencies; skills: SkillProficiencies; expertise?: SkillProficiencies };
  ac?: number;
  proficiency?: number;
  passivePerception?: number;
  speed?: number;
  initiative?: number;
  inspiration?: boolean;
  deathSaves?: DeathSaves;
  hitDice?: HitDice;
  feats?: Feat[];
  languages?: string;
  notes?: string;
  inventory: Inventory;
  spells?: Record<string, unknown>;
};

type CharacterContextValue = {
  data: CharacterData;
  setData: (next: CharacterData | ((prev: CharacterData) => CharacterData)) => void;
  setByPath: (path: string, value: unknown) => void;
  reset: () => void;
  dirty: boolean;
  save: () => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
  loadCharacter: (documentId: string) => Promise<void>;
  createNewCharacter: () => Promise<void>;
};

const STORAGE_KEY = "character-data-v1";
const DOCUMENT_ID_KEY = "character-document-id"; // Store the current document ID

function proficiencyForLevel(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

const defaultData: CharacterData = {
  id: null,
  sheetId: null,
  profilePicture: null,
  name: "",
  level: 1,
  identity: {
    playerName: "",
    characterName: "",
    race: "",
    class: "",
    subClass: "",
    background: "",
    alignment: "",
    experience: "0",
  },
  hp: { current: 10, max: 10, temp: 0 },
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  proficiencies: {
    saves: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    skills: {
      acrobatics: false,
      animalHandling: false,
      arcana: false,
      athletics: false,
      deception: false,
      history: false,
      insight: false,
      intimidation: false,
      investigation: false,
      medicine: false,
      nature: false,
      perception: false,
      performance: false,
      persuasion: false,
      religion: false,
      sleightOfHand: false,
      stealth: false,
      survival: false,
    },
    expertise: {
      acrobatics: false,
      animalHandling: false,
      arcana: false,
      athletics: false,
      deception: false,
      history: false,
      insight: false,
      intimidation: false,
      investigation: false,
      medicine: false,
      nature: false,
      perception: false,
      performance: false,
      persuasion: false,
      religion: false,
      sleightOfHand: false,
      stealth: false,
      survival: false,
    },
  },
  ac: 10,
  proficiency: 2,
  passivePerception: 10,
  speed: 30,
  initiative: 0,
  inspiration: false,
  deathSaves: { successes: 0, failures: 0 },
  hitDice: { total: 1, current: 1, type: "d8" },
  feats: [],
  languages: "",
  notes: "",
  inventory: {
    weapons: [],
    items: [],
    coins: { copper: 0, silver: 0, gold: 0, platinum: 0 },
    inventoryText: "",
  },
  spells: {},
};

const CharacterSaveFileContext = createContext<CharacterContextValue | undefined>(
  undefined
);

function readFromStorage(): CharacterData {
  try {
    if (typeof window === "undefined") return defaultData;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed } as CharacterData;
  } catch {
    return defaultData;
  }
}

function writeToStorage(value: CharacterData) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function CharacterSaveFileProvider({ children }: { children: ReactNode }) {
  // Start with defaults on both server and first client paint to avoid hydration mismatch.
  const [data, setData] = useState<CharacterData>(defaultData);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Track the last snapshot written to storage so we don't clobber or mark dirty on initial load.
  const lastSavedRef = useRef<CharacterData | null>(null);
  const documentIdRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage first (as fallback), then attempt to load from Appwrite
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // First, check if we have a stored document ID
      const storedDocId = typeof window !== 'undefined' 
        ? window.localStorage.getItem(DOCUMENT_ID_KEY) 
        : null;

      if (storedDocId) {
        try {
          // Try to load from Appwrite
          const doc = await characterService.get(storedDocId);
          if (doc) {
            documentIdRef.current = doc.$id || storedDocId;
            const characterData: CharacterData = {
              id: doc.$id,
              sheetId: doc.sheetId,
              profilePicture: doc.profilePicture,
              name: doc.name,
              level: doc.level,
              identity: doc.identity,
              hp: doc.hp,
              abilities: doc.abilities,
              proficiencies: doc.proficiencies,
              ac: doc.ac,
              proficiency: doc.proficiency,
              passivePerception: doc.passivePerception,
              speed: doc.speed,
              initiative: doc.initiative,
              inspiration: doc.inspiration,
              deathSaves: doc.deathSaves,
              hitDice: doc.hitDice,
              feats: doc.feats,
              languages: doc.languages,
              notes: doc.notes,
              inventory: doc.inventory,
              spells: doc.spells,
            };
            setData(characterData);
            lastSavedRef.current = characterData;
            setDirty(false);
            setIsLoading(false);
            return;
          } else {
            // Document not found - clear the stored ID
            window.localStorage.removeItem(DOCUMENT_ID_KEY);
            documentIdRef.current = null;
          }
        } catch (error) {
          console.error("Failed to load from Appwrite, falling back to localStorage:", error);
          // Clear the document ID if it failed to load
          window.localStorage.removeItem(DOCUMENT_ID_KEY);
          documentIdRef.current = null;
        }
      }

      // Fallback to localStorage
      const loaded = readFromStorage();
      setData(loaded);
      lastSavedRef.current = loaded;
      setDirty(false);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Keep proficiency in sync with level (5e rules)
  useEffect(() => {
    const expected = proficiencyForLevel(data.level);
    if (data.proficiency !== expected) {
      setData((prev) => ({ ...prev, proficiency: expected }));
    }
    // Only depends on level to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.level]);

  // Mark as dirty when data changes (but not on initial load)
  useEffect(() => {
    if (!lastSavedRef.current || isLoading || isSaving) return;
    try {
      const prev = JSON.stringify(lastSavedRef.current);
      const next = JSON.stringify(data);
      if (prev === next) return; // no real change
    } catch {
      // if stringify fails for some reason, assume changed
    }
    
    // Write to localStorage immediately for offline capability
    writeToStorage(data);
    setDirty(true);

    // Auto-save disabled - user must manually save
    // // Auto-save to Appwrite after 2 seconds of inactivity
    // if (autoSaveTimerRef.current) {
    //   clearTimeout(autoSaveTimerRef.current);
    // }
    // 
    // autoSaveTimerRef.current = setTimeout(() => {
    //   if (documentIdRef.current) {
    //     // Call save directly inline to avoid dependency issue
    //     setIsSaving(true);
    //     const saveData = async () => {
    //       try {
    //         if (documentIdRef.current) {
    //           const updated = await characterService.update(documentIdRef.current, data);
    //           console.log("Character auto-saved:", updated);
    //           lastSavedRef.current = data;
    //           setDirty(false);
    //         }
    //       } catch (error) {
    //         console.error("Failed to auto-save character:", error);
    //       } finally {
    //         setIsSaving(false);
    //       }
    //     };
    //     saveData();
    //   } else {
    //     // No document ID yet - create new document
    //     setIsSaving(true);
    //     const saveData = async () => {
    //       try {
    //         const created = await characterService.create(data);
    //         console.log("Character created in Appwrite:", created);
    //         documentIdRef.current = created.$id || null;
    //         if (typeof window !== 'undefined' && created.$id) {
    //           window.localStorage.setItem(DOCUMENT_ID_KEY, created.$id);
    //           
    //           // Update URL to reflect the new document ID
    //           const url = new URL(window.location.href);
    //           if (url.searchParams.get('new') === 'true') {
    //             url.searchParams.delete('new');
    //             url.searchParams.set('id', created.$id);
    //             window.history.replaceState({}, '', url);
    //           }
    //         }
    //         lastSavedRef.current = data;
    //         setDirty(false);
    //       } catch (error) {
    //         console.error("Failed to auto-save (create) character:", error);
    //       } finally {
    //         setIsSaving(false);
    //       }
    //     };
    //     saveData();
    //   }
    // }, 2000);

  }, [data, isLoading, isSaving]);

  // Cleanup auto-save timer
  useEffect(() => {
    const timer = autoSaveTimerRef.current;
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const setByPath = useCallback((path: string, value: unknown) => {
    setData((prev) => {
      const next = structuredClone(prev);
      const segments = path.split(".");
      let cursor: unknown = next;
      for (let i = 0; i < segments.length - 1; i++) {
        const key = segments[i];
        if (typeof cursor !== "object" || cursor === null) {
          break;
        }
        const obj = cursor as Record<string, unknown>;
        if (obj[key] == null || typeof obj[key] !== "object") {
          obj[key] = {};
        }
        cursor = obj[key];
      }
      const lastKey = segments[segments.length - 1];
      if (typeof cursor === "object" && cursor !== null) {
        (cursor as Record<string, unknown>)[lastKey] = value;
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setData(defaultData);
    documentIdRef.current = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DOCUMENT_ID_KEY);
    }
    setDirty(false);
  }, []);

  const save = useCallback(async () => {
    if (isSaving) return; // Prevent concurrent saves
    
    setIsSaving(true);
    try {
      if (documentIdRef.current) {
        // Update existing document
        await characterService.update(documentIdRef.current, data);
        lastSavedRef.current = data;
        setDirty(false);
      } else {
        // Create new document
        const created = await characterService.create(data);
        documentIdRef.current = created.$id || null;
        if (typeof window !== 'undefined' && created.$id) {
          window.localStorage.setItem(DOCUMENT_ID_KEY, created.$id);
          
          // Update URL to reflect the new document ID
          const url = new URL(window.location.href);
          if (url.searchParams.get('new') === 'true') {
            url.searchParams.delete('new');
            url.searchParams.set('id', created.$id);
            window.history.replaceState({}, '', url);
          }
        }
        lastSavedRef.current = data;
        setDirty(false);
      }
    } catch (error) {
      console.error("Failed to save character:", error);
      // Keep dirty flag if save failed
    } finally {
      setIsSaving(false);
    }
  }, [data, isSaving]);

  const loadCharacter = useCallback(async (documentId: string) => {
    setIsLoading(true);
    try {
      const doc = await characterService.get(documentId);
      if (doc) {
        documentIdRef.current = doc.$id || documentId;
        if (typeof window !== 'undefined' && doc.$id) {
          window.localStorage.setItem(DOCUMENT_ID_KEY, doc.$id);
        }
        const characterData: CharacterData = {
          id: doc.$id,
          sheetId: doc.sheetId,
          profilePicture: doc.profilePicture,
          name: doc.name,
          level: doc.level,
          identity: doc.identity,
          hp: doc.hp,
          abilities: doc.abilities,
          proficiencies: doc.proficiencies,
          ac: doc.ac,
          proficiency: doc.proficiency,
          passivePerception: doc.passivePerception,
          speed: doc.speed,
          initiative: doc.initiative,
          inspiration: doc.inspiration,
          deathSaves: doc.deathSaves,
          hitDice: doc.hitDice,
          feats: doc.feats,
          languages: doc.languages,
          notes: doc.notes,
          inventory: doc.inventory,
          spells: doc.spells,
        };
        setData(characterData);
        lastSavedRef.current = characterData;
        setDirty(false);
      }
    } catch (error) {
      console.error("Failed to load character:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewCharacter = useCallback(async () => {
    setIsLoading(true);
    try {
      // Clear the document ID - this will be a truly new character
      documentIdRef.current = null;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DOCUMENT_ID_KEY);
        window.localStorage.removeItem(STORAGE_KEY);
      }
      
      // Reset to default data - don't create in Appwrite yet
      // It will auto-create on first save (when user makes changes)
      setData(defaultData);
      lastSavedRef.current = defaultData;
      setDirty(false);
      
    } catch (error) {
      console.error("Failed to initialize new character:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<CharacterContextValue>(
    () => ({ 
      data, 
      setData, 
      setByPath, 
      reset, 
      dirty, 
      save, 
      isSaving, 
      isLoading,
      loadCharacter,
      createNewCharacter,
    }),
    [data, setByPath, reset, dirty, save, isSaving, isLoading, loadCharacter, createNewCharacter]
  );

  return (
    <CharacterSaveFileContext.Provider value={value}>
      {children}
    </CharacterSaveFileContext.Provider>
  );
}

export function useCharacter() {
  const ctx = useContext(CharacterSaveFileContext);
  if (!ctx) throw new Error("useCharacter must be used within CharacterSaveFileProvider");
  return ctx;
}
