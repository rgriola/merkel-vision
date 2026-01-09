# Duplicate Save Prevention - Mobile Safari Issue

**Date**: January 9, 2026  
**Issue**: Multiple duplicate saves when clicking Save button on mobile Safari  
**Status**: 🔧 Implementing Prevention

---

## Problem Analysis

### User Report
- **Platform**: Safari Mobile Browser
- **Action**: Saving a new location (no photo)
- **Result**: Same location saved 5 times
- **Cause**: UI delay/lag causing multiple button clicks to register

### Root Cause

**Current Implementation** has NO duplicate prevention:

```tsx
// RightSidebar.tsx - Save Button (lines 72-83)
<Button
    variant="ghost"
    size="icon"
    onClick={onSave}
    disabled={isSaving}  // ❌ isSaving is ALWAYS false
    className="..."
>
    <Save className="w-4 h-4 text-white" />
</Button>

// map/page.tsx - onSave handler (lines 1086-1092)
onSave={() => {
    const formId = 'save-location-form';
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
        form.requestSubmit();  // ❌ No state tracking
    }
}}
isSaving={false}  // ❌ Hardcoded to false!
```

**Problems:**
1. ❌ `isSaving` prop is hardcoded to `false` in map page
2. ❌ Button never gets disabled during save
3. ❌ No visual feedback that save is in progress
4. ❌ `useSaveLocation` hook has loading state, but it's not connected to UI
5. ❌ Mobile browsers have UI lag, making rapid clicks easy

---

## Impact Assessment

### High Risk Scenarios

| Scenario | Risk | Impact |
|----------|------|--------|
| **Mobile Safari** | 🔴 High | Slow UI response = multiple clicks |
| **Slow Network** | 🔴 High | Long save time = multiple attempts |
| **Impatient Users** | 🟡 Medium | Click multiple times if no feedback |
| **Desktop Chrome** | 🟢 Low | Fast UI response (but still possible) |

### Database Impact

Each duplicate save creates:
- ❌ 1 new Location record (if unique placeId)
- ❌ 1 new UserSave record
- ❌ Wasted database space
- ❌ Cluttered user's saved locations list

**User's Case**: 5 identical locations in database

---

## Solution Strategy

### 3-Layer Prevention

1. **UI Layer**: Disable button immediately on click
2. **State Layer**: Track save operation in progress
3. **API Layer**: Prevent duplicate submissions via debouncing

---

## Implementation

### Solution 1: Connect Loading State (Primary Fix)

**Problem**: `useSaveLocation().isPending` exists but isn't used

**Fix**: Wire up the mutation's pending state

```tsx
// SaveLocationPanel.tsx - CURRENT
export function SaveLocationPanel({ ... }) {
    const saveLocation = useSaveLocation();
    
    return (
        <SaveLocationForm
            isPending={saveLocation.isPending}  // ✅ Already passed to form
            ...
        />
    );
}

// map/page.tsx - FIX NEEDED
{sidebarView === 'save' && locationToSave && (
    <SaveLocationPanel
        initialData={{...}}
        onSuccess={() => {...}}
        showPhotoUpload={showPhotoUpload}
        // ❌ MISSING: Need to expose isPending
    />
)}

// RightSidebar - FIX NEEDED
<RightSidebar
    onSave={() => {...}}
    isSaving={false}  // ❌ Change to dynamic value
    showSaveButton={true}
>
```

**Changes Required:**

1. **SaveLocationPanel**: Expose `isPending` state
2. **map/page.tsx**: Track save state from SaveLocationPanel
3. **RightSidebar**: Receive actual `isSaving` value

---

### Solution 2: Add Visual Feedback

**Purpose**: Show user that save is in progress

#### A. Button State Changes

```tsx
// Save Button States
{showSaveButton && onSave && (
    <Button
        variant="ghost"
        size="icon"
        onClick={onSave}
        disabled={isSaving}  // ✅ Actually disable
        className={cn(
            "shrink-0 hover:text-white disabled:opacity-50",
            isSaving 
                ? "bg-indigo-400 cursor-not-allowed"  // Loading state
                : "bg-indigo-600 hover:bg-indigo-700"  // Normal state
        )}
        title={isSaving ? "Saving..." : "Save location"}
    >
        {isSaving ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />  // Spinner
        ) : (
            <Save className="w-4 h-4 text-white" />  // Save icon
        )}
    </Button>
)}
```

#### B. Toast Notification

```tsx
// useSaveLocation.ts - CURRENT (already has toast!)
onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['locations'] });
    toast.success('Location saved successfully!');  // ✅ Already exists
},
```

