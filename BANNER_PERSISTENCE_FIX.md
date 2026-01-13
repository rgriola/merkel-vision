# Banner Persistence Fix - Complete

## Issue Summary
Banner images were uploading successfully and saving to the database, but were not persisting across page reloads. The banner would disappear when the user refreshed the page or navigated away and back to the profile page.

## Root Cause
The issue was caused by **two missing pieces** in the authentication flow:

### 1. JWT Token Generation (`src/lib/auth.ts`)
The `generateToken()` function was only including a hardcoded subset of user fields in the JWT payload:
- ❌ Only included: `userId`, `email`, `username`, `isAdmin`
- ❌ Missing: `avatar`, `bannerImage`, and all other user fields

**Fix:** Updated the function to include `avatar` and `bannerImage` fields in the JWT payload.

### 2. Auth Middleware (`src/lib/api-middleware.ts`)
The `requireAuth()` middleware fetches fresh user data from the database on each request, but was missing the `bannerImage` field in its Prisma select query:
- ❌ Selected `avatar: true` but not `bannerImage: true`
- Result: `/api/auth/me` endpoint returned user data without the banner

**Fix:** Added `bannerImage: true` to the Prisma select statement.

## Changes Made

### 1. Updated `src/lib/auth.ts`
```typescript
export function generateToken(
    user: PublicUser,
    rememberMe: boolean = false
): string {
    const payload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        avatar: user.avatar,              // ✅ ADDED
        bannerImage: user.bannerImage,    // ✅ ADDED
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: rememberMe ? JWT_EXPIRY_REMEMBER_ME : JWT_EXPIRY,
    });
}
```

### 2. Updated `src/lib/api-middleware.ts`
```typescript
const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
        id: true,
        email: true,
        username: true,
        // ... other fields ...
        avatar: true,
        bannerImage: true,  // ✅ ADDED
        // ... more fields ...
    },
});
```

### 3. Cleaned Up Debug Logging
Removed temporary debug console.log statements from:
- `src/app/api/auth/login/route.ts`
- `src/components/profile/ProfileHeader.tsx`

## Files Previously Fixed (Still Valid)

### Database Schema
- ✅ `prisma/schema.prisma` - Added `bannerImage String?` field
- ✅ Database migration completed

### Authentication Routes
- ✅ `src/app/api/auth/login/route.ts` - Includes `bannerImage` in user query and token
- ✅ `src/app/api/auth/register/route.ts` - Includes `bannerImage` in user query and token
- ✅ `src/app/api/auth/reset-password/route.ts` - Includes `bannerImage` in user query and token

### Banner Upload System
- ✅ `src/components/profile/BannerEditor.tsx` - Full canvas-based editor (crop/zoom/rotate)
- ✅ `src/components/profile/ProfileHeader.tsx` - Combined banner + avatar layout
- ✅ `src/app/api/auth/banner/route.ts` - Banner upload/delete endpoint

### TypeScript Types
- ✅ `src/types/user.ts` - Added `bannerImage: string | null` to User and PublicUser interfaces

### ImageKit Integration
- ✅ `src/lib/imagekit.ts` - Added `getImageKitFolder()` helper for environment-aware paths
- ✅ All upload components use `/development/` or `/production/` prefixes

## Testing Results

### ✅ Verified Working
- [x] Banner uploads successfully to ImageKit
- [x] Banner saves to database with correct URL
- [x] Banner displays on profile page
- [x] Banner persists across page reloads
- [x] Banner persists across navigation (map → profile)
- [x] Fresh login includes bannerImage in JWT token
- [x] `/api/auth/me` returns bannerImage from database
- [x] Avatar and banner both display in combined layout
- [x] BannerEditor crop/zoom/rotate functions work
- [x] Build passes without TypeScript errors

### Browser Testing
- ✅ Tested in regular browser (after clearing cookies)
- ✅ Tested in incognito browser (fresh JWT token)
- ✅ Console shows: `{ hasAvatar: true, hasBanner: true, avatar: '...', banner: '...' }`

## Why It Failed Before

### The Journey to the Fix
1. **Initial Assumption:** Thought the issue was in ProfileHeader's useEffect
2. **Second Attempt:** Added bannerImage to login/register/reset-password routes
3. **Third Discovery:** Found that Prisma client needed regeneration
4. **Fourth Issue:** Realized old JWT tokens were cached in browser cookies
5. **Incognito Test:** Confirmed server was returning bannerImage in database query
6. **Final Discovery:** Found `generateToken()` was ignoring the field!
7. **Last Piece:** Found `requireAuth()` wasn't selecting bannerImage from database

The issue required **two fixes** because the app uses JWT tokens for auth state, but also fetches fresh user data from the database on each request for security.

## Technical Flow

### How Authentication Works
1. User logs in → `POST /api/auth/login`
2. Server queries database for user (including `bannerImage`)
3. Server generates JWT token with user data (including `bannerImage`)
4. Token stored in HTTP-only cookie
5. Client calls `GET /api/auth/me` to get current user
6. Middleware decodes JWT token
7. Middleware fetches fresh user from database (including `bannerImage`)
8. User data returned to client
9. React context updates with user data
10. ProfileHeader renders with banner

**Both steps 3 and 7 needed to include `bannerImage` for the system to work.**

## Future Maintenance

### If Adding New User Fields
When adding new fields to the User model that should be available on the frontend:

1. Update `prisma/schema.prisma`
2. Run `npx prisma db:push` or create migration
3. Update `src/types/user.ts` (User and PublicUser interfaces)
4. Update `src/lib/auth.ts` (`generateToken` function)
5. Update `src/lib/api-middleware.ts` (`requireAuth` select statement)
6. Update all auth routes (login, register, reset-password) if needed
7. Run `npx prisma generate`
8. Restart dev server

### Key Files to Remember
- **JWT Token Generation:** `src/lib/auth.ts`
- **Auth Middleware:** `src/lib/api-middleware.ts`
- **User Types:** `src/types/user.ts`
- **Auth Routes:** `src/app/api/auth/*/route.ts`

## Resolution
✅ **FIXED** - Banner now persists correctly across:
- Page reloads
- Navigation
- Fresh logins
- All authentication flows

The banner system is now fully functional and production-ready! 🎉

---

**Date:** January 12, 2026
**Status:** ✅ Resolved
**Priority:** High (User-facing feature)
