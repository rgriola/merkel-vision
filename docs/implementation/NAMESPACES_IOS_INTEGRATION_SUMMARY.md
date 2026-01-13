# User Namespaces + iOS App: Integration Summary

**Created**: January 13, 2026  
**Purpose**: Visual overview of how namespaces integrate with iOS app and recent changes

---

## 🎯 The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Current System                       │
│  ✅ Next.js 14 + Prisma + Neon PostgreSQL                   │
│  ✅ ImageKit CDN (with recent orphan cleanup)               │
│  ✅ Cookie-based auth (web only)                            │
│  ✅ Location CRUD APIs                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               What We're Adding (Phased)                     │
│                                                              │
│  Phase 1: User Namespaces (3-5 days)                        │
│  ├── /@username URLs                                        │
│  ├── Public/private location visibility                     │
│  └── Mobile-friendly JSON APIs                              │
│                                                              │
│  Phase 2: OAuth2/PKCE (5-7 days)                            │
│  ├── Bearer token authentication                            │
│  ├── Mobile app authorization flow                          │
│  └── Refresh token system                                   │
│                                                              │
│  Phase 3: Teams & Projects (10-14 days)                     │
│  ├── Team workspaces                                        │
│  ├── Project organization                                   │
│  └── Collaborative sharing                                  │
│                                                              │
│  Phase 4: iOS Photo Upload (3-5 days)                       │
│  ├── Signed upload URLs                                     │
│  ├── Direct ImageKit uploads                                │
│  └── Photo metadata tracking                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   End Result: Full Platform                  │
│                                                              │
│  Web App                    iOS App                          │
│  ├── User profiles          ├── Camera capture              │
│  ├── Team collaboration     ├── OAuth2 login                │
│  ├── Project management     ├── Location discovery          │
│  └── Public sharing         └── Photo upload                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 How Recent Changes Integrate

### Your Recent Work (Commit 31a7d1e)

```typescript
// 1. Added to User model
avatarFileId: String?
bannerFileId: String?

// 2. Avatar/banner upload flow
Upload new image
  → Delete old image from ImageKit (using fileId)
  → Save new image URL + fileId
  → No orphaned files! ✅

// 3. Build commands separated
npm run build              // Local (no DATABASE_URL needed)
npm run build:production   // Vercel (with migrations)

// 4. Automatic migrations
Vercel deployment → prisma migrate deploy → schema updated ✅
```

### How Namespaces Build On This

```typescript
// User model (expanded)
model User {
  // Your existing fields
  username: String @unique ✅
  avatar: String?          ✅
  avatarFileId: String?    ✅ (from recent work)
  bannerImage: String?     ✅
  bannerFileId: String?    ✅ (from recent work)
  bio: String?             ✅
  
  // NEW for namespaces (Phase 1)
  // Nothing! Your schema is already ready!
  
  // User profiles will use:
  // - /@username route
  // - Existing avatar/banner (with your cleanup)
  // - Existing bio field
  // - New visibility on UserSave
}

model UserSave {
  // Your existing fields
  userId: Int
  locationId: Int
  color: String?
  isFavorite: Boolean
  
  // NEW for namespaces (Phase 1)
  caption: String?      // User's personal note about location
  visibility: String    // 'public', 'unlisted', 'private'
}
```

**Result**: Your recent ImageKit cleanup **perfectly supports** user profiles! Profile avatars/banners will automatically use the orphan cleanup system.

---

## 📱 iOS App Integration

### Authentication Flow (Phase 2)