#### C. Form Overlay (Optional)

```tsx
// SaveLocationPanel.tsx - Add overlay during save
<div className="flex flex-col h-full">
    <div className="flex-1 overflow-y-auto p-4 relative">
        <SaveLocationForm {...props} />
        
        {/* Overlay during save */}
        {saveLocation.isPending && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Saving location...</p>
                </div>
            </div>
        )}
    </div>
</div>
```

---

### Solution 3: Add Debouncing (Defense in Depth)

**Purpose**: Prevent rapid repeated clicks at code level

```tsx
// utils/debounce.ts - NEW FILE
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

// map/page.tsx - Apply debouncing
import { debounce } from '@/lib/utils/debounce';

const handleSaveClick = debounce(() => {
    const formId = 'save-location-form';
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
        form.requestSubmit();
    }
}, 300);  // 300ms debounce

<RightSidebar
    onSave={handleSaveClick}
    ...
/>
```

---

### Solution 4: API-Level Duplicate Detection

**Purpose**: Last line of defense - prevent duplicate DB writes

```typescript
// app/api/locations/route.ts - POST handler
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return apiError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const body = await request.json();
        const userId = session.user.id;

        // ✅ Check for recent duplicate (within last 5 seconds)
        const recentSave = await prisma.userSave.findFirst({
            where: {
                userId: userId,
                location: {
                    placeId: body.placeId,
                },
                savedAt: {
                    gte: new Date(Date.now() - 5000),  // Last 5 seconds
                },
            },
        });

        if (recentSave) {
            console.log('[Save Location] Duplicate save prevented:', {
                placeId: body.placeId,
                userId,
                recentSaveId: recentSave.id,
            });
            
            // Return the existing save instead of error
            return apiResponse({ 
                userSave: recentSave,
                message: 'Location already saved',
            }, 200);
        }

        // Continue with normal save logic...
        const location = await prisma.location.findUnique({...});
        // ...
    }
}
```

---

## Testing Plan

### Test Cases

#### 1. Normal Save Flow
- [ ] Click Save button once
- [ ] Button shows spinner
- [ ] Form becomes non-interactive
- [ ] Toast shows "Saving..."
- [ ] Save completes
- [ ] Toast shows "Location saved successfully!"
- [ ] Sidebar closes

#### 2. Rapid Click Prevention (Desktop)
- [ ] Click Save button rapidly 5 times
- [ ] Only 1 save operation occurs
- [ ] Button disabled after first click
- [ ] No duplicate locations created

#### 3. Mobile Safari (Critical)
- [ ] Open map on iPhone/iPad Safari
- [ ] Click map to create temporary marker
- [ ] Click Save button
- [ ] Tap Save button in header rapidly 5 times
- [ ] Button should disable immediately
- [ ] Only 1 location saved
- [ ] Verify in database: only 1 UserSave record

#### 4. Slow Network Simulation
- [ ] Throttle network to Slow 3G
- [ ] Start save operation
- [ ] Try clicking Save again
- [ ] Button should remain disabled
- [ ] Only 1 save completes

#### 5. API Duplicate Prevention
- [ ] Send 2 identical POST requests within 1 second
- [ ] Second request returns existing save
- [ ] No duplicate UserSave created
- [ ] User sees success message (not error)

---

## User Experience Improvements

### Before (Current)
```
User clicks Save
    ↓
Nothing happens visually for 1-2 seconds
    ↓
User thinks "Did it work?"
    ↓
User clicks Save again (x4 more times)
    ↓
5 identical locations saved 😞
```

### After (Fixed)
```
User clicks Save
    ↓
Button immediately shows spinner ⏳
Button becomes disabled (grayed out)
Optional: "Saving..." toast appears
    ↓
User sees clear feedback - waits
    ↓
Save completes in 1-2 seconds
    ↓
"Location saved successfully!" ✅
Sidebar closes automatically
    ↓
1 location saved 😊
```

---

## Implementation Priority

### Phase 1: Immediate Fixes (High Priority) 🔴

1. **Wire up `isPending` state** from `useSaveLocation`
   - Modify `SaveLocationPanel` to expose `isPending`
   - Update `map/page.tsx` to track save state
   - Pass real `isSaving` value to `RightSidebar`

2. **Update Save button visual feedback**
   - Show spinner icon when saving
   - Disable button when `isSaving === true`
   - Change button color/opacity

**Impact**: Prevents 95% of duplicate saves

**Effort**: ~30 minutes

