# Profile Avatar vs Banner Clarification

**Date:** January 12, 2026

## Current Issue

The `AvatarUpload` component is confusingly using the **avatar** (small profile picture) as both:
1. The avatar icon
2. The background banner image

This causes poor image quality because:
- Avatar is optimized to 256px: `getOptimizedAvatarUrl(previewUrl, 256)`
- Banner area is 200-240px tall and full width
- Stretching a 256px image across a large area = blurry/pixelated

## Current Code (Lines 164-178)

```tsx
{/* Background Image / Banner */}
<div className="absolute inset-0">
    {previewUrl && !imageError ? (
        <Image
            src={getOptimizedAvatarUrl(previewUrl, 256) || previewUrl}
            alt="Profile banner"
            fill
            className="object-cover"
            ...
        />
    ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
    )}
</div>
```

## Two Possible Solutions

### Option 1: Use Avatar at Higher Resolution for Banner

**Quick Fix** - Just increase the optimization size for the banner:

```tsx
<Image
    src={getOptimizedAvatarUrl(previewUrl, 800) || previewUrl}  // 256 → 800
    alt="Profile banner"
    fill
    className="object-cover"
/>
```

**Pros:**
- Simple one-line change
- Uses existing avatar image
- Better quality immediately

**Cons:**
- Still uses a circular-cropped avatar as a banner (might look weird)
- Avatar is designed to be square/circular, not a wide banner
- Larger file size for every profile view

---

### Option 2: Separate Avatar and Banner Concept

**Better UX** - Treat avatar and banner as two separate images:

**Database Changes:**
```prisma
model User {
  avatar       String?  // Small profile picture (circular)
  bannerImage  String?  // Large banner/cover photo (wide)
  // ...
}
```

**Component Structure:**
```tsx
// Banner (new upload)
{bannerUrl ? (
    <Image
        src={getOptimizedBannerUrl(bannerUrl, 1200)}  // Large
        alt="Profile banner"
        fill
        className="object-cover"
    />
) : (
    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
)}

// Circular Avatar Overlay (existing)
<div className="absolute -bottom-16 left-8">
    <div className="w-32 h-32 rounded-full border-4 border-background">
        {avatarUrl ? (
            <Image
                src={getOptimizedAvatarUrl(avatarUrl, 256)}
                alt="Avatar"
                fill
                className="rounded-full object-cover"
            />
        ) : (
            <UserIcon />
        )}
    </div>
</div>
```

**Pros:**
- Industry standard (Twitter, Facebook, LinkedIn all do this)
- Better UX - users can choose different images for different purposes
- Better image quality - each optimized for its use case
- More professional look

**Cons:**
- Requires database migration
- More complex upload UI
- Two separate upload flows

---

## Recommendation

### Immediate Fix (5 minutes):

Change line 169 in `AvatarUpload.tsx`:

```tsx
// From:
src={getOptimizedAvatarUrl(previewUrl, 256) || previewUrl}

// To:
src={getOptimizedAvatarUrl(previewUrl, 800) || previewUrl}
```

This will give you 3x better quality immediately.

---

### Long-term Solution (1-2 hours):

Implement separate avatar and banner uploads:

1. **Add banner field to User model**
2. **Create separate BannerUpload component**
3. **Update profile page layout**
4. **Add banner upload API endpoint**

This would give you a much more professional profile page similar to other social platforms.

---

## Which Would You Prefer?

**Option 1:** Quick fix - just increase the size to 800px or 1200px?

**Option 2:** Full implementation - separate avatar and banner images?

Let me know and I'll implement your choice!