```
┌─────────────┐
│  iOS App    │
└──────┬──────┘
       │
       │ 1. User taps "Login"
       ▼
┌─────────────────────────────────┐
│ OAuth2 Authorization Flow       │
│                                  │
│ App generates:                   │
│ - code_verifier (random)         │
│ - code_challenge (SHA256 hash)   │
└──────────────┬──────────────────┘
               │
               │ 2. POST /api/auth/oauth/authorize
               ▼
┌─────────────────────────────────┐
│ Your Backend (Next.js)          │
│                                  │
│ - Validates user credentials    │
│ - Stores code_challenge         │
│ - Returns authorization_code    │
└──────────────┬──────────────────┘
               │
               │ 3. Authorization code returned
               ▼
┌─────────────────────────────────┐
│ iOS App                         │
│                                  │
│ POST /api/auth/oauth/token      │
│ - authorization_code            │
│ - code_verifier                 │
└──────────────┬──────────────────┘
               │
               │ 4. Token exchange
               ▼
┌─────────────────────────────────┐
│ Your Backend                    │
│                                  │
│ - Validates code_verifier       │
│ - Issues access_token (JWT)     │
│ - Issues refresh_token          │
│ - Returns user data             │
└──────────────┬──────────────────┘
               │
               │ 5. Tokens saved to Keychain
               ▼
┌─────────────────────────────────┐
│ iOS App (Authenticated)         │
│                                  │
│ All API calls include:          │
│ Authorization: Bearer {token}   │
└─────────────────────────────────┘
```

### Photo Upload Flow (Phase 4)

```
┌─────────────┐
│  iOS App    │  1. User takes photo
│  (Camera)   │     - Compresses to 1.5MB
└──────┬──────┘     - Extracts GPS data
       │
       │ 2. Request signed upload URL
       ▼
┌─────────────────────────────────┐
│ POST /api/locations/123/        │
│      photos/request-upload      │
│                                  │
│ Body: {                          │
│   filename: "photo.jpg",         │
│   size: 1245000,                 │
│   lat: 37.7749,                  │
│   lng: -122.4194                 │
│ }                                │
└──────────────┬──────────────────┘
               │
               │ 3. Generate signed URL
               ▼
┌─────────────────────────────────┐
│ Your Backend                    │
│                                  │
│ - Creates Photo record          │
│ - Generates ImageKit signature  │
│ - Returns upload URL + fields   │
└──────────────┬──────────────────┘
               │
               │ 4. Upload directly to ImageKit
               ▼
┌─────────────────────────────────┐
│ ImageKit CDN                    │
│                                  │
│ - Receives photo                │
│ - Stores in environment folder  │
│ - Returns fileId + URL          │
└──────────────┬──────────────────┘
               │
               │ 5. Confirm upload
               ▼
┌─────────────────────────────────┐
│ POST /api/locations/123/        │
│      photos/456/confirm         │
│                                  │
│ Body: {                          │
│   imagekitFileId: "...",         │
│   url: "https://ik..."           │
│ }                                │
└──────────────┬──────────────────┘
               │
               │ 6. Update database
               ▼
┌─────────────────────────────────┐
│ Your Backend                    │
│                                  │
│ Photo record updated:           │
│ - imagekitFileId stored ✅      │
│ - url stored                    │
│ - GPS data saved                │
│                                  │
│ (Uses your orphan cleanup!)     │
└─────────────────────────────────┘
```

**Key Point**: iOS photo uploads will use the **exact same ImageKit cleanup system** you just implemented! When a user uploads a new primary photo, the old one gets deleted automatically.

---

## 🗂️ URL Structure (Complete)

### Web App Routes

```
Current (Already Working):
/                           → Home
/map                        → Map view
/login                      → Login page
/register                   → Registration
/profile                    → Current user's profile
/locations                  → Location browser

NEW (Phase 1: User Namespaces):
/@username                  → Public user profile
/@username/locations        → User's public locations

NEW (Phase 3: Teams & Projects):
/@username/projects         → User's projects
/@username/projects/beach-shoot → Project detail
/teams/acme-productions     → Team workspace
/teams/acme-productions/members → Team members

Sharing URLs:
/share/location/[id]        → Share single location
/share/project/[id]         → Share project
```

### API Routes

