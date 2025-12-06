# Quick Setup Guide - Multi-User Character Storage

## 🚀 Quick Start (5 Minutes)

### Step 1: Update Appwrite Collection

In Appwrite Console → Database → Characters Collection, add:

```
Attribute: userId
Type: String
Size: 36
Required: Yes

Attribute: teamId
Type: String
Size: 36
Required: No
Default: null
```

### Step 2: Create Indexes

```
Index: userId_index
Attributes: userId (ASC)

Index: teamId_index
Attributes: teamId (ASC)
```

### Step 3: Test It

```typescript
import { useTeam } from '@/context/TeamContext';
import { characterService } from '@/lib/characterService';

// In your component:
const { setTeamId } = useTeam();

// Personal mode (default)
setTeamId(null);

// Team mode
setTeamId('my-team-123');

// List characters
const chars = await characterService.list();
```

## 🎯 Common Use Cases

### Personal Character
```typescript
// Ensure no team context
setTeamId(null);

// Create character (will be private)
const char = await characterService.create(characterData);
```

### Team Character
```typescript
// Set team context
setTeamId('campaign-party-1');

// Create character (will be shared with team)
const char = await characterService.create(characterData);
```

### Switch Teams
```typescript
// Component example
function TeamSwitcher() {
  const { teamId, setTeamId } = useTeam();
  
  return (
    <select value={teamId || ''} onChange={(e) => setTeamId(e.target.value || null)}>
      <option value="">Personal</option>
      <option value="team1">Campaign 1</option>
      <option value="team2">Campaign 2</option>
    </select>
  );
}
```

## 📋 Required Appwrite Permissions

**Collection Settings:**
- Create: Any authenticated user ✅
- Read: Users ✅
- Update: Users ✅
- Delete: Users ✅

## ⚠️ Important Notes

1. **Authentication Required**: Users must log in before creating characters
2. **Team ID Format**: Any string works as teamId (use Appwrite Teams API for production)
3. **Access Control**: Handled client-side (set server permissions for production)
4. **Auto-Save**: Characters auto-save to Appwrite every 2 seconds
5. **Offline Support**: localStorage used as fallback

## 🔍 Debugging

```typescript
// Check current user
import { account } from '@/lib/appwrite';
const user = await account.get();
console.log('User ID:', user.$id);

// Check team context
console.log('Team ID:', localStorage.getItem('current-team-id'));

// List accessible characters
const chars = await characterService.list();
console.log('Characters:', chars);
```

## 📚 Full Documentation

- **Schema Details**: See `APPWRITE_DATABASE_SCHEMA.md`
- **Setup Guide**: See `TEAM_SETUP_GUIDE.md`
- **Implementation**: See `MULTI_USER_IMPLEMENTATION_SUMMARY.md`

## ✅ Checklist

- [ ] Add userId attribute to Appwrite collection
- [ ] Add teamId attribute to Appwrite collection
- [ ] Create userId_index
- [ ] Create teamId_index
- [ ] Set collection permissions
- [ ] Test user authentication
- [ ] Test creating personal character
- [ ] Test creating team character
- [ ] Test listing characters
- [ ] Test switching teams

---

**Need Help?** Check the detailed guides or console logs for errors.
