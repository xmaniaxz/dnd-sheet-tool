# Appwrite Database Schema for Character Sheets

## Characters Collection

This collection stores all D&D character sheet data.

### Collection Settings
- **Collection ID**: (Create and note the ID)
- **Collection Name**: `characters`

### Required Columns/Attributes

| Column Name | Type | Size | Required | Array | Default | Description |
|------------|------|------|----------|-------|---------|-------------|
| `userId` | String | 255 | Yes | No | - | ID of the user who owns this character (auto-populated if null) |
| `teamId` | String | 255 | No | No | null | ID of team for shared access (future feature) |
| `name` | String | 255 | Yes | No | - | Character name |
| `level` | Integer | - | Yes | No | 1 | Character level (1-20) |
| `sheetId` | String | 255 | No | No | null | Optional sheet identifier |
| `profilePicture` | String | 2048 | No | No | null | URL to character profile picture |
| `identity` | String | 65535 | Yes | No | - | JSON: Player, race, class, background, alignment, etc. |
| `hp` | String | 2048 | Yes | No | - | JSON: { current, max, temp } |
| `abilities` | String | 2048 | Yes | No | - | JSON: { str, dex, con, int, wis, cha } |
| `proficiencies` | String | 16384 | Yes | No | - | JSON: { saves, skills, expertise } |
| `ac` | Integer | - | No | No | 10 | Armor Class |
| `proficiency` | Integer | - | No | No | 2 | Proficiency bonus |
| `passivePerception` | Integer | - | No | No | 10 | Passive Perception score |
| `speed` | Integer | - | No | No | 30 | Movement speed in feet |
| `initiative` | Integer | - | No | No | 0 | Initiative bonus |
| `inspiration` | Boolean | - | No | No | false | Has inspiration |
| `deathSaves` | String | 2048 | No | No | {} | JSON: { successes, failures } |
| `hitDice` | String | 2048 | No | No | {} | JSON: { total, current, type } |
| `feats` | String | 65535 | No | No | [] | JSON array: [{ title, lines[] }] |
| `languages` | String | 4096 | No | No | "" | Languages known |
| `notes` | String | 65535 | No | No | "" | Character notes |
| `inventory` | String | 65535 | Yes | No | - | JSON: { weapons[], items[], coins, inventoryText } |
| `spells` | String | 65535 | No | No | {} | JSON: { known[], prepared[], slots{} } |

### Indexes

Create these indexes for optimal query performance:

1. **userId_index**
   - Type: Key
   - Attributes: `userId` (ASC)
   - Description: Query characters by user

2. **teamId_index**
   - Type: Key
   - Attributes: `teamId` (ASC)
   - Description: Query characters by team (for shared access)

3. **userId_teamId_index**
   - Type: Key
   - Attributes: `userId` (ASC), `teamId` (ASC)
   - Description: Combined query optimization

4. **name_index**
   - Type: Key
   - Attributes: `name` (ASC)
   - Description: Search characters by name

5. **updated_at_index**
   - Type: Key
   - Attributes: `$updatedAt` (DESC)
   - Description: Sort by most recently updated

### Permissions

**Document-level permissions:**

1. **Create**: Any authenticated user
2. **Read**: 
   - Document creator: `user:[userId]`
   - Team members: `team:[teamId]/member` (when teamId is set)
3. **Update**: 
   - Document creator: `user:[userId]`
   - Team members: `team:[teamId]/member` (when teamId is set)
4. **Delete**: Document creator only: `user:[userId]`

## JSON Structure Details

### identity (String/JSON)
```json
{
  "playerName": "string",
  "characterName": "string",
  "race": "string",
  "class": "string",
  "subClass": "string",
  "background": "string",
  "alignment": "string",
  "experience": "string",
  "age": "string?",
  "height": "string?",
  "weight": "string?",
  "eyes": "string?",
  "skin": "string?",
  "hair": "string?",
  "appearance": "string?",
  "backstory": "string?",
  "personalityTraits": "string?",
  "ideals": "string?",
  "bonds": "string?",
  "flaws": "string?",
  "allies": "string?"
}
```

