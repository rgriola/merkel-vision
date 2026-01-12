# User Namespaces & Teams Implementation Plan

**Status**: Planning  
**Priority**: High (Foundational Feature)  
**Approach**: User-Centric (Users own everything, teams are collaborative spaces)

---

## Core Philosophy: User-Centric Ownership

**Key Principle**: Users are the primary owners of all content. Teams are collaborative workspaces where users can share and work together, but users maintain ownership.

### Ownership Model:

```
User (Primary Owner)
  ├── Personal Locations
  ├── Personal Projects
  ├── Personal Collections
  └── Team Memberships
        ├── Team A (Collaborator)
        │   ├── Shared Locations (user retains ownership)
        │   └── Shared Projects (user retains ownership)
        └── Team B (Admin)
            ├── Shared Locations
            └── Shared Projects
```

**Important**: When a user shares content with a team, they retain ownership. If they leave the team, they can choose to keep or remove their content. 

---

## Phase 1: User Namespaces (Implement First)

### 1.1 Database Changes

#### No Username Changes Needed ✅

Your existing `username` field is already perfect for URLs:
- ✅ Unique constraint
- ✅ 3-50 characters
- ✅ Alphanumeric + hyphens/underscores
- ✅ Case-insensitive lookups via `.toLowerCase()`

**No migration needed for usernames!**

#### Add Reserved Usernames Table

**Update**: `prisma/schema.prisma`

```prisma
model ReservedUsername {
  username  String   @id
  reason    String
  createdAt DateTime @default(now())

  @@map("reserved_usernames")
}
```

#### Update UserSave for Public Profiles

**Update**: `prisma/schema.prisma`

```prisma
model UserSave {
  id             Int       @id @default(autoincrement())
  userId         Int
  locationId     Int
  savedAt        DateTime  @default(now())
  color          String?
  isFavorite     Boolean   @default(false)
  personalRating Float?
  caption        String?   // ADD: User's personal caption for location
  tags           Json?
  visitedAt      DateTime?
  visibility     String    @default("private") // ADD: 'public', 'unlisted', 'private'
  
  location       Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, locationId])
  @@index([locationId])
  @@index([visibility]) // ADD: For filtering public locations
  @@map("user_saves")
}
```

#### Run Migration

```bash
npx prisma migrate dev --name add_user_profiles
```

#### Seed Reserved Usernames

**Create/Update**: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reservedUsernames = [
    { username: 'admin', reason: 'System route' },
    { username: 'api', reason: 'System route' },
    { username: 'app', reason: 'System route' },
    { username: 'auth', reason: 'System route' },
    { username: 'blog', reason: 'Future feature' },
    { username: 'help', reason: 'System route' },
    { username: 'login', reason: 'System route' },
    { username: 'logout', reason: 'System route' },
    { username: 'map', reason: 'System route' },
    { username: 'profile', reason: 'System route' },
    { username: 'register', reason: 'System route' },
    { username: 'settings', reason: 'System route' },
    { username: 'teams', reason: 'System route' },
    { username: 'verify-email', reason: 'System route' },
    { username: 'reset-password', reason: 'System route' },
    { username: 'forgot-password', reason: 'System route' },
    { username: 'share', reason: 'System route' },
  ];

  await prisma.reservedUsername.createMany({
    data: reservedUsernames,
    skipDuplicates: true,
  });

  console.log('✅ Seeded reserved usernames');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npx prisma db seed
```

### 1.2 Username Validation Utility

**Create**: `src/lib/username-utils.ts`

```typescript
import prisma from '@/lib/prisma';

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,50}$/;

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const lowerUsername = username.toLowerCase();
  
  // Check if reserved
  const reserved = await prisma.reservedUsername.findUnique({
    where: { username: lowerUsername }
  });
  if (reserved) return false;
  
  // Check if taken by another user
  const taken = await prisma.user.findUnique({
    where: { username: lowerUsername }
  });
  
  return !taken;
}

/**
 * Validate username format
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 50) {
    return { valid: false, error: 'Username must be 50 characters or less' };
  }
  
  if (!USERNAME_REGEX.test(username)) {
    return { 
      valid: false, 
      error: 'Username can only contain letters, numbers, hyphens, and underscores' 
    };
  }
  
  return { valid: true };
}

/**
 * Format username for display
 */
export function formatUsername(username: string): string {
  return `@${username}`;
}

