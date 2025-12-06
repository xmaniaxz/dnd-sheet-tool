# D&D Character Sheet Tool - Recent Updates

## Overview
Major improvements to the inventory system, weapon management, dice integration, and combat tracking features.

## New Features Added

### 1. Combat & Movement Stats
- **Speed**: Tracked in feet (default 30ft)
- **Initiative**: Displayed with DEX modifier auto-calculated
- **Inspiration**: Toggle button with visual indicator (✨)
- **Hit Dice**: Tracks current/total hit dice with die type (e.g., d8)
- **Death Saves**: Visual tracker for successes (3) and failures (3)

### 2. Enhanced Inventory System
The inventory has been completely overhauled with a proper item/weapon structure:

#### Weapon System
- **Name**: Weapon name
- **Damage**: Dice notation (e.g., "1d8", "2d6")
- **Damage Type**: slashing, piercing, bludgeoning, fire, cold, etc.
- **Attack Bonus**: Additional bonus to attack rolls
- **Properties**: Array of weapon properties (finesse, versatile, light, etc.)
- **Range**: Normal and long range for ranged weapons
- **Equipped**: Toggle to mark currently equipped weapons
- **Visual Cards**: Each weapon displays in a card with all stats

#### Item System
- **Name**: Item name
- **Quantity**: Stack size
- **Weight**: Optional weight tracking
- **Value**: Optional currency value
- **Description**: Item description
- **Category**: weapon, armor, consumable, tool, treasure, misc
- **Equipped**: Toggle for equipped items

### 3. Quick Roller Integration
New QuickRoller component that intelligently integrates with character stats:

#### Features
- **Initiative Rolls**: Auto-calculates DEX modifier + initiative bonus
- **Ability Checks**: One-click rolls for all 6 abilities with modifiers
- **Saving Throws**: Includes proficiency bonus when applicable
- **Weapon Attacks**: Auto-calculates:
  - Ability modifier (STR for melee, DEX for ranged/finesse)
  - Proficiency bonus
  - Weapon bonus
- **Damage Rolls**: Parses weapon damage dice and adds ability modifiers
- **Roll History**: Tracks last 10 rolls with full details
- **Last Roll Display**: Shows most recent roll prominently

### 4. Death Saves Component
- Visual tracker with 3 success and 3 failure circles
- Click to toggle in edit mode
- Color-coded (green for successes, red for failures)
- Reset button when any saves are marked

## Type System Updates

### New Types
```typescript
type Item = {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  value?: { amount: number; currency: 'cp' | 'sp' | 'gp' | 'pp' };
  description?: string;
  equipped?: boolean;
  category: 'weapon' | 'armor' | 'consumable' | 'tool' | 'treasure' | 'misc';
};

type Weapon = Item & {
  category: 'weapon';
  attackBonus?: number;
  damage: string;
  damageType?: string;
  properties?: string[];
  range?: { normal: number; long?: number };
};

type DeathSaves = {
  successes: number;
  failures: number;
};

type HitDice = {
  total: number;
  current: number;
  type: string; // e.g., "d8"
};
```

### Updated CharacterData
```typescript
export type CharacterData = {
  // ... existing fields
  speed?: number;
  initiative?: number;
  inspiration?: boolean;
  deathSaves?: DeathSaves;
  hitDice?: HitDice;
  inventory: {
    weapons: Weapon[];      // Changed from string[]
    items: Item[];          // NEW
    coins: { copper, silver, gold, platinum };
    inventoryText: string;
  };
};
```

## New Components

### `/src/components/character/DeathSaves.tsx`
Visual death save tracker with success/failure circles

### `/src/components/dice/QuickRoller.tsx`
Integrated dice roller with character stat awareness

## Modified Components

### `StatsRow.tsx`
- Added second row with Speed, Initiative, Hit Dice, Inspiration
- Initiative auto-calculates from DEX + initiative bonus
- Inspiration toggle button
- Hit Dice display with current/total

### `InventoryPanel.tsx`
- Complete rewrite with modal-based item/weapon adding
- Visual weapon cards showing all stats
- Item list with categories
- Edit mode for adding/removing items
- Equipped status indicators

### Character Page
- Added DeathSaves component below HP bar
- Integrated QuickRoller in Dice tab
- Separated 3D dice into "Advanced 3D Dice" section

## Data Migration Notes

**IMPORTANT**: Existing character data with old weapon format (string[]) will need migration:
- Old: `weapons: ["Longsword", "Shortbow"]`
- New: `weapons: [{ id, name, damage, category: 'weapon', ... }]`

The app will handle missing fields gracefully with defaults, but users may need to re-enter weapon details.

## PDF Import Capability

Yes, PDF import is **fully possible**! The fillable PDF fields are readable using PyPDF2.

### Implementation Plan (for later):
1. Use PyPDF2 on backend/client to read PDF form fields
2. Map PDF field names to CharacterData structure:
   - `CharacterName` → `identity.characterName`
   - `STR` → `abilities.str`
   - `Wpn Name` → `inventory.weapons[].name`
   - `Wpn1 Damage` → `inventory.weapons[0].damage`
   - etc.
3. Create import dialog with field mapping preview
4. Allow user to review and confirm before importing

### Example PDF Field Mapping:
```typescript
const pdfFieldMap = {
  'CharacterName': 'name',
  'STR': 'abilities.str',
  'DEX': 'abilities.dex',
  'HPMax': 'hp.max',
  'HPCurrent': 'hp.current',
  'AC': 'ac',
  'Speed': 'speed',
  'Initiative': 'initiative',
  'Inspiration': 'inspiration',
  // ... etc
};
```

## Testing

All changes have been tested:
- ✅ TypeScript compilation passes
- ✅ Build completes successfully
- ✅ No import errors
- ✅ Type safety maintained

## Future Enhancements

1. **PDF Import Feature**: Implement the PDF reader and field mapper
2. **Weapon Library**: Pre-built weapon database with D&D 5e weapons
3. **Item Templates**: Common items with pre-filled stats
4. **Encumbrance Tracking**: Auto-calculate weight from items
5. **Attack Roll Modals**: Enhanced UI for attack/damage with advantage options
6. **Critical Hit/Miss Handling**: Special handling for nat 20s and nat 1s
7. **Conditions Tracker**: Track status conditions (poisoned, stunned, etc.)
8. **Resource Management**: Track spell slots, ki points, rage uses, etc.