```
Current (Already Working):
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
POST   /api/locations
GET    /api/locations
GET    /api/locations/[id]
PUT    /api/locations/[id]
DELETE /api/locations/[id]

NEW (Phase 1: For iOS App):
GET    /api/users/:username              → User profile data
GET    /api/users/:username/locations    → Public locations (paginated)

NEW (Phase 2: OAuth2):
POST   /api/auth/oauth/authorize         → Start OAuth flow
POST   /api/auth/oauth/token             → Exchange code for token
POST   /api/auth/oauth/refresh           → Refresh access token

NEW (Phase 4: Photo Upload):
POST   /api/locations/:id/photos/request-upload
POST   /api/locations/:id/photos/:photoId/confirm
GET    /api/locations/:id/photos
```

---

## 📊 Database Changes Summary

### Phase 1: User Namespaces

```sql
-- NEW TABLE
CREATE TABLE reserved_usernames (
  username  VARCHAR(50) PRIMARY KEY,
  reason    TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MODIFIED TABLE
ALTER TABLE user_saves
  ADD COLUMN caption TEXT,                      -- User's note
  ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';  -- public/unlisted/private

CREATE INDEX idx_user_saves_visibility ON user_saves(visibility);
```

**Impact**:
- ✅ No breaking changes (new fields are optional/default)
- ✅ Existing data continues working
- ✅ Backward compatible

### Phase 2: OAuth2

```sql
-- MODIFIED TABLE
ALTER TABLE sessions
  ADD COLUMN device_type VARCHAR(20),    -- 'ios', 'web'
  ADD COLUMN refresh_token TEXT,         -- For mobile
  ADD COLUMN token_type VARCHAR(20);     -- 'bearer'
```

### Phase 3: Teams & Projects

```sql
-- NEW TABLES (Multiple)
CREATE TABLE teams (...);
CREATE TABLE team_members (...);
CREATE TABLE projects (...);
CREATE TABLE project_locations (...);
```

---

## ⏱️ Implementation Timeline

### Week 1: Phase 1 (User Namespaces)

```
Day 1: Database
├── Create ReservedUsername model
├── Add visibility to UserSave
├── Create migration
└── Seed reserved usernames

Day 2: Backend
├── Create username-utils.ts
├── Update registration validation
└── Test username reservation

Day 3: Web Routes
├── Create /@[username]/page.tsx
├── Create /@[username]/locations/page.tsx
└── Build profile UI components

Day 4: Mobile APIs
├── Create GET /api/users/:username
├── Create GET /api/users/:username/locations
├── Add pagination support
└── Add response headers (rate limits)

Day 5: Testing
├── Manual testing (web + mobile endpoints)
├── Create test users
├── Verify visibility settings
└── Deploy to staging
```

### Week 2: Phase 2 (OAuth2/PKCE)

```
Day 1-2: Authentication Core
├── Add Bearer token support to middleware
├── Create OAuth2 authorize endpoint
├── Implement PKCE validation
└── Test with Postman

Day 3-4: Token Management
├── Create token exchange endpoint
├── Create refresh token endpoint
├── Update Session model
└── Test token lifecycle

Day 5-7: Integration & Testing
├── End-to-end OAuth flow testing
├── Security review
├── Rate limiting setup
└── Deploy to staging
```

### Week 3-4: iOS Development (Parallel)

```
iOS Team (Can Start After Phase 2):
├── Camera capture module
├── Image compression
├── OAuth2 client implementation
└── Location viewing

Backend Team (Working on Phase 3):
├── Teams feature
├── Projects feature
└── Sharing permissions
```

### Week 5-6: Phase 4 (iOS Photo Upload)

```
Backend Work:
├── Signed upload URL generation
├── Photo confirmation endpoint
├── Integration with existing ImageKit cleanup
└── Testing with iOS app

iOS Work:
├── Photo upload manager
├── Upload progress tracking
├── Error handling
└── Beta testing
```

---

## ✅ Compatibility Matrix

