# User Namespaces Implementation Plan (Revised)

**Date**: January 13, 2026  
**Status**: Planning  
**Priority**: High (Foundational for Teams + iOS App)

---

## Executive Summary

This is a **revised implementation plan** for user namespaces that:
1. ✅ Works with your **recent ImageKit cleanup changes** (avatarFileId, bannerFileId)
2. ✅ Supports the **upcoming iOS camera app** (mobile-friendly APIs)
3. ✅ Aligns with **OAuth2/PKCE** requirements for mobile auth
4. ✅ Maintains **backward compatibility** with existing web app

---

## Key Integration Points

### 1. Recent Changes Integration
Your recent work on ImageKit orphan cleanup added:
- `avatarFileId` and `bannerFileId` to User model ✅
- Automatic deletion of old files before uploads ✅
- Separated build commands (local vs production) ✅

**Impact on Namespaces**: None! These changes are compatible. User profiles will benefit from cleaner avatar/banner management.

### 2. iOS App Integration
The iOS camera app needs:
- OAuth2/PKCE authentication (different from web cookie auth)
- RESTful API endpoints with Bearer tokens
- Public location viewing via user profiles

**Impact on Namespaces**: **Critical!** We need to implement Phase 1 (User Namespaces) BEFORE Phase 4 (OAuth2) to ensure iOS users can view public profiles.

---

## Revised Phased Approach

### Phase 1: User Namespaces (Core Foundation)
**Duration**: 3-5 days  
**Priority**: DO FIRST (Blocks iOS app and Teams)  
**Goal**: Enable `/@username` URLs and public location sharing

#### Why This Phase First?
- ✅ iOS app will need `/api/users/:username/locations` endpoints
- ✅ Teams feature requires user profiles to exist
- ✅ No breaking changes to existing functionality
- ✅ Can be tested independently

#### Tasks:

##### 1.1 Database Schema (Day 1)
```prisma
// Add to schema.prisma

model ReservedUsername {
  username  String   @id
  reason    String
  createdAt DateTime @default(now())

  @@map("reserved_usernames")
}

model UserSave {
  // ...existing fields
  caption    String?   // User's personal caption
  visibility String    @default("private") // 'public', 'unlisted', 'private'
  
  // ...existing relations
  
  @@index([visibility]) // NEW: For filtering public locations
}
```

**Migration**:
```bash
npm run db:migrate -- --name add_user_namespaces
```

##### 1.2 Username Utilities (Day 1)
Create `src/lib/username-utils.ts`:
- `isUsernameAvailable(username)` - Check availability
- `validateUsername(username)` - Format validation
- `normalizeUsername(username)` - Lowercase for lookups
- `formatUsername(username)` - Display as @username

##### 1.3 Seed Reserved Usernames (Day 1)
Update `prisma/seed.ts` to reserve:
```typescript
const reserved = [
  'admin', 'api', 'auth', 'login', 'logout', 
  'register', 'profile', 'settings', 'map',
  'teams', 'share', 'projects', 'locations',
  'verify-email', 'reset-password', 'forgot-password'
];
```

##### 1.4 Update Registration (Day 2)
Modify `src/app/api/auth/register/route.ts`:
- Add username validation
- Check against reserved usernames
- Store normalized username (lowercase)

##### 1.5 User Profile Routes (Day 2-3)
```
src/app/@[username]/
  ├── page.tsx              // User profile (public locations)
  ├── locations/
  │   └── page.tsx          // All public locations (grid/list view)
  └── layout.tsx            // Shared layout with user header
```

**Key Features**:
- Public avatar/banner display (using your new fileId cleanup)
- Bio display
- Location count
- Join date

##### 1.6 API Endpoints for Mobile (Day 3)
```typescript
// New mobile-friendly endpoints
GET /api/users/:username           // User profile data
GET /api/users/:username/locations // Public locations (paginated)
```

**Response Format** (Mobile-optimized):
```typescript
{
  "user": {
    "id": 123,
    "username": "johndoe",
    "avatar": "https://ik.imagekit.io/...",
    "bio": "...",
    "locationCount": 45
  },
  "locations": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 45,
    "hasMore": true
  }
}
```

##### 1.7 Location Visibility Toggle (Day 4)
Update `src/components/locations/LocationSaveDialog.tsx`:
```tsx
<select name="visibility">
  <option value="private">Private (Only me)</option>
  <option value="unlisted">Unlisted (Anyone with link)</option>
  <option value="public">Public (Visible on profile)</option>
</select>
```

##### 1.8 Testing (Day 5)
- [ ] Create test user with public locations
- [ ] Verify `/@testuser` loads correctly
- [ ] Test reserved username blocking
- [ ] Test mobile API endpoints with curl
- [ ] Verify visibility settings work

---

### Phase 2: OAuth2/PKCE for iOS (Mobile Auth)
**Duration**: 5-7 days  
**Priority**: DO SECOND (Enables iOS app development)  
**Prerequisites**: Phase 1 complete

#### Why After Phase 1?
- iOS app needs to view public profiles (Phase 1)
- OAuth2 can use username for user identification
- Mobile API endpoints need to exist first

