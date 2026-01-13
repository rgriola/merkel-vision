# Privacy & Visibility Settings

**Phase 2A - Day 7**: User privacy controls and visibility management

## Overview

Comprehensive privacy settings system that gives users control over their profile visibility, search appearance, location information, and social interactions.

## Database Schema Changes

### New Privacy Fields in User Model

Added to `prisma/schema.prisma`:

```prisma
// Privacy Settings
profileVisibility       String   @default("public") // public, followers, private
showInSearch            Boolean  @default(true)
showLocation            Boolean  @default(true)
showSavedLocations      String   @default("public") // public, followers, private
allowFollowRequests     Boolean  @default(true)
```

**Applied via:** `npx prisma db push`

## Privacy Settings

### 1. Profile Visibility

Controls who can view the user's profile page.

**Options:**
- 🌍 **Public**: Anyone can view the profile
- 👥 **Followers Only**: Only approved followers can view
- 🔒 **Private**: Only the user can view their own profile

**Default:** Public

**Impact:**
- Affects access to `/@username` profile page
- Controls visibility of bio, avatar, banner
- Determines who sees follower/following lists

### 2. Show in Search Results

Controls whether the user appears in search results.

**Options:**
- ✅ **Enabled**: User appears in all search types
- ❌ **Disabled**: User hidden from search (but direct profile URL still works if visibility allows)

**Default:** Enabled

**Impact:**
- Username search results
- Bio keyword search
- Geographic search
- Autocomplete suggestions

**Note:** Users can still be found via direct profile URL (`/@username`)

### 3. Show Location on Profile

Controls visibility of city/country information.

**Options:**
- ✅ **Enabled**: City and country displayed on public profile
- ❌ **Disabled**: Location information hidden from profile

**Default:** Enabled

**Impact:**
- Profile page location display
- Geographic search results (user still searchable by location, but location not shown)

### 4. Saved Locations Visibility

Controls who can see the user's saved map locations.

**Options:**
- 🌍 **Public**: Anyone can see saved locations
- 👥 **Followers Only**: Only followers can see
- 🔒 **Private**: Only the user can see their saves

**Default:** Public

**Impact:**
- Map marker visibility (future implementation)
- Location sharing with others
- Discovery of shared locations

### 5. Allow Follow Requests

Controls whether others can send follow requests.

**Options:**
- ✅ **Enabled**: Others can follow/request to follow
- ❌ **Disabled**: Follow button hidden, no new followers

**Default:** Enabled

**Impact:**
- Visibility of follow button on profile
- Ability to receive new followers
- Existing followers remain unaffected

## UI Components

### PrivacySettingsPanel Component

**File:** `src/components/profile/PrivacySettingsPanel.tsx`

**Features:**
- Two card sections: Profile Visibility & Location Privacy
- Dropdown selects for visibility levels
- Toggle switches for boolean settings
- Privacy summary card showing current settings
- Save button with loading state
- Real-time updates

**User Experience:**
1. User navigates to Profile Settings → Privacy tab
2. Adjusts privacy settings with intuitive controls
3. Sees summary of current privacy configuration
4. Clicks "Save Privacy Settings"
5. Receives confirmation toast

**Visual Indicators:**
- 🌍 Globe icon = Public
- 👥 Users icon = Followers Only
- 🔒 Lock icon = Private
- Color-coded badges in summary

### Profile Settings Integration

**File:** `src/app/profile/page.tsx`

**Changes:**
- Added 4th tab: "Privacy" (alongside Account, Security, Preferences)
- Lock icon for Privacy tab
- Renders PrivacySettingsPanel component

**Tab Layout:**
- Account (User icon)
- **Privacy** (Lock icon) ← NEW
- Security (Shield icon)
- Preferences (Settings icon)

## API Endpoints

### GET /api/v1/users/me

Get current user's full profile including privacy settings.