/**
 * Normalize username for storage/lookup (case-insensitive)
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase();
}
```

### 1.3 User Profile Routes

**Create**: `src/app/@[username]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { normalizeUsername } from '@/lib/username-utils';

interface UserProfilePageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: UserProfilePageProps) {
  const user = await getUserByUsername(params.username);
  
  if (!user) {
    return {
      title: 'User Not Found',
    };
  }
  
  return {
    title: `${user.username} - fotolokashen`,
    description: `View ${user.username}'s locations and projects on fotolokashen`,
  };
}

async function getUserByUsername(username: string) {
  return await prisma.user.findUnique({
    where: { username: normalizeUsername(username) },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      createdAt: true,
    }
  });
}

async function getUserPublicLocations(userId: number) {
  return await prisma.userSave.findMany({
    where: {
      userId,
      visibility: 'public'
    },
    include: {
      location: true
    },
    orderBy: {
      savedAt: 'desc'
    }
  });
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const user = await getUserByUsername(params.username);
  
  if (!user) {
    notFound();
  }
  
  const locations = await getUserPublicLocations(user.id);
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">@{user.username}</h1>
        {user.bio && <p className="text-muted-foreground mt-2">{user.bio}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((save) => (
          <LocationCard 
            key={save.id} 
            location={save.location}
            userSave={save}
          />
        ))}
      </div>
    </div>
  );
}
```

**Create**: `src/app/@[username]/locations/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { normalizeUsername } from '@/lib/username-utils';

interface UserLocationsPageProps {
  params: { username: string };
}

async function getUserByUsername(username: string) {
  return await prisma.user.findUnique({
    where: { username: normalizeUsername(username) },
    select: {
      id: true,
      username: true,
      avatar: true,
    }
  });
}

async function getUserPublicLocations(userId: number) {
  return await prisma.userSave.findMany({
    where: {
      userId,
      visibility: 'public'
    },
    include: {
      location: true
    },
    orderBy: {
      savedAt: 'desc'
    }
  });
}

export default async function UserLocationsPage({ params }: UserLocationsPageProps) {
  const user = await getUserByUsername(params.username);
  if (!user) notFound();
  
  const locations = await getUserPublicLocations(user.id);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        @{user.username}'s Locations
      </h1>
      <LocationsGrid locations={locations} />
    </div>
  );
}
```

### 1.4 Update Registration

**Update**: `src/app/api/auth/register/route.ts`

Add username validation:

```typescript
import { isUsernameAvailable, validateUsername } from '@/lib/username-utils';

// In your registration handler:
const usernameValidation = validateUsername(username);
if (!usernameValidation.valid) {
  return apiError(usernameValidation.error!, 400, 'VALIDATION_ERROR');
}

const available = await isUsernameAvailable(username);
if (!available) {
  return apiError('Username is taken or reserved', 409, 'USERNAME_TAKEN');
}

// Create user with lowercase username for consistency
await prisma.user.create({
  data: {
    username: username.toLowerCase(),
    // ... other fields
  }
});
```

### 1.5 Add Visibility Toggle to Location Save UI

**Update**: Location save form to include visibility option

```typescript
<select name="visibility" defaultValue="private">
  <option value="private">Private (Only me)</option>
  <option value="unlisted">Unlisted (Anyone with link)</option>
  <option value="public">Public (Visible on profile)</option>
</select>
```


---

## Phase 2: Teams/Companies (User-Centric)

### 2.1 Database Schema

```sql
-- Teams table (companies/production teams)
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- Team members (users belong to teams)
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  -- Roles: 'owner', 'admin', 'member', 'viewer'
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invited_by INTEGER REFERENCES users(id),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Team invitations
CREATE TABLE team_invitations (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  invited_by INTEGER NOT NULL REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, email)
);

CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
```

### 2.2 User-Team Relationship

**Key Principle**: Users share their content with teams, but retain ownership.

```sql
-- Add team sharing to user_saves (locations)
ALTER TABLE user_saves
ADD COLUMN shared_with_teams INTEGER[] DEFAULT '{}';

-- Example: User shares location with teams [1, 3, 5]
UPDATE user_saves 
SET shared_with_teams = ARRAY[1, 3, 5]
WHERE id = 123;
```

**Alternative Approach** (More flexible):

```sql
-- Team shared content (many-to-many)
CREATE TABLE team_shared_locations (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_save_id INTEGER NOT NULL REFERENCES user_saves(id) ON DELETE CASCADE,
  shared_by INTEGER NOT NULL REFERENCES users(id),
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_save_id)
);

CREATE INDEX idx_team_shared_locations_team ON team_shared_locations(team_id);
CREATE INDEX idx_team_shared_locations_save ON team_shared_locations(user_save_id);
```

### 2.3 Team Routes

**Create**: `src/app/teams/[teamSlug]/page.tsx`

```typescript
export default async function TeamPage({ 
  params 
}: { 
  params: { teamSlug: string } 
}) {
  const team = await getTeamBySlug(params.teamSlug);
  if (!team) notFound();
  
  const members = await getTeamMembers(team.id);
  const sharedLocations = await getTeamSharedLocations(team.id);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">{team.name}</h1>
      <p className="text-muted-foreground mt-2">{team.description}</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Team Members</h2>
        <MembersList members={members} />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Shared Locations</h2>
        <LocationsGrid locations={sharedLocations} />
      </div>
    </div>
  );
}
```

---

## Phase 3: Projects (User-Owned, Team-Shareable)

### 3.1 Database Schema

```sql
-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  -- User is always the owner
  
  visibility VARCHAR(20) NOT NULL DEFAULT 'private',
  -- 'public', 'unlisted', 'private'
  
  cover_image TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  -- 'active', 'completed', 'archived'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(owner_id, slug)
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_slug ON projects(slug);

-- Project shared with teams
CREATE TABLE project_team_shares (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  shared_by INTEGER NOT NULL REFERENCES users(id),
  permission VARCHAR(20) NOT NULL DEFAULT 'view',
  -- 'view', 'edit', 'admin'
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, team_id)
);

-- Project locations (link locations to projects)
CREATE TABLE project_locations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_save_id INTEGER NOT NULL REFERENCES user_saves(id) ON DELETE CASCADE,
  added_by INTEGER NOT NULL REFERENCES users(id),
  notes TEXT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_save_id)
);

CREATE INDEX idx_project_locations_project ON project_locations(project_id);
CREATE INDEX idx_project_locations_save ON project_locations(user_save_id);
```

### 3.2 Project Routes

**Create**: `src/app/@[username]/projects/page.tsx`

```typescript
// User's projects list
export default async function UserProjectsPage({ 
  params 
}: { 
  params: { username: string } 
}) {
  const user = await getUserByUsername(params.username);
  if (!user) notFound();
  
  const projects = await getUserPublicProjects(user.id);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        @{user.username}'s Projects
      </h1>
      <ProjectsGrid projects={projects} />
    </div>
  );
}
```

**Create**: `src/app/@[username]/projects/[projectSlug]/page.tsx`

```typescript
// Individual project page
export default async function ProjectPage({ 
  params 
}: { 
  params: { username: string; projectSlug: string } 
}) {
  const user = await getUserByUsername(params.username);
  if (!user) notFound();
  
  const project = await getUserProject(user.id, params.projectSlug);
  if (!project) notFound();
  
  const locations = await getProjectLocations(project.id);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">{project.name}</h1>
      <p className="text-muted-foreground mt-2">{project.description}</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Locations</h2>
        <LocationsGrid locations={locations} />
      </div>
    </div>
  );
}
```

---

## Phase 4: Sharing & Permissions

### 4.1 Visibility Levels

```typescript
export enum Visibility {
  PUBLIC = 'public',      // Anyone can view
  UNLISTED = 'unlisted',  // Only with link
  TEAM = 'team',          // Team members only
  PRIVATE = 'private'     // Owner only
}
```

### 4.2 Permission Checks

**File**: `src/lib/permissions.ts`

```typescript
export async function canViewProject(
  projectId: number, 
  userId: number | null
): Promise<boolean> {
  const project = await getProject(projectId);
  
  // Owner can always view
  if (userId && project.owner_id === userId) {
    return true;
  }
  
  // Public projects
  if (project.visibility === 'public') {
    return true;
  }
  
  // Unlisted projects (anyone with link)
  if (project.visibility === 'unlisted') {
    return true;
  }
  
  // Team visibility - check if user is in any shared teams
  if (project.visibility === 'team' && userId) {
    const hasTeamAccess = await db.query(
      `SELECT 1 
       FROM project_team_shares pts
       INNER JOIN team_members tm ON pts.team_id = tm.team_id
       WHERE pts.project_id = $1 AND tm.user_id = $2`,
      [projectId, userId]
    );
    return hasTeamAccess.rows.length > 0;
  }
  
  // Private - only owner
  return false;
}

export async function canEditProject(
  projectId: number, 
  userId: number
): Promise<boolean> {
  const project = await getProject(projectId);
  
  // Owner can always edit
  if (project.owner_id === userId) {
    return true;
  }
  
  // Check if user has edit permission via team
  const hasEditAccess = await db.query(
    `SELECT 1 
     FROM project_team_shares pts
     INNER JOIN team_members tm ON pts.team_id = tm.team_id
     WHERE pts.project_id = $1 
       AND tm.user_id = $2 
       AND pts.permission IN ('edit', 'admin')`,
    [projectId, userId]
  );
  
  return hasEditAccess.rows.length > 0;
}
```

---

## URL Structure Summary

### User-Centric URLs:

```
/@username                              → User profile
/@username/locations                    → User's public locations
/@username/projects                     → User's public projects
/@username/projects/[slug]              → Specific project

/teams/[slug]                           → Team profile
/teams/[slug]/members                   → Team members
/teams/[slug]/locations                 → Shared locations

/share/location/[id]                    → Share single location
/share/project/[id]                     → Share project
```

---

## Structural Changes to Existing App

### 1. Update User Registration

**File**: `src/app/register/page.tsx`

Add username slug generation:

```typescript
// When user registers
const usernameSlug = generateSlug(username);

// Validate availability
const available = await isUsernameAvailable(usernameSlug);
if (!available) {
  return { error: 'Username is taken or reserved' };
}

// Create user with slug
await db.query(
  `INSERT INTO users (username, username_slug, email, password_hash)
   VALUES ($1, $2, $3, $4)`,
  [username, usernameSlug, email, passwordHash]
);
```

### 2. Update Profile Settings

**File**: `src/app/profile/page.tsx`

Allow users to change username (updates slug):

```typescript
async function updateUsername(newUsername: string) {
  const validation = validateUsername(newUsername);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const newSlug = generateSlug(newUsername);
  const available = await isUsernameAvailable(newSlug);
  
  if (!available) {
    throw new Error('Username is taken');
  }
  
  await db.query(
    `UPDATE users 
     SET username = $1, username_slug = $2, updated_at = NOW()
     WHERE id = $3`,
    [newUsername, newSlug, userId]
  );
}
```

### 3. Add Bio Field to Users

```sql
ALTER TABLE users
ADD COLUMN bio TEXT;
```

### 4. Update Navigation

**File**: `src/components/layout/Navigation.tsx`

Add link to user profile:

```typescript
<Link href={`/@${user.username_slug}`}>
  My Profile
</Link>
```

---

## Migration Strategy

### Step 1: Database Migrations

```bash
# Create migration files
npm run db:migration:create add-username-slugs
npm run db:migration:create create-teams-tables
npm run db:migration:create create-projects-tables
```

### Step 2: Backfill Existing Users

```sql
-- Generate slugs for existing users
UPDATE users 
SET username_slug = LOWER(REGEXP_REPLACE(username, '[^a-zA-Z0-9_-]', '', 'g'))
WHERE username_slug IS NULL;

-- Handle duplicates (add number suffix)
-- This is a one-time script
```

### Step 3: Deploy Routes

1. Deploy user profile routes (`@[username]`)
2. Test with existing users
3. Deploy team routes
4. Deploy project routes

---

## Testing Checklist

### User Namespaces:
- [ ] User can access their profile at `/@username`
- [ ] Username validation works
- [ ] Reserved usernames are blocked
- [ ] Duplicate usernames are prevented
- [ ] Username changes update slug correctly

### Teams:
- [ ] User can create a team
- [ ] User can invite members
- [ ] Members can view shared content
- [ ] Team owner can manage members
- [ ] User leaving team retains their content

### Projects:
- [ ] User can create a project
- [ ] Project has unique slug per user
- [ ] User can add locations to project
- [ ] User can share project with team
- [ ] Visibility settings work correctly

---

## Next Steps (After Layout Work)

1. **Phase 1**: Implement user namespaces
   - Add `username_slug` to database
   - Create `@[username]` routes
   - Update registration/profile

2. **Phase 2**: Implement teams
   - Create teams tables
   - Build team creation UI
   - Build member invitation system

3. **Phase 3**: Implement projects
   - Create projects tables
   - Build project creation UI
   - Link locations to projects

4. **Phase 4**: Sharing & permissions
   - Implement visibility controls
   - Build sharing UI
   - Add permission checks

---

## Questions to Consider:

1. **Username Changes**: Should users be able to change their username? (Recommendation: Yes, but with rate limiting)

2. **Team Limits**: How many teams can a user create? (Recommendation: Start with 5, increase for paid plans)

3. **Project Limits**: How many projects per user? (Recommendation: Unlimited for now)

4. **Content Ownership**: When user leaves team, what happens to their shared content? (Recommendation: User keeps ownership, team loses access)

---

**This is a foundational feature. Take time to implement it correctly!** 🎯
