import {
  databases,
  DATABASE_ID,
  CHARACTERS_COLLECTION_ID,
  ID,
  Query,
  account,
} from "./appwrite";
import type { CharacterData } from "@/context/CharacterSaveFileContext";

export type CharacterDocument = CharacterData & {
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
  userId?: string;
  teamId?: string;
};

/**
 * Get the current user ID from Appwrite
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await account.get();
    return user.$id;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

/**
 * Get the current team ID (you can set this from localStorage or context)
 */
function getCurrentTeamId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("current-team-id");
}

/**
 * Set the current team ID
 */
export function setCurrentTeamId(teamId: string | null) {
  if (typeof window === "undefined") return;
  if (teamId) {
    window.localStorage.setItem("current-team-id", teamId);
  } else {
    window.localStorage.removeItem("current-team-id");
  }
}

/**
 * Character service for Appwrite database operations
 */
export const characterService = {
  /**
   * Create a new character document
   */
  async create(
    character: CharacterData,
    teamId?: string
  ): Promise<CharacterDocument> {
    try {
      const userId = await getCurrentUserId();
      const currentTeamId = teamId || getCurrentTeamId();

      if (!userId) {
        throw new Error("User must be authenticated to create a character");
      }

      // Prepare the document - remove id and sheetId as Appwrite uses $id
      const { id: _unusedId, sheetId: _unusedSheetId, ...characterWithoutIdFields } = character;
      void _unusedId;
      void _unusedSheetId;

      const doc = {
        ...characterWithoutIdFields,
        userId,
        teamId: currentTeamId,
        // Store complex objects as JSON strings if needed
        identity: JSON.stringify(character.identity),
        abilities: JSON.stringify(character.abilities),
        proficiencies: JSON.stringify(character.proficiencies),
        hp: JSON.stringify(character.hp),
        deathSaves: JSON.stringify(character.deathSaves || {}),
        hitDice: JSON.stringify(character.hitDice || {}),
        feats: JSON.stringify(character.feats || []),
        inventory: JSON.stringify(character.inventory),
        spells: JSON.stringify(character.spells || {}),
      };
      const response = await databases.createRow({
        databaseId: DATABASE_ID,
        tableId: CHARACTERS_COLLECTION_ID,
        data: doc,
        rowId: ID.unique(),
      });

      return parseCharacterDocument(response);
    } catch (error) {
      console.error("Failed to create character:", error);
      throw error;
    }
  },

  /**
   * Get a character by ID (with access control)
   */
  async get(documentId: string): Promise<CharacterDocument | null> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User must be authenticated to access characters");
      }

      const response = await databases.getRow({
        databaseId: DATABASE_ID,
        tableId: CHARACTERS_COLLECTION_ID,
        rowId: documentId,
      });

      // Verify user has access (either owns it or is in the same team)
      const doc = parseCharacterDocument(response);
      const currentTeamId = getCurrentTeamId();

      if (doc.userId !== userId && doc.teamId !== currentTeamId) {
        console.warn(
          "Access denied: user does not have access to this character"
        );
        return null;
      }

      return doc;
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err?.code !== 404 && !err?.message?.includes('could not be found')) {
        console.error("Failed to get character:", error);
      }
      return null;
    }
  },

  /**
   * Update an existing character (with access control)
   */
  async update(
    documentId: string,
    character: Partial<CharacterData>
  ): Promise<CharacterDocument> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User must be authenticated to update characters");
      }

      // First check if user has access
      const existing = await this.get(documentId);
      if (!existing) {
        throw new Error("Character not found or access denied");
      }

      // Remove id and sheetId fields as Appwrite uses $id
      const { id: _unusedId, sheetId: _unusedSheetId, ...characterWithoutIdFields } = character;
      void _unusedId;
      void _unusedSheetId;
      const doc: Record<string, unknown> = { ...characterWithoutIdFields };

      // Convert complex objects to JSON strings
      if (character.identity) doc.identity = JSON.stringify(character.identity);
      if (character.abilities)
        doc.abilities = JSON.stringify(character.abilities);
      if (character.proficiencies)
        doc.proficiencies = JSON.stringify(character.proficiencies);
      if (character.hp) doc.hp = JSON.stringify(character.hp);
      if (character.deathSaves)
        doc.deathSaves = JSON.stringify(character.deathSaves);
      if (character.hitDice) doc.hitDice = JSON.stringify(character.hitDice);
      if (character.feats) doc.feats = JSON.stringify(character.feats);
      if (character.inventory)
        doc.inventory = JSON.stringify(character.inventory);
      if (character.spells) doc.spells = JSON.stringify(character.spells);

      const response = await databases.updateRow({
        databaseId: DATABASE_ID,
        tableId: CHARACTERS_COLLECTION_ID,
        rowId: documentId,
        data: doc,
      });

      return parseCharacterDocument(response);
    } catch (error) {
      console.error("Failed to update character:", error);
      throw error;
    }
  },

  /**
   * Delete a character (with access control)
   */
  async delete(documentId: string): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User must be authenticated to delete characters");
      }

      // Check access first
      const existing = await this.get(documentId);
      if (!existing) {
        throw new Error("Character not found or access denied");
      }

      await databases.deleteRow({
        databaseId: DATABASE_ID,
        tableId: CHARACTERS_COLLECTION_ID,
        rowId: documentId,
      });
    } catch (error) {
      console.error("Failed to delete character:", error);
      throw error;
    }
  },

  /**
   * List characters accessible to the current user
   * Can filter by team or show user's own characters
   */
  async list(
    options: { teamId?: string; limit?: number } = {}
  ): Promise<CharacterDocument[]> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn("User not authenticated, cannot list characters");
        return [];
      }

      const { teamId, limit = 25 } = options;
      const currentTeamId = teamId || getCurrentTeamId();

      const queries = [Query.limit(limit), Query.orderDesc("$updatedAt")];

      // Filter by team if teamId is provided, otherwise show user's own characters
      if (currentTeamId) {
        queries.push(Query.equal("teamId", currentTeamId));
      } else {
        queries.push(Query.equal("userId", userId));
      }

      const response = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: CHARACTERS_COLLECTION_ID,
        queries,
      });
      // Parse and return the character documents
      if (response.rows && Array.isArray(response.rows)) {
        return response.rows.map(parseCharacterDocument);
      }
      return [];
    } catch (error) {
      console.error("Failed to list characters:", error);
      return [];
    }
  },

  /**
   * List all characters for a specific team
   */
  async listByTeam(teamId: string, limit = 25): Promise<CharacterDocument[]> {
    return this.list({ teamId, limit });
  },

  /**
   * List current user's personal characters (no team)
   */
  async listPersonal(limit = 25): Promise<CharacterDocument[]> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return [];
      }

      const response = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: CHARACTERS_COLLECTION_ID,
        queries: [
          Query.equal("userId", userId),
          Query.isNull("teamId"),
          Query.limit(limit),
          Query.orderDesc("$updatedAt"),
        ],
      });

      // Parse and return the character documents
      if (response.rows && Array.isArray(response.rows)) {
        return response.rows.map(parseCharacterDocument);
      }
      return [];
    } catch (error) {
      console.error("Failed to list personal characters:", error);
      return [];
    }
  },
};

