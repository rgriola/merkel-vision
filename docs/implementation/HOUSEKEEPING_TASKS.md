# Housekeeping Tasks - Phase 2A (Partial Completion)

**Date:** January 13, 2026  
**Status:** In Progress  
**Branch:** main

---

## ✅ Completed Tasks

### 1. Profile Navigation ✅
- **Added "View Public Profile" button** in `/profile` page (ProfileHeader component)
  - Located in the user info section below email
  - Uses `ExternalLink` icon for clarity
  - Links to `/@{username}` public profile
  
- **Added "Back to Settings" button** in public profile (`/@username` page)
  - Only visible when viewing your own profile (`isOwnProfile` check)
  - Uses `Settings` icon
  - Links back to `/profile` settings page
  - Positioned above avatar section for easy access

### 2. Map Friends Integration ✅
- **Created FriendsDialog component** (`src/components/map/FriendsDialog.tsx`)
  - Modal dialog with two tabs: Following and Followers
  - Links to respective profile pages: `/@username/following` and `/@username/followers`
  - Clean, simple UI with appropriate icons
  
- **Connected "Friends" button on Map page**
  - Replaced placeholder alert with real dialog
  - Opens FriendsDialog when clicked
  - Provides quick access to social connections while browsing map

---

## ⏳ Remaining Tasks

### 3. Public Profile Enhancements (NOT STARTED)

#### A. Show Projects and Teams
- **Location:** `src/app/[username]/page.tsx`
- **Requirements:**
  - Query user's projects from database
  - Query user's team memberships
  - Display in a new section on public profile
  - Show project/team name, role, and relevant details
  - Add appropriate UI components (cards/list)

#### B. Privacy Settings for Projects/Teams
- **Location:** `src/app/profile/page.tsx` (new Privacy tab)
- **Requirements:**
  - Add new "Privacy" tab to profile settings
  - Toggle switches for:
    - Show/hide projects on public profile
    - Show/hide teams on public profile
  - Database schema update:
    - Add `showProjects: boolean` field to User model (default: true)
    - Add `showTeams: boolean` field to User model (default: true)
  - Create API endpoint to update privacy settings
  - Create PrivacySettingsForm component

---

## 📋 Implementation Plan for Remaining Tasks

### Task 3A: Show Projects and Teams on Public Profile

**Step 1: Update Public Profile Query**
```typescript
// In src/app/[username]/page.tsx - getUserByUsername function
// Add to select object:
select: {
  // ...existing fields...
  teamMemberships: {
    where: { status: 'active' },
    select: {
      role: true,
      joinedAt: true,
      team: {
        select: {
          id: true,
          name: true,
          description: true,
        }
      }
    }
  },
  projects: {
    where: { status: 'active' }, // assuming there's a status field
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
    take: 5, // Show only recent/active projects
  }
}
```

**Step 2: Check Privacy Settings**
```typescript
// Filter based on user privacy settings
const showProjects = user.showProjects ?? true;
const showTeams = user.showTeams ?? true;
```

**Step 3: Create UI Component**
```typescript
// src/components/profile/ProjectsTeamsSection.tsx
interface ProjectsTeamsSectionProps {
  projects: Project[];
  teams: TeamMembership[];
  showProjects: boolean;
  showTeams: boolean;
}
```

**Step 4: Add to Public Profile Page**
- Position after the bio section
- Before the locations grid
- Use cards or tabs to organize

### Task 3B: Privacy Settings Tab

**Step 1: Database Migration**
```sql
-- Add privacy fields to users table
ALTER TABLE users ADD COLUMN "showProjects" BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN "showTeams" BOOLEAN DEFAULT true;
```

**Step 2: Update Prisma Schema**
```prisma
model User {
  // ...existing fields...
  showProjects Boolean @default(true)
  showTeams    Boolean @default(true)
}
```

**Step 3: Create API Endpoint**
```typescript
// src/app/api/auth/privacy/route.ts
POST /api/auth/privacy
{
  showProjects: boolean;
  showTeams: boolean;
}
```

**Step 4: Create Privacy Settings Component**
```typescript
// src/components/profile/PrivacySettingsForm.tsx
- Toggle for "Show projects on public profile"
- Toggle for "Show teams on public profile"
- Maybe add more privacy settings later:
  - Show email on public profile
  - Show location on public profile
  - Show activity stats
```

**Step 5: Add Privacy Tab to Profile Page**
```typescript
// src/app/profile/page.tsx
<TabsList className="grid w-full grid-cols-4">
  {/* ...existing tabs... */}
  <TabsTrigger value="privacy">
    <Lock className="w-4 h-4" />
    <span>Privacy</span>
  </TabsTrigger>
</TabsList>

<TabsContent value="privacy">
  <PrivacySettingsForm />
</TabsContent>
```

---

## 🎯 Estimated Time for Remaining Work

- **Projects/Teams Display:** 2-3 hours
  - Query updates: 30 min
  - Component creation: 1 hour
  - UI integration: 1 hour
  - Testing: 30 min

- **Privacy Settings:** 2-3 hours
  - Database migration: 15 min
  - API endpoint: 30 min
  - Form component: 1 hour
  - Tab integration: 30 min
  - Testing: 45 min

**Total:** 4-6 hours

---

## 📝 Notes

- Privacy settings should apply to both logged-in and non-logged-in viewers
- Consider adding more privacy options in the future:
  - Hide saved locations count
  - Hide follower/following counts
  - Make profile completely private (followers-only)
- Projects and teams visibility might need role-based access control
  - Some teams might be private
  - Some projects might be internal only

---

## 🚀 Next Steps

1. **Option A:** Complete remaining housekeeping tasks (4-6 hours)
2. **Option B:** Move to Day 4 (Search Backend) and come back to housekeeping later
3. **Option C:** Do a partial implementation (just show projects/teams without privacy settings)

**Recommendation:** Option C - Show projects/teams on public profile NOW (simple), add privacy settings LATER when we do Day 7 (Visibility & Privacy). This keeps momentum going while addressing the immediate UX need.

---

**Files Modified:**
- `src/app/[username]/page.tsx` - Added back to settings button
- `src/app/map/page.tsx` - Connected Friends button to dialog
- `src/components/map/FriendsDialog.tsx` - NEW: Friends modal
- `src/components/profile/ProfileHeader.tsx` - Added view public profile button