### hp (String/JSON)
```json
{
  "current": 25,
  "max": 30,
  "temp": 5
}
```

### abilities (String/JSON)
```json
{
  "str": 16,
  "dex": 14,
  "con": 15,
  "int": 10,
  "wis": 12,
  "cha": 8
}
```

### proficiencies (String/JSON)
```json
{
  "saves": {
    "str": true,
    "dex": false,
    "con": true,
    "int": false,
    "wis": false,
    "cha": false
  },
  "skills": {
    "acrobatics": false,
    "animalHandling": true,
    "arcana": false,
    "athletics": true,
    "deception": false,
    "history": false,
    "insight": false,
    "intimidation": true,
    "investigation": false,
    "medicine": false,
    "nature": false,
    "perception": true,
    "performance": false,
    "persuasion": false,
    "religion": false,
    "sleightOfHand": false,
    "stealth": false,
    "survival": true
  },
  "expertise": {
    "athletics": true,
    "perception": false
  }
}
```

### deathSaves (String/JSON)
```json
{
  "successes": 0,
  "failures": 0
}
```

### hitDice (String/JSON)
```json
{
  "total": 5,
  "current": 3,
  "type": "d10"
}
```

### feats (String/JSON Array)
```json
[
  {
    "title": "Great Weapon Master",
    "lines": [
      "Before making a melee attack, you can take -5 to attack for +10 damage",
      "When you score a critical hit or reduce to 0 HP, bonus action attack"
    ]
  }
]
```

### inventory (String/JSON)
```json
{
  "weapons": [
    {
      "id": "uuid",
      "name": "Greatsword",
      "quantity": 1,
      "weight": 6,
      "value": { "amount": 50, "currency": "gp" },
      "description": "A heavy two-handed sword",
      "equipped": true,
      "category": "weapon",
      "attackBonus": 5,
      "damage": "2d6",
      "damageType": "slashing",
      "properties": ["heavy", "two-handed"],
      "range": null
    }
  ],
  "items": [
    {
      "id": "uuid",
      "name": "Healing Potion",
      "quantity": 3,
      "weight": 0.5,
      "value": { "amount": 50, "currency": "gp" },
      "description": "Heals 2d4+2 HP",
      "equipped": false,
      "category": "consumable"
    }
  ],
  "coins": {
    "copper": 25,
    "silver": 10,
    "gold": 100,
    "platinum": 5
  },
  "inventoryText": "Additional notes about equipment"
}
```

### spells (String/JSON)
```json
{
  "known": ["Magic Missile", "Shield", "Fireball"],
  "prepared": ["Magic Missile", "Shield"],
  "slots": {
    "1": { "current": 4, "max": 4 },
    "2": { "current": 2, "max": 3 },
    "3": { "current": 1, "max": 3 }
  }
}
```

## Implementation Notes

### Auto-populate userId
In your character service or API, add logic to automatically set `userId` from the current authenticated user if it's null:

```typescript
// Before saving
if (!characterData.userId) {
  const currentUser = await account.get();
  characterData.userId = currentUser.$id;
}
```

### Team Access (Future Feature)
- When `teamId` is null: Character is private to the creator
- When `teamId` is set: Character is accessible to all team members
- Set up team-based permissions in Appwrite teams feature

### Migration from localStorage
Characters stored in localStorage should be migrated to Appwrite:
1. Check for existing Appwrite document by stored document ID
2. If not found, create new document with localStorage data
3. Store document ID in localStorage for future lookups
4. Keep localStorage as offline backup

## Size Recommendations

- **String (255)**: Short text fields (names, IDs)
- **String (2048)**: Medium fields (URLs, short JSON)
- **String (16384)**: Large JSON objects (proficiencies)
- **String (65535)**: Maximum size for complex data (inventory, feats, notes)

## Environment Variables Required

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_CHARACTERS_COLLECTION_ID=your-characters-collection-id
NEXT_PUBLIC_APPWRITE_API_KEY=your-api-key (for server-side operations)
```
