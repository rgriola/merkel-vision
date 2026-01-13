# ImageKit Folder Path Fix

**Date:** January 12, 2026  
**Issue:** Banner images uploading to incorrect path (missing environment prefix)  
**Status:** ✅ **FIXED**

## Problem

Images were being uploaded to ImageKit without the environment prefix:

**❌ Incorrect Path:**
```
/users/{userId}/banners/banner-123.jpg
```

**✅ Correct Path:**
```
/development/users/{userId}/banners/banner-123.jpg   (development)
/production/users/{userId}/banners/banner-123.jpg     (production)
```

## Root Cause

The folder paths in the upload components were hardcoded without environment awareness.

## Solution

### 1. Added Helper Function (`src/lib/imagekit.ts`)

```typescript
// Environment-based folder prefix
const ENV_FOLDER = process.env.NODE_ENV === 'production' ? '/production' : '/development';

/**
 * Get ImageKit folder path with environment prefix
 * @param path - Path relative to environment (e.g., 'users/123/avatars')
 * @returns Full folder path with environment prefix
 */
export function getImageKitFolder(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${ENV_FOLDER}/${cleanPath}`;
}
```

**Usage:**
```typescript
getImageKitFolder('users/123/avatars')
// Returns: '/development/users/123/avatars' (in dev)
// Returns: '/production/users/123/avatars' (in prod)
```

### 2. Updated All Upload Components

**Files Changed:**
- ✅ `src/components/profile/ProfileHeader.tsx` (banner + avatar)
- ✅ `src/components/profile/AvatarUpload.tsx`
- ✅ `src/components/profile/BannerUpload.tsx`
- ✅ `src/app/api/auth/banner/route.ts`

**Before:**
```typescript
folder={`/users/${user?.id}/banners`}
```

**After:**
```typescript
import { getImageKitFolder } from '@/lib/imagekit';

folder={getImageKitFolder(`users/${user?.id}/banners`)}
```

## ImageKit Folder Structure

```
/development/                           (dev environment)
  └── users/
      └── {userId}/
          ├── avatars/
          │   └── avatar-{userId}-{timestamp}.jpg
          ├── banners/
          │   └── banner-{userId}-{timestamp}.jpg
          └── photos/
              └── photo-{userId}-{timestamp}.jpg

/production/                            (prod environment)
  └── users/
      └── {userId}/
          ├── avatars/
          ├── banners/
          └── photos/
```

## Full URL Examples

### Development:
```
https://ik.imagekit.io/rgriola/development/users/2/banners/banner-2-1705074123.jpg
https://ik.imagekit.io/rgriola/development/users/2/avatars/avatar-2-1705074456.jpg
```

### Production:
```
https://ik.imagekit.io/rgriola/production/users/2/banners/banner-2-1705074123.jpg
https://ik.imagekit.io/rgriola/production/users/2/avatars/avatar-2-1705074456.jpg
```

## Benefits

1. ✅ **Environment Separation** - Dev and prod files don't mix
2. ✅ **Easy Cleanup** - Can delete `/development` folder without affecting production
3. ✅ **Clear Organization** - Immediately know which environment a file belongs to
4. ✅ **Deployment Safety** - Production URLs won't break during dev work

## Testing

- [ ] Upload avatar in development
- [ ] Verify path: `/development/users/{userId}/avatars/...`
- [ ] Upload banner in development
- [ ] Verify path: `/development/users/{userId}/banners/...`
- [ ] Check ImageKit dashboard for correct folder structure
- [ ] Test in production (after deployment)
- [ ] Verify path: `/production/users/{userId}/...`

## Migration Notes

**Existing Images:**
- Old images at `/users/{userId}/...` still work
- They'll remain accessible at their current URLs
- New uploads use the correct `/development/` or `/production/` prefix
- Optional: Can migrate old images to new structure if needed

**No Database Changes Required:**
- URLs are stored as-is in the database
- The `getImageKitFolder()` function only affects NEW uploads
- Existing image URLs continue to work

---

**Status:** Ready for testing! 🚀

**Next Steps:**
1. Test avatar upload in browser
2. Test banner upload in browser
3. Check ImageKit dashboard for proper folder structure
4. Deploy to production
5. Test production uploads