#### Tasks:

##### 2.1 Bearer Token Support (Day 1)
Modify `src/lib/api-middleware.ts`:
```typescript
export async function requireAuth(request: NextRequest) {
  // Current: cookie-based
  const cookieToken = request.cookies.get('auth_token');
  
  // NEW: also support Authorization header
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.replace('Bearer ', '');
  
  const token = bearerToken || cookieToken?.value;
  // ...verify token
}
```

##### 2.2 OAuth2 Endpoints (Day 2-4)
```typescript
POST /api/auth/oauth/authorize      // Authorization request
POST /api/auth/oauth/token          // Token exchange
POST /api/auth/oauth/refresh        // Refresh tokens
```

See `IOS_APP_EVALUATION.md` Part 4 for full specification.

##### 2.3 PKCE Implementation (Day 3)
- Code challenge generation
- Code verifier validation
- Secure token storage (database-backed refresh tokens)

##### 2.4 Mobile Session Management (Day 4)
Update `Session` model to support:
- Device type (iOS vs web)
- Refresh tokens
- Longer expiry for mobile (30 days vs 24 hours)

##### 2.5 Testing with Postman (Day 5-7)
- [ ] Test full OAuth2 flow
- [ ] Verify PKCE security
- [ ] Test token refresh
- [ ] Load test rate limiting

---

### Phase 3: Teams & Projects (Advanced Features)
**Duration**: 10-14 days  
**Priority**: DO THIRD (After iOS app is functional)  
**Prerequisites**: Phase 1 & 2 complete

#### Why After OAuth2?
- Teams can wait (not critical for MVP)
- iOS app can launch without teams
- More complex feature requiring careful design

#### Database Schema:
```prisma
model Team {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  name        String
  description String?
  avatar      String?
  createdBy   Int
  createdAt   DateTime @default(now())
  
  creator     User           @relation("TeamCreator", fields: [createdBy], references: [id])
  members     TeamMember[]
  // ...
}

model TeamMember {
  id        Int      @id @default(autoincrement())
  teamId    Int
  userId    Int
  role      String   // 'owner', 'admin', 'member'
  joinedAt  DateTime @default(now())
  
  team      Team     @relation(fields: [teamId], references: [id])
  user      User     @relation("TeamMember", fields: [userId], references: [id])
  
  @@unique([teamId, userId])
}

model Project {
  id          Int      @id @default(autoincrement())
  ownerId     Int
  slug        String
  name        String
  description String?
  visibility  String   @default("private")
  createdAt   DateTime @default(now())
  
  owner       User              @relation(fields: [ownerId], references: [id])
  locations   ProjectLocation[]
  
  @@unique([ownerId, slug])
}

model ProjectLocation {
  id         Int      @id @default(autoincrement())
  projectId  Int
  userSaveId Int
  addedAt    DateTime @default(now())
  
  project    Project  @relation(fields: [projectId], references: [id])
  userSave   UserSave @relation(fields: [userSaveId], references: [id])
  
  @@unique([projectId, userSaveId])
}
```

#### Routes:
```
/teams/[slug]                  // Team profile
/@username/projects            // User's projects
/@username/projects/[slug]     // Project detail
```

---

### Phase 4: iOS Photo Upload API (Mobile-Specific)
**Duration**: 3-5 days  
**Priority**: DO FOURTH (After OAuth2)  
**Prerequisites**: Phase 2 complete

#### Signed Upload Flow:
```typescript
// 1. Request signed upload URL
POST /api/locations/:id/photos/request-upload
Authorization: Bearer {token}
{
  "filename": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 1245000,
  "width": 3000,
  "height": 2000,
  "lat": 37.7749,
  "lng": -122.4194
}

→ Returns: { uploadUrl, fields, photoId }

// 2. iOS uploads directly to ImageKit

// 3. Confirm upload completed
POST /api/locations/:id/photos/:photoId/confirm
{
  "imagekitFileId": "...",
  "url": "https://ik.imagekit.io/..."
}
```

This integrates with your existing ImageKit cleanup (automatic fileId tracking).

---

## Implementation Order Summary

```
Week 1: Phase 1 (User Namespaces)
├── Day 1-2: Database + utilities
├── Day 3-4: Routes + API endpoints
└── Day 5: Testing

Week 2: Phase 2 (OAuth2/PKCE)
├── Day 1-2: Bearer tokens + endpoints
├── Day 3-4: PKCE + sessions
└── Day 5-7: Testing

Week 3-4: iOS App Development Can Begin
├── iOS team works on camera/compression
└── Backend team works on Phase 3 (Teams)

Week 4-5: Phase 3 (Teams & Projects)
├── Database schema
├── Team management UI
└── Project creation

Week 5-6: Phase 4 (iOS Photo Upload)
├── Signed upload URLs
├── Photo confirmation
└── Mobile testing
```

---

## Mobile API Design Principles

### 1. Response Format
All mobile endpoints should return:
```typescript
{
  "success": true,
  "data": {...},
  "meta": {
    "timestamp": "2026-01-13T10:30:00Z",
    "version": "1.0"
  },
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "hasMore": true
  }
}
```

