# Team-Based Multi-User Setup Guide

## Overview

Your D&D Character Sheet Tool now supports multi-user access with team-based sharing. Users can:
- Create personal characters (private)
- Create team characters (shared with team members)
- Switch between personal and team contexts
- Access only characters they own or that belong to their team

## Database Setup

### 1. Update Appwrite Collection Attributes

Go to your Appwrite Console → Database → Your Database → Characters Collection

Add these new attributes:

#### Required New Attributes:
```
userId (String, 36 chars, Required)
- Description: Appwrite user ID of the character owner
- Used for access control

teamId (String, 36 chars, Optional)
- Description: Team ID for shared access
- Leave null for personal characters
```

### 2. Create Indexes

Create these indexes for optimal performance:

```
Index 1: userId_index
- Type: Key
- Attribute: userId (ASC)

Index 2: teamId_index  
- Type: Key
- Attribute: teamId (ASC)

Index 3: userId_teamId_index
- Type: Key
- Attributes: userId (ASC), teamId (ASC)
```

### 3. Set Collection Permissions

**Recommended Settings:**

**Collection-level:**
- Create: Any authenticated user
- Read: Users (authenticated)
- Update: Users (authenticated)  
- Delete: Users (authenticated)

**Document-level (Advanced):**
For more granular control, use document-level permissions with Appwrite Teams:
- Read: `user:{userId}` or `team:{teamId}/member`
- Update: `user:{userId}` or `team:{teamId}/member`
- Delete: `user:{userId}` only

## Migration Steps

### Step 1: Backup Existing Data

Before migrating, export all existing characters:

```javascript
// Run in browser console
const backup = localStorage.getItem('character-data-v1');
console.log('Backup:', backup);
// Copy and save this somewhere safe
```

### Step 2: Ensure Users Are Authenticated

Characters now require user authentication. Make sure users log in via Appwrite before creating/accessing characters.

### Step 3: Automatic Migration

The system automatically handles migration:
1. Existing localStorage data is preserved as fallback
2. On first save, a new Appwrite document is created with `userId`
3. Document ID is stored in localStorage for future access
4. Auto-save syncs changes to Appwrite every 2 seconds

### Step 4: Manual Migration (Optional)

To manually migrate existing localStorage data to Appwrite:

```javascript
import { characterService } from '@/lib/characterService';

// Get data from localStorage
const data = JSON.parse(localStorage.getItem('character-data-v1'));

// Create in Appwrite
const doc = await characterService.create(data);

// Save document ID
localStorage.setItem('character-document-id', doc.$id);
```

## Usage

### Personal Characters (Default)

By default, characters are created without a teamId (personal):

```typescript
import { useCharacter } from '@/context/CharacterSaveFileContext';

function MyComponent() {
  const { createNewCharacter } = useCharacter();
  
  // Creates a personal character
  await createNewCharacter();
}
```

### Team Characters

To work with team characters, set the team context:

```typescript
import { useTeam } from '@/context/TeamContext';
import { useCharacter } from '@/context/CharacterSaveFileContext';

function MyComponent() {
  const { setTeamId } = useTeam();
  const { createNewCharacter } = useCharacter();
  
  // Switch to team context
  setTeamId('my-team-id-123');
  
  // Now creates a team character
  await createNewCharacter();
}
```

### Switching Contexts

```typescript
import { useTeam } from '@/context/TeamContext';

function TeamSwitcher() {
  const { teamId, setTeamId } = useTeam();
  
  return (
    <div>
      <p>Current: {teamId || 'Personal'}</p>
      <button onClick={() => setTeamId('team-1')}>Team 1</button>
      <button onClick={() => setTeamId('team-2')}>Team 2</button>
      <button onClick={() => setTeamId(null)}>Personal</button>
    </div>
  );
}
```

### Listing Characters

```typescript
import { characterService } from '@/lib/characterService';

// List current context characters (respects teamId)
const characters = await characterService.list();

// List specific team
const teamChars = await characterService.listByTeam('team-id');

// List only personal characters
const personalChars = await characterService.listPersonal();
```

## Security Considerations

### Access Control

1. **User must be authenticated** - All operations require Appwrite authentication
2. **Owner access** - Users can always access their own characters
3. **Team access** - Users can access characters where `teamId` matches their current team
4. **No cross-team access** - Users cannot access characters from teams they're not in

### Data Privacy

- Personal characters (teamId = null) are only visible to the creator
- Team characters are visible to anyone with the teamId
- TeamId is stored in localStorage (can be read by any script on your domain)
- Consider implementing proper Appwrite Team management for production

## Team Management (Future Enhancement)

For production, integrate with Appwrite Teams:

```typescript
import { account, teams } from './appwrite';

// Create a team
const team = await teams.create(ID.unique(), 'My Campaign');

// Add members
await teams.createMembership(
  team.$id,
  ['member'],
  'user@example.com'
);

// List user's teams
const userTeams = await teams.list();

// Use team.$id as teamId in character service
```

## Troubleshooting

### Characters not showing up

1. Check user is authenticated: `account.get()`
2. Verify teamId context: `localStorage.getItem('current-team-id')`
3. Check Appwrite console for documents
4. Verify collection permissions allow read access

### Permission denied errors

1. Ensure user is authenticated
2. Check document userId matches current user
3. Verify teamId matches if accessing team characters
4. Review Appwrite collection permissions

### Auto-save not working

1. Check browser console for errors
2. Verify Appwrite credentials in .env.local
3. Ensure network connectivity
4. Check Appwrite collection update permissions

## API Reference

See `APPWRITE_DATABASE_SCHEMA.md` for complete schema documentation.

### characterService Methods

- `create(character, teamId?)` - Create new character
- `get(documentId)` - Get character by ID (with access control)
- `update(documentId, character)` - Update character (with access control)
- `delete(documentId)` - Delete character (with access control)
- `list(options?)` - List accessible characters
- `listByTeam(teamId, limit?)` - List team characters
- `listPersonal(limit?)` - List personal characters only

### Helper Functions

- `setCurrentTeamId(teamId)` - Set team context
- `getCurrentTeamId()` - Get current team ID
- `getCurrentUserId()` - Get authenticated user ID

## Next Steps

1. ✅ Set up Appwrite collection attributes and indexes
2. ✅ Configure collection permissions
3. ✅ Test authentication flow
4. ✅ Migrate existing characters (if any)
5. 🔄 Implement team selection UI
6. 🔄 Add team creation/management
7. 🔄 Integrate with Appwrite Teams API