| Feature | Web App | iOS App | Notes |
|---------|---------|---------|-------|
| **Authentication** |
| Cookie auth | ✅ | ❌ | Web only |
| OAuth2/PKCE | ❌ | ✅ | Mobile only |
| Bearer tokens | ✅ (Phase 2) | ✅ (Phase 2) | Both after Phase 2 |
| **User Profiles** |
| View own profile | ✅ | ✅ (Phase 1) | |
| View other profiles | ✅ (Phase 1) | ✅ (Phase 1) | /@username |
| Edit profile | ✅ | ⏳ | iOS v2.0 |
| **Locations** |
| Create location | ✅ | ✅ (Phase 4) | |
| View locations | ✅ | ✅ (Phase 1) | |
| Save locations | ✅ | ⏳ | iOS v1.5 |
| Set visibility | ✅ (Phase 1) | ✅ (Phase 4) | |
| **Photos** |
| Upload photos | ✅ | ✅ (Phase 4) | |
| View photos | ✅ | ✅ | |
| ImageKit cleanup | ✅ | ✅ | Your recent work! |
| **Teams** |
| Create teams | ✅ (Phase 3) | ⏳ | iOS v2.0 |
| View team locations | ✅ (Phase 3) | ⏳ | iOS v2.0 |
| **Projects** |
| Create projects | ✅ (Phase 3) | ⏳ | iOS v2.0 |
| View projects | ✅ (Phase 3) | ✅ | Read-only in iOS v1.0 |

**Legend**:
- ✅ = Available now or in specified phase
- ⏳ = Planned for future version
- ❌ = Not applicable

---

## 🚨 Critical Decisions Needed

### Before Starting Phase 1:

1. **Username Change Policy**
   - Can users change username after registration?
   - Recommended: YES, max 1 change per 30 days

2. **API Versioning**
   - Version mobile APIs now (`/api/v1/users/:username`)?
   - Recommended: YES (future-proof)

3. **Default Visibility**
   - New locations: public or private by default?
   - Recommended: PRIVATE (privacy-first)

4. **Staging Environment**
   - Create staging before implementing?
   - Recommended: YES (test iOS integration)

### Before Starting Phase 2:

5. **iOS App Timeline**
   - When does iOS development start?
   - Impacts: How quickly we need OAuth2

6. **Token Expiry**
   - Access token: 24 hours? 7 days?
   - Refresh token: 30 days? 90 days?
   - Recommended: 24h access, 30d refresh

---

## 📝 Next Steps (Action Items)

### Immediate (This Week):

1. **Review Documents**:
   - [ ] Read this summary
   - [ ] Read `NAMESPACES_IMPLEMENTATION_PLAN.md`
   - [ ] Complete `NAMESPACES_PRE_IMPLEMENTATION_CHECKLIST.md`

2. **Check Database**:
   - [ ] Run `check-username-conflicts.sql`
   - [ ] Verify no existing users have reserved usernames

3. **Make Decisions**:
   - [ ] Decide on username change policy
   - [ ] Decide on API versioning strategy
   - [ ] Decide on default visibility

4. **Coordinate with iOS Team**:
   - [ ] Share `IOS_APP_EVALUATION.md`
   - [ ] Confirm iOS development timeline
   - [ ] Align on Phase 2 deadline

### Week 1 (Phase 1 Implementation):

5. **Database Setup**:
   - [ ] Create feature branch: `feature/user-namespaces`
   - [ ] Update Prisma schema
   - [ ] Create migration
   - [ ] Test migration locally

6. **Backend Development**:
   - [ ] Create `username-utils.ts`
   - [ ] Update registration
   - [ ] Create profile routes
   - [ ] Create mobile API endpoints

7. **Testing**:
   - [ ] Create test users
   - [ ] Manual testing
   - [ ] Deploy to staging

---

## 🎓 Key Takeaways

1. **Your Recent Work is Perfect**: The ImageKit orphan cleanup (avatarFileId, bannerFileId) integrates seamlessly with user profiles

2. **Phased Approach**: We're building in logical phases:
   - Phase 1 = Foundation (namespaces)
   - Phase 2 = Mobile auth (OAuth2)
   - Phase 3 = Advanced features (teams/projects)
   - Phase 4 = iOS photos

3. **No Breaking Changes**: Everything is backward compatible

4. **iOS App Ready**: After Phase 2, iOS development can proceed in parallel

5. **Timeline**: ~2 weeks backend work before iOS team can start building

---

**Ready to discuss? Let's review the critical decisions and timeline!** 🚀