### 2. Error Format
```typescript
{
  "success": false,
  "error": {
    "code": "INVALID_USERNAME",
    "message": "Username must be at least 3 characters",
    "field": "username"
  }
}
```

### 3. Headers
All responses include:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1705068600
X-API-Version: 1.0
```

---

## Testing Strategy

### Phase 1 Testing:
```bash
# Test username validation
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"test@test.com"}'
# Should fail (reserved)

# Test public profile
curl http://localhost:3000/@testuser
# Should return HTML

# Test mobile API
curl http://localhost:3000/api/users/testuser
# Should return JSON
```

### Phase 2 Testing:
```bash
# Test OAuth2 flow
curl -X POST http://localhost:3000/api/auth/oauth/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "client_id":"fotolokashen-ios",
    "code_challenge":"...",
    "code_challenge_method":"S256"
  }'
```

---

## Breaking Changes & Migrations

### ✅ No Breaking Changes Expected
- Existing users continue working with cookie auth
- New iOS users use OAuth2
- Usernames already exist in database
- Location visibility defaults to "private"

### Migration Steps:
```bash
# 1. Create migration
npm run db:migrate -- --name add_user_namespaces

# 2. Backfill visibility for existing user_saves
UPDATE user_saves SET visibility = 'private' WHERE visibility IS NULL;

# 3. Seed reserved usernames
npm run db:seed

# 4. Deploy to staging
git push origin main
# (Vercel auto-deploys with migrations)

# 5. Test staging
# Visit staging.fotolokashen.com/@testuser

# 6. Promote to production
```

---

## Success Metrics

### Phase 1:
- [ ] All existing routes still work
- [ ] `/@username` returns 200 for valid users
- [ ] `/@admin` returns 404 (reserved)
- [ ] Public locations visible on profile
- [ ] Private locations hidden from profile
- [ ] Mobile API returns valid JSON

### Phase 2:
- [ ] OAuth2 flow completes successfully
- [ ] iOS app can authenticate
- [ ] Refresh tokens work
- [ ] Rate limiting prevents abuse
- [ ] Bearer tokens work with all endpoints

### Phase 3:
- [ ] Teams can be created
- [ ] Members can be invited
- [ ] Projects can be created
- [ ] Locations can be shared with teams

### Phase 4:
- [ ] iOS app can upload photos
- [ ] Signed URLs work securely
- [ ] Photos appear in location gallery
- [ ] FileIds tracked correctly (no orphans)

---

## Risk Assessment

### High Risk:
1. **Username Changes**: If users want to change usernames later
   - **Mitigation**: Allow changes but track history in `UsernameChangeRequest`

2. **Reserved Username Conflicts**: Existing user has "admin" username
   - **Mitigation**: Check database NOW before implementing

3. **OAuth2 Security**: PKCE implementation bugs
   - **Mitigation**: Use proven library (oauth2-server)

### Medium Risk:
4. **API Version Compatibility**: iOS v1.0 breaks when backend updates
   - **Mitigation**: Version endpoints (`/api/v1/users/:username`)

5. **Rate Limiting**: Mobile apps hitting rate limits
   - **Mitigation**: Higher limits for authenticated users

### Low Risk:
6. **Profile Performance**: Large users with 1000+ locations
   - **Mitigation**: Pagination + caching

---

## Questions to Resolve Before Starting

### Critical:
1. **Do any existing users have reserved usernames?**
   ```sql
   SELECT username FROM users 
   WHERE LOWER(username) IN ('admin', 'api', 'auth', 'login', 'logout', ...);
   ```
   - If YES: We need to force them to change or grandfather them in

2. **Should users be able to change their username?**
   - Recommendation: YES, but max 1 change per 30 days (to prevent abuse)

3. **Should we version the API now or later?**
   - Recommendation: Add `/api/v1/` prefix NOW for all mobile endpoints

### Important:
4. **Default visibility for new locations?**
   - Recommendation: `private` (users opt-in to public sharing)

5. **Can usernames be changed after iOS app launches?**
   - Recommendation: YES, but update all API clients

6. **Should profiles show location count?**
   - Recommendation: YES (shows activity level)

---

## Next Steps (Action Items)

### Before Starting Phase 1:
- [ ] Review this plan with team
- [ ] Check for reserved username conflicts (SQL query)
- [ ] Decide on username change policy
- [ ] Decide on API versioning strategy

### Week 1 Kickoff:
- [ ] Create feature branch: `feature/user-namespaces`
- [ ] Run database check for conflicts
- [ ] Create Prisma migration
- [ ] Implement username utilities
- [ ] Update registration flow

---

## References

- Original Plan: `docs/implementation/user-namespaces-and-teams.md`
- Quick Reference: `docs/implementation/NAMESPACES_QUICK_REF.md`
- iOS Evaluation: `docs/planning/IOS_APP_EVALUATION.md`
- Recent Changes: ImageKit cleanup (commit 31a7d1e)

---

**Ready to proceed? Let's discuss any concerns before starting Phase 1!** 🚀
