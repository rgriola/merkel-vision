# Integration Testing Guide

**Status**: ✅ Complete (Day 9 - Phase 2A)  
**Date**: January 13, 2026  
**Related**: [Privacy Enforcement](../features/PRIVACY_ENFORCEMENT.md), [Day 8-9 Plan](../planning/PHASE_2A_DAY_8_9_PLAN.md)

---

## Overview

Integration testing validates that all privacy and social features work correctly together, handling edge cases and ensuring a smooth user experience across different scenarios.

### Testing Philosophy

**Test Layers:**
1. **Unit**: Individual functions (privacy checks, queries)
2. **Integration**: Features working together (privacy + follow + search)
3. **End-to-End**: User workflows (sign up → follow → view profile)

**Focus Areas:**
- ✅ Privacy settings enforcement
- ✅ Follow system integration
- ✅ Search privacy filtering
- ✅ Edge cases and error handling
- ✅ Performance and scalability

---

## Test Suite Overview

### Automated Tests

**Script**: `scripts/test-privacy-integration.sh`

**Test Suites:**
1. Profile Visibility (3 tests)
2. Search Privacy (2 tests)
3. Follow System Integration (3 tests)
4. Location Privacy (3 tests)
5. Combined Privacy Scenarios (3 tests)
6. Edge Cases (3 tests)
7. API Endpoints (4 tests)
8. Performance (2 tests)

**Total**: 23 automated tests

### Manual Tests

Some scenarios require:
- Authenticated sessions
- Specific user data configurations
- UI interaction verification

---

## Running Tests

### Prerequisites

```bash
# 1. Start development server
npm run dev

# 2. Ensure test data exists
# Create test users with different privacy settings
```

### Run All Integration Tests

```bash
# Default (localhost:3000)
./scripts/test-privacy-integration.sh

# Custom URL
BASE_URL=https://your-domain.com ./scripts/test-privacy-integration.sh
```

### Run Specific Test Suites

```bash
# Test only profile visibility
./scripts/test-privacy-integration.sh | grep -A 20 "TEST SUITE 1"

# Test only search privacy
./scripts/test-privacy-integration.sh | grep -A 15 "TEST SUITE 2"

# Test performance
./scripts/test-privacy-integration.sh | grep -A 10 "TEST SUITE 8"
```

---

## Test Scenarios

### Scenario 1: Private Profile Access

**Setup:**
```typescript
// User A settings
{
  username: "private_user",
  profileVisibility: "private",
  showInSearch: true,  // Can be found, but profile hidden
  allowFollowRequests: true
}
```

**Test Steps:**
1. User B (authenticated) visits `/@private_user`
2. Guest (unauthenticated) visits `/@private_user`
3. User A (owner) visits own profile

**Expected Results:**
- ✅ User B sees `PrivateProfileMessage`
  - Lock icon displayed
  - Message: "This Account is Private"
  - "Discover Users" button shown
- ✅ Guest sees `PrivateProfileMessage`
  - Lock icon displayed
  - "Sign In" and "Create Account" buttons
- ✅ User A sees full profile
  - All sections visible
  - "Back to Settings" button

**Edge Cases:**
- User B refreshes page after User A changes to public → Should see profile
- Invalid username → 404 page
- Deleted user → 404 page

---

### Scenario 2: Followers-Only Profile

**Setup:**
```typescript
// User A settings
{
  username: "followers_only",
  profileVisibility: "followers",
  showSavedLocations: "followers",
  allowFollowRequests: true
}

// Relationships
User B follows User A
User C does not follow User A
```

**Test Steps:**
1. User B (follower) visits `/@followers_only`
2. User C (non-follower) visits `/@followers_only`
3. User C clicks "Follow" button
4. Page refreshes after follow

**Expected Results:**
- ✅ User B sees full profile
  - All sections visible
  - Saved locations shown
  - "Following" button displayed
- ✅ User C sees `PrivateProfileMessage`
  - Message: "Follow @followers_only to see their profile"
  - "Follow" button shown
- ✅ After following, User C sees full profile
  - Access granted immediately
  - All content visible

**Edge Cases:**
- User B unfollows → Loses access immediately
- User A disables follow requests → Button hidden
- User C already has pending request → Shows "Pending"

---

### Scenario 3: Follow Requests Disabled

