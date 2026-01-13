# Phase 2A - Days 8-9: Integration Testing & Privacy Enforcement

**Date:** January 13, 2026  
**Status:** In Progress

## Overview

Days 8-9 focus on enforcing privacy settings throughout the application, comprehensive integration testing, and ensuring all social features work together seamlessly.

## Day 8 Goals

### 1. Profile Visibility Enforcement
- [ ] Check profile visibility in public profile route
- [ ] Show "Private Profile" message to unauthorized users
- [ ] Show "Followers Only" message to non-followers
- [ ] Respect `profileVisibility` setting

### 2. Follow Request Controls
- [ ] Hide follow button when `allowFollowRequests = false`
- [ ] Show appropriate message when follow requests disabled
- [ ] Existing followers unaffected

### 3. Location Privacy
- [ ] Respect `showLocation` setting in profile display
- [ ] Filter saved locations by `showSavedLocations` setting
- [ ] Implement visibility checks for location viewers

### 4. Search Privacy Validation
- [ ] Verify users with `showInSearch = false` don't appear
- [ ] Test all search types respect privacy
- [ ] Validate autocomplete exclusions

## Day 9 Goals

### 1. Integration Testing
- [ ] Follow system + Search integration
- [ ] Privacy settings + Profile display
- [ ] Privacy settings + Search results
- [ ] Follow button + Privacy settings

### 2. Edge Cases
- [ ] Profile visibility changes while viewing
- [ ] Following/unfollowing privacy impact
- [ ] Search cache invalidation
- [ ] Permission changes mid-session

### 3. User Experience
- [ ] Clear messaging for private profiles
- [ ] Graceful degradation
- [ ] Helpful CTAs for blocked actions

### 4. Performance Testing
- [ ] Search query performance with privacy filters
- [ ] Profile load times with privacy checks
- [ ] Database query optimization

## Implementation Tasks

### Task 1: Private Profile Component
Create component to show when profile is private/restricted.

**File:** `src/components/profile/PrivateProfileMessage.tsx`

**Features:**
- Show lock icon
- Explain why profile is hidden
- Suggest following if "followers only"
- Show profile info that's allowed (username, avatar)

### Task 2: Profile Route Privacy Middleware
Update public profile page to check visibility.

**File:** `src/app/[username]/page.tsx`

**Logic:**
```typescript
1. Get profile user
2. Get current authenticated user
3. Check profileVisibility:
   - If "public": show full profile
   - If "followers": check if current user follows profile user
   - If "private": only show to profile owner
4. If not authorized: show PrivateProfileMessage
```

### Task 3: Follow Button Privacy
Hide/disable follow button based on settings.

**File:** `src/components/profile/FollowButton.tsx` (or where follow UI is)

**Logic:**
```typescript
if (!user.allowFollowRequests) {
  return <DisabledFollowMessage />
}
```

### Task 4: Location Visibility Enforcement
Filter saved locations by visibility setting.

**File:** Wherever locations are displayed on profile

**Logic:**
```typescript
// Check if viewer can see locations
const canViewLocations = 
  user.showSavedLocations === 'public' ||
  (user.showSavedLocations === 'followers' && isFollower) ||
  isOwnProfile;
```

### Task 5: Profile Location Display
Respect `showLocation` setting.

**File:** Profile display components

**Logic:**
```typescript
{user.showLocation && user.city && (
  <div>{user.city}, {user.country}</div>
)}
```

### Task 6: Integration Test Suite
Create comprehensive test scenarios.

**File:** `scripts/test-privacy-integration.sh`

**Tests:**
- Private profile access (authorized/unauthorized)
- Followers-only profile (follower/non-follower)
- Search visibility toggle
- Follow button visibility
- Location privacy levels

### Task 7: Privacy Enforcement Documentation
Document privacy checks and enforcement points.

**File:** `docs/features/PRIVACY_ENFORCEMENT.md`

## Test Scenarios

### Scenario 1: Private Profile
**Setup:**
- User A sets `profileVisibility = "private"`
- User B visits `/@userA`

**Expected:**
- User B sees "This profile is private" message
- User B sees username and avatar only
- User B cannot see bio, followers, following, locations

**Edge Case:**
- User A changes to private while User B viewing
- Should update on next page load/refresh

### Scenario 2: Followers-Only Profile
**Setup:**
- User A sets `profileVisibility = "followers"`
- User B (not following) visits `/@userA`
- User C (following) visits `/@userA`

**Expected:**
- User B sees "Follow to see full profile" message
- User C sees full profile
- Follow button visible (if `allowFollowRequests = true`)

### Scenario 3: Follow Requests Disabled
**Setup:**
- User A sets `allowFollowRequests = false`
- User B visits `/@userA`

**Expected:**
- No follow button shown
- Message: "This user is not accepting follow requests"
- Existing followers still see profile (if followers-only)

### Scenario 4: Hidden from Search
**Setup:**
- User A sets `showInSearch = false`
- User B searches for User A's username