**Response:**
```json
{
  "user": {
    "id": 2,
    "username": "rodczaro",
    "email": "user@example.com",
    "firstName": "Richard",
    "lastName": "Griola",
    "avatar": "https://...",
    "bio": "...",
    "city": "New York",
    "country": "USA",
    "profileVisibility": "public",
    "showInSearch": true,
    "showLocation": true,
    "showSavedLocations": "public",
    "allowFollowRequests": true,
    "createdAt": "2026-01-13T...",
    "updatedAt": "2026-01-13T..."
  }
}
```

### PATCH /api/v1/users/me

Update current user's profile and privacy settings.

**Request Body:**
```json
{
  "profileVisibility": "followers",
  "showInSearch": false,
  "showLocation": true,
  "showSavedLocations": "private",
  "allowFollowRequests": true
}
```

**Allowed Fields:**
- Profile: `firstName`, `lastName`, `bio`, `city`, `country`
- Preferences: `language`, `timezone`, `emailNotifications`
- Privacy: All 5 privacy settings

**Validation:**
- `profileVisibility`: Must be "public", "followers", or "private"
- `showSavedLocations`: Must be "public", "followers", or "private"
- Booleans: `showInSearch`, `showLocation`, `allowFollowRequests`

**Response:** Updated user object

## Search Integration

### Privacy-Aware Search

Updated `src/lib/search-utils.ts` to respect privacy settings:

**Username Search:**
```sql
WHERE username ILIKE '%query%'
  AND "deletedAt" IS NULL
  AND "showInSearch" = true  -- NEW
```

**Bio Search:**
```sql
WHERE to_tsvector('english', COALESCE(bio, '')) @@ to_tsquery(...)
  AND "deletedAt" IS NULL
  AND "showInSearch" = true  -- NEW
```

**Geographic Search:**
```typescript
const where: Prisma.UserWhereInput = {
  deletedAt: null,
  showInSearch: true,  // NEW
  OR: [/* city/country filters */]
};
```

**Impact:**
- Users who disable "Show in Search" don't appear in any search results
- Autocomplete suggestions exclude these users
- Direct profile URLs still work (subject to profileVisibility)

## Privacy Levels Explained

### Public vs Followers vs Private

| Feature | Public | Followers | Private |
|---------|--------|-----------|---------|
| Profile page | ✅ Anyone | 👥 Followers only | 🔒 Only you |
| Bio visible | ✅ | 👥 | 🔒 |
| Avatar/Banner | ✅ | 👥 | 🔒 |
| Follower list | ✅ | 👥 | 🔒 |
| Following list | ✅ | 👥 | 🔒 |
| Saved locations | Based on `showSavedLocations` setting | | |

### Search Visibility vs Profile Visibility

**Important distinction:**

- **Search Visibility** (`showInSearch`): Controls search results appearance
- **Profile Visibility** (`profileVisibility`): Controls who can view profile when accessed directly

**Example:**
- User A: `showInSearch = false`, `profileVisibility = public`
  - Won't appear in searches
  - Anyone with `/@userA` link can view profile
  
- User B: `showInSearch = true`, `profileVisibility = private`
  - Appears in searches
  - Only User B can view their own profile page

## Use Cases

### 1. Privacy-Conscious User

**Settings:**
- Profile Visibility: Private
- Show in Search: false
- Show Location: false
- Saved Locations: Private
- Allow Follow Requests: false

**Result:** Maximum privacy, essentially invisible to others

### 2. Selective Sharing

**Settings:**
- Profile Visibility: Followers Only
- Show in Search: true
- Show Location: true
- Saved Locations: Followers
- Allow Follow Requests: true

**Result:** Discoverable, but content only visible to approved followers

### 3. Fully Public

**Settings:**
- Profile Visibility: Public
- Show in Search: true
- Show Location: true
- Saved Locations: Public
- Allow Follow Requests: true

**Result:** Maximum visibility (default for new users)

### 4. Location-Private Photographer

**Settings:**
- Profile Visibility: Public
- Show in Search: true
- Show Location: false
- Saved Locations: Private
- Allow Follow Requests: true

**Result:** Public profile, but secret spot locations protected

## Future Enhancements

### Short-term (Day 8-9)

- [ ] Enforce profile visibility in profile page route
- [ ] Show "Profile is private" message to non-followers
- [ ] Filter saved locations by visibility setting
- [ ] Hide follow button when `allowFollowRequests = false`

