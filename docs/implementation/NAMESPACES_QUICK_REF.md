# User Namespaces - Quick Reference

## URL Structure (User-Centric)

### User URLs:
```
/@username                    → Profile
/@username/locations          → Public locations
/@username/projects           → Projects list
/@username/projects/[slug]    → Project detail
```

### Team URLs:
```
/teams/[slug]                 → Team profile
/teams/[slug]/members         → Members
/teams/[slug]/locations       → Shared locations
```

### Sharing URLs:
```
/share/location/[id]          → Share location
/share/project/[id]           → Share project
```

---

## Key Principles

1. **Users own everything** - Teams are collaborative spaces
2. **Content stays with user** - Even when leaving teams
3. **Flexible sharing** - Users choose what to share with teams
4. **Privacy first** - Default to private, opt-in to share

---

## Database Tables (New)

```
users.username_slug           → URL-safe username
teams                         → Companies/production teams
team_members                  → User-team relationships
team_invitations             → Pending invites
projects                     → User-owned projects
project_team_shares          → Projects shared with teams
project_locations            → Locations in projects
team_shared_locations        → Locations shared with teams
```

---

## Implementation Order

1. ✅ **User Namespaces** (Do first)
   - Add username_slug to users
   - Create @[username] routes
   - Update registration

2. **Teams** (Do second)
   - Create teams tables
   - Build team creation
   - Member invitations

3. **Projects** (Do third)
   - Create projects tables
   - Link to locations
   - Share with teams

4. **Permissions** (Do last)
   - Visibility controls
   - Permission checks
   - Sharing UI

---

## Reserved Usernames

Block these from registration:
```
admin, api, app, auth, blog, help, login, logout, 
map, profile, projects, register, settings, share, 
teams, www
```

---

## Visibility Levels

- **public**: Anyone can view
- **unlisted**: Anyone with link
- **team**: Team members only
- **private**: Owner only

---

See `docs/implementation/user-namespaces-and-teams.md` for full details.