**Setup:**
```typescript
// User A settings
{
  username: "no_follows",
  profileVisibility: "public",
  allowFollowRequests: false
}
```

**Test Steps:**
1. User B visits `/@no_follows`
2. Check for follow button presence
3. Verify existing followers still have access

**Expected Results:**
- ✅ No follow button shown
- ✅ Message displayed: "This user is not accepting follow requests"
- ✅ Existing followers unaffected
- ✅ Profile still publicly visible

**Edge Cases:**
- User A enables requests → Button appears
- Direct API call to follow → Should be rejected
- Existing follower unfollows → Cannot re-follow

---

### Scenario 4: Hidden from Search

**Setup:**
```typescript
// User A settings
{
  username: "search_hidden",
  profileVisibility: "public",
  showInSearch: false
}
```

**Test Steps:**
1. Search for "search_hidden" in search bar
2. Search by bio content
3. Geographic search in user's city
4. Direct URL access `/@search_hidden`
5. Autocomplete suggestions

**Expected Results:**
- ❌ Does not appear in username search
- ❌ Does not appear in bio search
- ❌ Does not appear in geographic search
- ❌ Does not appear in autocomplete
- ✅ Direct URL still works (profile loads)

**Database Verification:**
```sql
-- Verify search filters
SELECT * FROM users 
WHERE username ILIKE '%search_hidden%'
  AND "showInSearch" = true;
-- Should return 0 rows

-- But user exists
SELECT * FROM users 
WHERE username ILIKE '%search_hidden%';
-- Should return 1 row
```

---

### Scenario 5: Location Privacy Combinations

**Setup:**
```typescript
// User A settings
{
  username: "location_test",
  profileVisibility: "public",
  showLocation: false,
  showSavedLocations: "followers",
  city: "New York",
  country: "USA"
}

// User A has 5 public saved locations
```

**Test Steps:**
1. Guest visits profile
2. User B (non-follower) visits profile
3. User C (follower) visits profile
4. Check city/country display
5. Check saved locations grid

**Expected Results:**

| Viewer | City/Country | Saved Locations |
|--------|--------------|-----------------|
| Guest | ❌ Hidden | 🔒 Privacy message |
| Non-follower | ❌ Hidden | 🔒 Privacy message |
| Follower | ❌ Hidden | ✅ All 5 locations shown |
| Owner | ✅ Shown | ✅ All locations shown |

**Privacy Message:**
```
🔒 Saved Locations are Private
Follow @location_test to see their saved locations
```

---

### Scenario 6: All Privacy Settings Enabled

**Setup:**
```typescript
// User A settings (maximum privacy)
{
  username: "max_privacy",
  profileVisibility: "private",
  showInSearch: false,
  showLocation: false,
  showSavedLocations: "private",
  allowFollowRequests: false
}
```

**Test Steps:**
1. Search for user
2. Visit direct URL
3. Check follow button
4. View as owner

**Expected Results:**
- ❌ Not in search results
- 🔒 Profile shows privacy message
- ❌ No follow button (requests disabled)
- ✅ Owner sees everything

**Notes:**
- This is the most restrictive configuration
- User can still be @mentioned (if implemented)
- Admin can still view (if admin tools exist)

---

### Scenario 7: Privacy Change Mid-Session

**Setup:**
```typescript
// Initial state
User A: { profileVisibility: "public" }

// During session
User B is viewing User A's profile

// Change
User A changes to: { profileVisibility: "private" }
```

**Test Steps:**
1. User B has profile open in browser
2. User A changes privacy setting
3. User B refreshes page
4. User B navigates to another page and back

**Expected Results:**
- ✅ After refresh: Privacy message shown
- ✅ Navigation: Privacy enforced
- ✅ No cached public data shown
- ✅ Server-side check on every request

**Implementation:**
```typescript
// No client-side caching of profile data
// Privacy checks in server component (runs on every request)
export default async function UserProfilePage({ params }) {
  // Fresh check every time
  const { canView } = await canViewProfile(...);
  // ...
}
```

---

### Scenario 8: Follow/Unfollow Access Changes

**Setup:**
```typescript
User A: { profileVisibility: "followers" }
User B: following User A
```

**Test Steps:**
1. User B confirms can see profile
2. User B unfollows User A
3. User B refreshes page
4. User B re-follows
5. Page refreshes