### Medium-term (Phase 2B)

- [ ] Blocking users
- [ ] Muting users
- [ ] Custom visibility per saved location
- [ ] Privacy presets (Public, Semi-Private, Private)
- [ ] Privacy audit log

### Long-term (Phase 3)

- [ ] Granular permissions (who can comment, tag, etc.)
- [ ] Temporary privacy modes
- [ ] Location-based privacy (hide profile in certain areas)
- [ ] Time-based privacy (schedule privacy changes)

## Testing

### Manual Testing Checklist

**Privacy Settings Panel:**
- [ ] Panel loads current settings
- [ ] Dropdowns change values
- [ ] Switches toggle correctly
- [ ] Summary updates in real-time
- [ ] Save button works
- [ ] Toast confirmation appears
- [ ] Settings persist after reload

**Search Behavior:**
- [ ] User with `showInSearch = false` doesn't appear in search
- [ ] User still accessible via direct profile URL
- [ ] Autocomplete excludes hidden users
- [ ] Geographic search respects setting

**API Endpoints:**
- [ ] GET /api/v1/users/me returns privacy fields
- [ ] PATCH /api/v1/users/me updates settings
- [ ] Invalid values rejected (400 error)
- [ ] Unauthorized requests rejected (401 error)

### Test Scenarios

**Scenario 1: Hide from Search**
1. User sets `showInSearch = false`
2. Save settings
3. Search for their username
4. Result: Not found in search
5. Navigate to `/@username` directly
6. Result: Profile still accessible (based on profileVisibility)

**Scenario 2: Private Profile**
1. User sets `profileVisibility = private`
2. Save settings
3. Another user visits `/@username`
4. Result: (Future) "This profile is private" message

**Scenario 3: Followers-Only Locations**
1. User sets `showSavedLocations = followers`
2. Save settings
3. Non-follower views profile
4. Result: (Future) Saved locations hidden

## Migration Notes

**For Production:**

```bash
# Apply schema changes
npx dotenv -e .env.production -- npx prisma db push

# Or create migration
npx prisma migrate dev --name add_privacy_settings
```

**Default Values:**
- All existing users get default privacy settings (most permissive)
- No breaking changes for existing functionality
- Users can opt-in to stricter privacy

**Backward Compatibility:**
- Search still works for users without explicit settings
- NULL values treated as defaults (public, enabled)

## Security Considerations

### Privacy Enforcement

**Current:**
- Search queries filter by `showInSearch`
- Database-level privacy check
- No user data leaked in responses

**Future:**
- Profile route middleware for visibility check
- API responses filter based on requester relationship
- Audit logs for privacy violations

### Edge Cases

1. **User changes username:** Privacy settings persist
2. **User deletes account:** Privacy settings deleted with user
3. **API access:** Same privacy rules apply
4. **Admin override:** (Future) Admin panel bypass with logging

## Related Documentation

- [Search System](./SEARCH_SYSTEM.md) - Search implementation
- [Follow System](../api/FOLLOW_SYSTEM.md) - Follower relationships
- [Phase 2A Planning](../planning/PHASE_2A_PLANNING.md) - Overall timeline

## Status

✅ **Day 7 - COMPLETE**

**Completed:**
- Database schema with 5 privacy fields
- PrivacySettingsPanel UI component
- Profile settings Privacy tab
- GET/PATCH /api/v1/users/me endpoint
- Privacy-aware search queries
- Visual summary of privacy settings
- Default values for all users

**Next:** Day 8-9 - Integration testing and privacy enforcement in profile pages

## Files Changed

```
Database:
  prisma/schema.prisma - Added 5 privacy fields

Components:
  src/components/profile/PrivacySettingsPanel.tsx (NEW - 345 lines)
  src/app/profile/page.tsx (Modified - added Privacy tab)

API:
  src/app/api/v1/users/me/route.ts (NEW - 154 lines)

Search:
  src/lib/search-utils.ts (Modified - privacy filters)

Documentation:
  docs/features/PRIVACY_SETTINGS.md (NEW - this file)
```
