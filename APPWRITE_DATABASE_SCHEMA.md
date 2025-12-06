# Appwrite Database Schema

## Characters Collection

**Collection ID:** `65ca5b76ce0faffe3521`

### Required Attributes

You need to add these attributes to your Appwrite collection:

| Attribute | Type | Size | Required | Array | Default | Description |
|-----------|------|------|----------|-------|---------|-------------|
| `userId` | String | 36 | Yes | No | - | Owner of the character (Appwrite user ID) |
| `teamId` | String | 36 | No | No | null | Team ID for shared access |
| `name` | String | 255 | Yes | No | - | Character name |
| `level` | Integer | - | Yes | No | 1 | Character level |
| `sheetId` | String | 255 | No | No | null | Optional sheet identifier |
| `profilePicture` | String | 2048 | No | No | null | URL to profile picture |
| `identity` | String | 65535 | Yes | No | - | JSON string of Identity object |
| `hp` | String | 1024 | Yes | No | - | JSON string of HP data |
| `abilities` | String | 1024 | Yes | No | - | JSON string of ability scores |
| `proficiencies` | String | 8192 | Yes | No | - | JSON string of proficiencies |
| `ac` | Integer | - | No | No | 10 | Armor Class |
| `proficiency` | Integer | - | No | No | 2 | Proficiency bonus |
| `passivePerception` | Integer | - | No | No | 10 | Passive Perception |
| `speed` | Integer | - | No | No | 30 | Movement speed |
| `initiative` | Integer | - | No | No | 0 | Initiative bonus |
| `inspiration` | Boolean | - | No | No | false | Has inspiration |
| `deathSaves` | String | 1024 | No | No | {} | JSON string of death saves |
| `hitDice` | String | 1024 | No | No | {} | JSON string of hit dice |
| `feats` | String | 16384 | No | No | [] | JSON string of feats array |
| `languages` | String | 2048 | No | No | "" | Languages known |
| `notes` | String | 65535 | No | No | "" | Character notes |
| `inventory` | String | 65535 | Yes | No | - | JSON string of inventory |
| `spells` | String | 65535 | No | No | {} | JSON string of spells |

### Indexes

Create these indexes for optimal query performance:

1. **userId_index**
   - Type: Key
   - Attributes: `userId` (ASC)
   - Description: Query characters by user

2. **teamId_index**
   - Type: Key
   - Attributes: `teamId` (ASC)
   - Description: Query characters by team

3. **userId_teamId_index**
   - Type: Key
   - Attributes: `userId` (ASC), `teamId` (ASC)
   - Description: Combined query for user and team filtering

4. **updated_at_index**
   - Type: Key
   - Attributes: `$updatedAt` (DESC)
   - Description: Sort by recent updates

### Permissions

Set up the following permissions in Appwrite:

**Document-level permissions (recommended):**

1. **Create**: Any authenticated user
2. **Read**: Document creator (`userId`) or team members
3. **Update**: Document creator (`userId`) or team members
4. **Delete**: Document creator (`userId`) only

**Example Permission Rules:**
- Read: `user:{userId}` or `team:{teamId}/member`
- Update: `user:{userId}` or `team:{teamId}/member`
- Delete: `user:{userId}`

## Team-Based Access Control

### How it works:

1. **Personal Characters**: Created without a `teamId`, accessible only to the creator
2. **Team Characters**: Created with a `teamId`, accessible to all team members
3. **Switching Teams**: Users can switch teams using `setCurrentTeamId(teamId)` function

### Usage Examples:

```typescript
import { characterService, setCurrentTeamId } from '@/lib/characterService';

// Set current team context
setCurrentTeamId('team-abc-123');

// Create a character for the current team
const character = await characterService.create(characterData);

// List team characters
const teamCharacters = await characterService.list();

// List personal characters only
const personalCharacters = await characterService.listPersonal();

// List specific team's characters
const otherTeamChars = await characterService.listByTeam('team-xyz-789');

// Switch to personal workspace (no team)
setCurrentTeamId(null);
```

## Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
```

## Migration from localStorage

Characters are automatically migrated from localStorage to Appwrite:

1. On first load, checks for existing Appwrite document
2. Falls back to localStorage if no document found
3. Auto-saves to Appwrite after 2 seconds of inactivity
4. Maintains localStorage as offline fallback

## Security Notes

- All operations require authentication
- Team access is controlled via `teamId` matching
- Users can only access characters they own or that belong to their current team
- Document IDs are stored in localStorage for persistence