**Expected Results:**
- ✅ Initially: Full access
- 🔒 After unfollow: Privacy message
- ✅ After re-follow: Full access restored
- ⚡ Changes reflected immediately

**Timing:**
- Follow/unfollow: Immediate database update
- UI update: Next page load
- No stale cache issues

---

## Performance Testing

### Profile Page Load Time

**Target**: < 2000ms (2 seconds)

**Test:**
```bash
# Measure page load time
time curl -s http://localhost:3000/@test_user > /dev/null
```

**Optimization Checklist:**
- ✅ Minimize database queries (2-3 per profile)
- ✅ Use server-side caching (60s for public profiles)
- ✅ Optimize images (ImageKit transformations)
- ✅ Lazy load non-critical content

**Query Breakdown:**
```typescript
// Profile page queries
1. getUserByUsername()      // 1 query
2. canViewProfile()         // 0-1 queries (only if followers-only)
3. getUserPublicLocations() // 0-1 queries (only if can view)
// Total: 2-3 queries
```

---

### Search Response Time

**Target**: < 1000ms (1 second)

**Test:**
```bash
# Measure search API time
time curl -s 'http://localhost:3000/api/v1/search/users?q=test' > /dev/null
```

**Optimization:**
- ✅ Database indexes on username, bio
- ✅ ILIKE queries for case-insensitive search
- ✅ Limit results (default 20, max 50)
- ✅ Pagination with offset

**Query Example:**
```sql
-- Indexed search (fast)
SELECT * FROM users
WHERE username ILIKE $1
  AND "deletedAt" IS NULL
  AND "showInSearch" = true
LIMIT 20 OFFSET 0;

-- Uses indexes on: username, deletedAt, showInSearch
```

---

### Concurrent User Load

**Target**: Handle 100+ concurrent users

**Test:**
```bash
# Apache Bench test (requires ab tool)
ab -n 1000 -c 100 http://localhost:3000/@test_user

# Or use Artillery (npm install -g artillery)
artillery quick --count 100 --num 10 http://localhost:3000/@test_user
```

**Expected:**
- ✅ No crashes
- ✅ Response time < 5s under load
- ✅ No database connection pool exhaustion
- ✅ Proper error handling

---

## Edge Cases

### Case 1: Special Characters in Username

**Test:**
```bash
# Usernames with special chars (if allowed)
curl http://localhost:3000/@user.name
curl http://localhost:3000/@user-name
curl http://localhost:3000/@user_name
```

**Expected:**
- Normalized username lookup
- URL encoding handled correctly
- No 500 errors

---

### Case 2: Very Long Bio

**Test:**
```typescript
// Bio with 1000 characters
const longBio = "a".repeat(1000);
```

**Expected:**
- ✅ Displays without breaking layout
- ✅ Whitespace preserved (whitespace-pre-wrap)
- ✅ No horizontal scroll
- ✅ Search still works

---

### Case 3: No Saved Locations

**Test:**
```typescript
// User with 0 saved locations
User A: { savedLocations: [] }
```

**Expected:**
```
┌─────────────────────────────────┐
│ {displayName} hasn't shared any │
│ locations yet.                  │
└─────────────────────────────────┘
```

---

### Case 4: Deleted/Suspended User

**Test:**
```bash
curl http://localhost:3000/@deleted_user
```

**Expected:**
- 404 Not Found
- Proper error page
- No sensitive data leaked

---

### Case 5: Circular Follows

**Test:**
```typescript
// User A follows User B
// User B follows User A
```

**Expected:**
- ✅ Both can see followers-only profiles
- ✅ No infinite loops
- ✅ Relationship symmetric

---

## API Testing

### Test API Endpoints

**User Profile API:**
```bash
# Public profile
curl http://localhost:3000/api/v1/users/test_user

# Expected: 200 OK with JSON profile
{
  "id": 123,
  "username": "test_user",
  "displayName": "Test User",
  ...
}
```

**Locations API:**
```bash
# Public locations
curl http://localhost:3000/api/v1/users/test_user/locations

# Expected: 200 OK with locations array
{
  "locations": [...],
  "pagination": {
    "page": 1,
    "total": 45
  }
}
```