/**
 * Parse a raw Appwrite document into CharacterDocument
 */
function parseCharacterDocument(doc: Record<string, unknown>): CharacterDocument {
  const get = <T>(key: string) => doc[key] as T;
  return {
    $id: get<string | undefined>("$id"),
    $createdAt: get<string | undefined>("$createdAt"),
    $updatedAt: get<string | undefined>("$updatedAt"),
    userId: get<string | undefined>("userId"),
    teamId: (get<string | null | undefined>("teamId") ?? null),
    id: get<string | undefined>("$id"),
    sheetId: get<string | null | undefined>("sheetId") ?? null,
    profilePicture: get<string | null | undefined>("profilePicture") ?? null,
    name: get<string>("name"),
    level: get<number>("level"),
    identity: typeof get<unknown>("identity") === "string"
      ? JSON.parse(get<string>("identity"))
      : (get<unknown>("identity") as CharacterData["identity"]),
    hp: typeof get<unknown>("hp") === "string"
      ? JSON.parse(get<string>("hp"))
      : (get<unknown>("hp") as CharacterData["hp"]),
    abilities: typeof get<unknown>("abilities") === "string"
      ? JSON.parse(get<string>("abilities"))
      : (get<unknown>("abilities") as CharacterData["abilities"]),
    proficiencies: typeof get<unknown>("proficiencies") === "string"
      ? JSON.parse(get<string>("proficiencies"))
      : (get<unknown>("proficiencies") as CharacterData["proficiencies"]),
    ac: get<number | undefined>("ac"),
    proficiency: get<number | undefined>("proficiency"),
    passivePerception: get<number | undefined>("passivePerception"),
    speed: get<number | undefined>("speed"),
    initiative: get<number | undefined>("initiative"),
    inspiration: get<number | undefined>("inspiration"),
    deathSaves: typeof get<unknown>("deathSaves") === "string"
      ? JSON.parse(get<string>("deathSaves"))
      : (get<unknown>("deathSaves") as CharacterData["deathSaves"]),
    hitDice: typeof get<unknown>("hitDice") === "string"
      ? JSON.parse(get<string>("hitDice"))
      : (get<unknown>("hitDice") as CharacterData["hitDice"]),
    feats: typeof get<unknown>("feats") === "string"
      ? JSON.parse(get<string>("feats"))
      : (get<unknown>("feats") as CharacterData["feats"]),
    languages: get<string[] | undefined>("languages"),
    notes: get<string | undefined>("notes"),
    inventory: typeof get<unknown>("inventory") === "string"
      ? JSON.parse(get<string>("inventory"))
      : (get<unknown>("inventory") as CharacterData["inventory"]),
    spells: typeof get<unknown>("spells") === "string"
      ? JSON.parse(get<string>("spells"))
      : (get<unknown>("spells") as CharacterData["spells"]),
  };
}