**Expected:**
- User A not in search results
- User A not in autocomplete
- Direct URL `/@userA` still works (subject to visibility)

### Scenario 5: Location Privacy
**Setup:**
- User A sets `showSavedLocations = "followers"`
- User A has 10 saved locations
- User B (not following) visits `/@userA`
- User C (following) visits `/@userA`

**Expected:**
- User B doesn't see saved locations
- User C sees all saved locations
- User A sees their own locations always

### Scenario 6: Combined Privacy
**Setup:**
- User A sets:
  - `profileVisibility = "public"`
  - `showInSearch = false`
  - `showLocation = false`
  - `showSavedLocations = "private"`
  - `allowFollowRequests = true`

**Expected:**
- Public can view profile but not in search
- No location info shown
- No saved locations shown (even to followers)
- Follow button visible

## Database Queries

### Check if User Can View Profile
```typescript
async function canViewProfile(
  profileUserId: number,
  currentUserId: number | null,
  profileVisibility: string
): Promise<boolean> {
  // Public profiles always viewable
  if (profileVisibility === 'public') return true;
  
  // Not logged in can't view restricted profiles
  if (!currentUserId) return false;
  
  // Own profile always viewable
  if (profileUserId === currentUserId) return true;
  
  // Private profiles only viewable by owner
  if (profileVisibility === 'private') return false;
  
  // Followers-only: check if current user follows profile user
  if (profileVisibility === 'followers') {
    const isFollowing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: profileUserId,
        },
      },
    });
    return !!isFollowing;
  }
  
  return false;
}
```

### Check if User Can See Locations
```typescript
async function canViewLocations(
  profileUser: User,
  currentUserId: number | null,
  isFollowing: boolean
): Promise<boolean> {
  const { showSavedLocations, id: profileUserId } = profileUser;
  
  // Owner can always see their own
  if (currentUserId === profileUserId) return true;
  
  // Public locations
  if (showSavedLocations === 'public') return true;
  
  // Followers-only
  if (showSavedLocations === 'followers' && isFollowing) return true;
  
  // Private
  return false;
}
```

## API Updates

### Profile API Response
Filter response based on viewer permissions:

```typescript
// GET /api/v1/users/[username]
const response = {
  user: {
    username: user.username,
    avatar: user.avatar,
    // Conditionally include based on permissions
    ...(canViewProfile && {
      bio: user.bio,
      firstName: user.firstName,
      lastName: user.lastName,
      city: user.showLocation ? user.city : null,
      country: user.showLocation ? user.country : null,
    }),
  },
  permissions: {
    canViewProfile,
    canViewLocations,
    canFollow: user.allowFollowRequests,
    isFollowing,
    isOwnProfile,
  },
};
```

## UI Components to Update

1. **Public Profile Page** (`src/app/[username]/page.tsx`)
   - Add privacy checks
   - Conditional rendering

2. **Follow Button** (wherever it appears)
   - Check `allowFollowRequests`
   - Hide if false

3. **Profile Header** 
   - Conditionally show location
   - Respect `showLocation`

4. **Saved Locations Display**
   - Filter by `showSavedLocations`
   - Check viewer permissions

5. **Followers/Following Pages**
   - Check if viewer can see lists
   - May need privacy setting for this too (future)

## Success Criteria

### Day 8
- ✅ Private profiles show appropriate message
- ✅ Followers-only profiles work correctly
- ✅ Follow button respects `allowFollowRequests`
- ✅ Location privacy enforced
- ✅ Search privacy validated

### Day 9
- ✅ All privacy settings integrate smoothly
- ✅ Edge cases handled gracefully
- ✅ Clear user messaging
- ✅ No performance degradation
- ✅ Comprehensive documentation

## Metrics to Track

- Profile load time (with privacy checks)
- Search query time (with filters)
- Follow/unfollow success rate
- Privacy setting change frequency
- User engagement with privacy features

## Future Enhancements (Post Day 9)

- [ ] Block/mute functionality
- [ ] Custom privacy per saved location
- [ ] Privacy presets (templates)
- [ ] Privacy audit log
- [ ] Bulk privacy changes
- [ ] Privacy recommendations

## Documentation Deliverables

1. **PRIVACY_ENFORCEMENT.md** - How privacy is enforced
2. **INTEGRATION_TESTING.md** - Test scenarios and results
3. **PRIVACY_UX_GUIDE.md** - User-facing privacy documentation
4. **API_PERMISSIONS.md** - Permission checks in APIs

## Timeline

**Day 8 (Today):**
- Morning: Profile visibility enforcement
- Afternoon: Follow button and location privacy
- Evening: Testing and validation

**Day 9 (Tomorrow):**
- Morning: Integration testing
- Afternoon: Edge cases and polish
- Evening: Documentation and deployment

---

**Next Steps:** Start with Task 1 - Create PrivateProfileMessage component