**Follow Status (requires auth):**
```bash
# Without auth token
curl http://localhost:3000/api/v1/users/me/follow-status/test_user

# Expected: 401 Unauthorized
{
  "error": "Authentication required"
}
```

---

## Manual Testing Checklist

### UI Verification

- [ ] Private profile message displays correctly
- [ ] Lock icon shows on restricted content
- [ ] Follow button hides when `allowFollowRequests = false`
- [ ] City/country hides when `showLocation = false`
- [ ] Locations privacy message shows lock icon
- [ ] Different messages for private vs followers-only

### Navigation Flow

- [ ] Profile → Followers → Back works
- [ ] Profile → Following → Back works
- [ ] Profile → Locations → Individual location → Back
- [ ] Search → Profile → Back to search

### Mobile Responsiveness

- [ ] Private message readable on mobile
- [ ] Follow button accessible on touch
- [ ] Profile stats wrap correctly
- [ ] Locations grid responsive (1/2/3 columns)

### Accessibility

- [ ] Lock icons have alt text
- [ ] Privacy messages screen-reader friendly
- [ ] Follow button has proper ARIA labels
- [ ] Keyboard navigation works

---

## Test Data Setup

### Create Test Users

```sql
-- Public user
INSERT INTO users (username, email, "profileVisibility", "showInSearch")
VALUES ('public_test', 'public@test.com', 'public', true);

-- Private user
INSERT INTO users (username, email, "profileVisibility", "showInSearch", "allowFollowRequests")
VALUES ('private_test', 'private@test.com', 'private', true, false);

-- Followers-only user
INSERT INTO users (username, email, "profileVisibility", "showSavedLocations")
VALUES ('followers_test', 'followers@test.com', 'followers', 'followers');

-- Hidden from search
INSERT INTO users (username, email, "showInSearch")
VALUES ('hidden_test', 'hidden@test.com', false);
```

### Create Follow Relationships

```sql
-- User 1 follows User 2
INSERT INTO user_follows ("followerId", "followingId")
VALUES (1, 2);
```

### Create Test Locations

```sql
-- Public location for user
INSERT INTO user_saves ("userId", "locationId", "visibility")
VALUES (1, 100, 'public');
```

---

## Debugging Failed Tests

### Common Issues

**1. Profile Not Loading**
```bash
# Check user exists
psql -c "SELECT * FROM users WHERE username = 'test_user';"

# Check for deletedAt
psql -c "SELECT * FROM users WHERE username = 'test_user' AND \"deletedAt\" IS NULL;"
```

**2. Privacy Not Enforced**
```bash
# Verify privacy settings
psql -c "SELECT username, \"profileVisibility\", \"showInSearch\" FROM users WHERE username = 'test_user';"

# Check Prisma Client regenerated
npx prisma generate
```

**3. Follow Check Failing**
```bash
# Verify follow relationship
psql -c "SELECT * FROM user_follows WHERE \"followerId\" = 1 AND \"followingId\" = 2;"

# Check UserFollow model exists
grep "model UserFollow" prisma/schema.prisma
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: fotolokashen_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: npx prisma db push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fotolokashen_test
      
      - name: Seed test data
        run: npm run seed:test
      
      - name: Build
        run: npm run build
      
      - name: Start server
        run: npm run start &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run integration tests
        run: ./scripts/test-privacy-integration.sh
```

---

## Success Criteria

### Day 9 Complete When:

- ✅ Integration test script runs successfully
- ✅ All automated tests pass
- ✅ Manual test checklist completed
- ✅ Edge cases handled gracefully
- ✅ Performance targets met
- ✅ Documentation updated
- ✅ No critical bugs remaining

---

## Related Documentation

- [Privacy Enforcement](../features/PRIVACY_ENFORCEMENT.md)
- [Day 8-9 Plan](../planning/PHASE_2A_DAY_8_9_PLAN.md)
- [Follow System API](../api/FOLLOW_SYSTEM.md)
- [Search System](../features/SEARCH_SYSTEM.md)

---

## Summary

Integration testing ensures all Phase 2A features work together:
- ✅ Privacy enforcement across all routes
- ✅ Follow system integration
- ✅ Search privacy filtering
- ✅ Performance optimization
- ✅ Edge case handling

**Status**: ✅ Complete - All integration tests passing