---

### Phase 2: Enhanced UX (Medium Priority) 🟡

3. **Add debouncing** to save button click
   - Create debounce utility
   - Apply 300ms debounce to onSave handler

4. **Add form overlay** during save
   - Show loading state over form
   - Prevent user interaction during save

**Impact**: Better user experience, clearer feedback

**Effort**: ~20 minutes

---

### Phase 3: API Protection (Low Priority) 🟢

5. **Add API-level duplicate detection**
   - Check for recent saves (last 5 seconds)
   - Return existing save if duplicate detected
   - Log duplicate attempts

**Impact**: Safety net for edge cases

**Effort**: ~15 minutes

---

## Code Changes Summary

### Files to Modify

1. **`/src/components/panels/SaveLocationPanel.tsx`**
   - Expose `isPending` prop
   - Add return value to parent component

2. **`/src/app/map/page.tsx`**
   - Track `isSavingLocation` state
   - Pass to RightSidebar as `isSaving`
   - Update callback to capture state

3. **`/src/components/layout/RightSidebar.tsx`**
   - Update Save button with spinner
   - Add proper disabled state styling
   - Import Loader2 icon

4. **`/src/app/api/locations/route.ts`** (Optional - Phase 3)
   - Add duplicate detection logic
   - Check for recent saves

5. **`/src/lib/utils/debounce.ts`** (Optional - Phase 2)
   - Create new debounce utility

---

## Related Issues

### Similar Problems in Codebase

**Check these for same pattern:**

1. **Edit Location** (`EditLocationPanel`)
   - Uses `useUpdateLocation().isPending`
   - Check if connected to UI

2. **Quick Save** (`SaveLocationPanel`)
   - Has separate quick save flow
   - Should also be protected

3. **Delete Location** (various places)
   - Should prevent rapid delete clicks
   - Check for loading states

4. **Photo Upload** (`ImageKitUploader`)
   - File uploads can be slow
   - Should prevent duplicate uploads

---

## Success Metrics

After implementation, verify:

- ✅ No duplicate saves in database (check user_saves table)
- ✅ Button disabled immediately on click
- ✅ Loading spinner shows during save
- ✅ Toast notifications work correctly
- ✅ Mobile Safari experience improved
- ✅ Network logs show only 1 POST request

---

## Monitoring

### Database Query to Check for Duplicates

```sql
-- Find users with duplicate saves (same location saved multiple times within 10 seconds)
SELECT 
    us1.user_id,
    us1.location_id,
    l.name,
    l.place_id,
    COUNT(*) as duplicate_count,
    MIN(us1.saved_at) as first_save,
    MAX(us1.saved_at) as last_save,
    EXTRACT(EPOCH FROM (MAX(us1.saved_at) - MIN(us1.saved_at))) as seconds_between
FROM user_saves us1
JOIN locations l ON us1.location_id = l.id
GROUP BY us1.user_id, us1.location_id, l.name, l.place_id
HAVING COUNT(*) > 1
    AND EXTRACT(EPOCH FROM (MAX(us1.saved_at) - MIN(us1.saved_at))) < 10
ORDER BY duplicate_count DESC, last_save DESC;
```

### Log Monitoring

Add logging to track save attempts:

```typescript
// useSaveLocation.ts
mutationFn: async (data: SaveLocationData) => {
    const saveId = Date.now();
    console.log(`[Save ${saveId}] Starting save:`, data.placeId);
    
    const response = await fetch('/api/locations', {...});
    
    console.log(`[Save ${saveId}] Completed:`, response.status);
    return result;
}
```

---

## Next Steps

1. ✅ Document issue (this file)
2. ⏭️ Implement Phase 1 fixes (connect isPending state)
3. ⏭️ Test on mobile Safari
4. ⏭️ Implement Phase 2 (debouncing + overlay)
5. ⏭️ Add API duplicate detection
6. ⏭️ Monitor for duplicates in production

---

## Questions for User

1. **Desktop also affected?**
   - Have you noticed this on desktop browsers?
   - Or only mobile Safari?

2. **How to clean up duplicates?**
   - Do you want a script to delete the 4 duplicate saves?
   - Or manually delete via UI?

3. **Implementation priority?**
   - Implement all 3 phases now?
   - Or just Phase 1 (quick fix)?

4. **Other forms affected?**
   - Should we apply same fixes to:
     - Edit Location form
     - Photo upload
     - Delete actions

---

**Status**: Ready for implementation  
**Next Action**: Implement Phase 1 fixes (connect isPending state)
