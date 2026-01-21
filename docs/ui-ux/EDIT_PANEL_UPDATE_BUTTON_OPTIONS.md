# Edit Panel Update Button - Placement Options

**Date:** January 21, 2026  
**Context:** Update button placement for Edit Location Panel with hidden-until-changed pattern  
**Reference:** Profile page uses fixed bottom banner with unsaved changes tracking

---

## Current State

**Edit Location Panel Header:**
- Save button (indigo icon) in sticky header
- Always visible
- Part of header controls (Save, Camera, Indoor/Outdoor, Favorite, Close)

**Issue:**
- Mobile browser footer covers bottom-positioned buttons
- Want "hidden until changed" pattern like `/profile` page
- Need form dirty state tracking (`react-hook-form` `isDirty`)

---

## Option 1: Fixed Bottom Banner (Like Profile Page) ⭐ **RECOMMENDED**

### Description
Sticky banner appears at bottom of screen when form has unsaved changes. Slides up from bottom with animation. Includes "Discard" and "Save Changes" buttons.

### Visual Design
```
┌─────────────────────────────────────┐
│ Edit Location         📷 ☀️ 🏠 ❤️ ✕ │ ← Sticky header (NO save button)
├─────────────────────────────────────┤
│                                     │
│  [Form fields scroll here]          │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤ ← Fixed bottom banner
│ ⚠️ Unsaved changes                  │
│ • Location Name: Central Park       │
│ • Type: Park                        │
│                                     │
│         [Discard]  [Save Changes]   │
└─────────────────────────────────────┘
```

### Implementation

**1. Add `isDirty` tracking to EditLocationForm:**
```tsx
// EditLocationForm.tsx
const form = useForm<EditLocationFormData>({
    resolver: zodResolver(editLocationSchema),
    defaultValues: { /* ... */ },
});

const { isDirty, dirtyFields } = form.formState;

// Track what changed
useEffect(() => {
    const changedFields: string[] = [];
    if (dirtyFields.name) changedFields.push(`Name: ${form.watch('name')}`);
    if (dirtyFields.type) changedFields.push(`Type: ${form.watch('type')}`);
    if (dirtyFields.caption) changedFields.push('Caption updated');
    // etc...
    
    setChanges(changedFields);
    setHasChanges(isDirty);
}, [isDirty, dirtyFields, form]);
```

**2. Add banner component at bottom of EditLocationForm:**
```tsx
// EditLocationForm.tsx (at bottom of return)
{hasChanges && (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-50 dark:bg-amber-950/20 border-t-2 border-amber-500 p-3 sm:p-4 shadow-lg z-50 animate-in slide-in-from-bottom">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="font-semibold text-sm text-amber-900">
                        Unsaved changes
                    </p>
                </div>
                <ul className="text-xs text-amber-800 space-y-1">
                    {changes.slice(0, 3).map((change, i) => (
                        <li key={i}>• {change}</li>
                    ))}
                    {changes.length > 3 && (
                        <li>+{changes.length - 3} more...</li>
                    )}
                </ul>
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => form.reset()}
                    className="border-amber-300"
                >
                    Discard
                </Button>
                <Button
                    size="sm"
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                >
                    Save Changes
                </Button>
            </div>
        </div>
    </div>
)}
```

**3. Remove Save button from header:**
```tsx
// locations/page.tsx - Edit Panel header
<div className="flex items-center gap-1">
    {/* REMOVE Save Button - will be in bottom banner */}
    
    {/* Photo Upload Toggle */}
    <Button variant="ghost" size="icon" ... />
    
    {/* Indoor/Outdoor Toggle */}
    {/* Favorite Toggle */}
    {/* Close Button */}
</div>
```

### Pros
✅ Matches `/profile` UX pattern (consistency)  
✅ Clear visual feedback of what changed  
✅ Above mobile browser footer (safe zone)  
✅ "Discard" option prevents accidental changes  
✅ Prominent, hard to miss  
✅ Shows list of changed fields  

### Cons
❌ Takes up screen space when active  
❌ Covers bottom portion of form (user must scroll up)  
❌ Requires more code (change tracking)  

### Mobile Considerations
- Banner appears **above** mobile browser footer (90-100px from bottom)
- Use `bottom-0` with `pb-safe` if using safe-area-inset
- Responsive text sizes (text-xs on mobile, text-sm on desktop)
- Stack buttons vertically on small screens

---

## Option 2: Inline Button After Form (Simple Approach)

### Description
Simple "Update Location" button appears at the bottom of the form content, only visible when form is dirty. No sticky positioning, just part of scrollable content.

### Visual Design
```
┌─────────────────────────────────────┐
│ Edit Location         📷 ☀️ 🏠 ❤️ ✕ │ ← Sticky header (NO save button)
├─────────────────────────────────────┤
│                                     │
│  [Form fields]                      │
│  Location Name: _____________       │
│  Type: Park                         │
│  Caption: _______________           │
│  Tags: [urban] [nature]             │
│                                     │
│  ┌───────────────────────────────┐  │ ← Only appears if isDirty
│  │    💾 Update Location         │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Implementation

**1. Track isDirty in EditLocationForm:**
```tsx
const { isDirty } = form.formState;
```

**2. Add button at end of form (inside form tag):**
```tsx
// EditLocationForm.tsx (at bottom of form, before closing </form>)
{isDirty && (
    <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t pt-4 mt-6">
        <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
        >
            <Save className="w-4 h-4 mr-2" />
            Update Location
        </Button>
    </div>
)}
```

**3. Remove Save button from header** (same as Option 1)

### Pros
✅ Simple implementation  
✅ Less code than Option 1  
✅ Part of natural form flow  
✅ Sticky within scrollable area  
✅ No screen space taken when no changes  

### Cons
❌ User must scroll to bottom to save  
❌ No "Discard" option  
❌ No visual list of what changed  
❌ Less discoverable than fixed banner  

### Mobile Considerations
- Use `sticky bottom-0` within scrollable container
- Add backdrop-blur for glass effect
- Full-width button on mobile
- Size="lg" for easy touch target (44px min height)

---

## Option 3: Floating Action Button (FAB)

### Description
Material Design style floating button appears in bottom-right corner when form has changes. Hovers above content with prominent shadow.

### Visual Design
```
┌─────────────────────────────────────┐
│ Edit Location         📷 ☀️ 🏠 ❤️ ✕ │ ← Sticky header (NO save button)
├─────────────────────────────────────┤
│                                     │
│  [Form fields scroll here]          │
│                                     │
│  Location Name: _____________       │
│  Type: Park                         │
│  Caption: _______________           │
│                                     │
│                               ┌───┐ │ ← Floating Action Button
│                               │ ✓ │ │   (bottom-right corner)
│                               └───┘ │
└─────────────────────────────────────┘
```

### Implementation

**1. Track isDirty in EditLocationForm:**
```tsx
const { isDirty } = form.formState;
```

**2. Add FAB component:**
```tsx
// EditLocationForm.tsx (after closing </form> tag, as sibling)
{isDirty && (
    <div className="fixed bottom-20 right-6 z-40 animate-in fade-in slide-in-from-bottom-2">
        <Button
            type="submit"
            form="edit-location-form"
            size="lg"
            className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all"
            title="Save changes"
        >
            <Save className="w-6 h-6 text-white" />
        </Button>
        
        {/* Optional: Discard button below */}
        <Button
            variant="outline"
            size="sm"
            onClick={() => form.reset()}
            className="mt-2 w-full rounded-full text-xs"
        >
            Discard
        </Button>
    </div>
)}
```

**3. Remove Save button from header** (same as Option 1)

### Pros
✅ Always visible while scrolling  
✅ Doesn't cover content  
✅ Modern, mobile-friendly pattern  
✅ Above mobile browser footer  
✅ Quick access  

### Cons
❌ Can obscure content in bottom-right  
❌ No context of what changed  
❌ Less conventional for forms  
❌ Might interfere with other floating elements  

### Mobile Considerations
- Position `bottom-20` (80px) to clear mobile footer
- Use `right-4` or `right-6` for safe margin
- Large touch target (56x56px minimum)
- Consider haptic feedback on press
- Optional: Show/hide on scroll direction

---

## Comparison Table

| Feature | Option 1: Banner | Option 2: Inline | Option 3: FAB |
|---------|------------------|------------------|---------------|
| **Visibility** | High | Medium | High |
| **Mobile Safety** | ✅ Safe | ✅ Safe | ✅ Safe |
| **Shows Changes** | ✅ Yes | ❌ No | ❌ No |
| **Discard Option** | ✅ Yes | ❌ No | ✅ Optional |
| **Screen Space** | Medium | Low | Low |
| **Scroll Required** | ❌ No | ✅ Yes | ❌ No |
| **Implementation Complexity** | High | Low | Medium |
| **UX Consistency** | ✅ Matches `/profile` | Standard | Modern |
| **Discoverability** | ✅ High | Medium | High |

---

## Recommendation: Option 1 (Fixed Bottom Banner) ⭐

### Why This is Best

1. **Consistency:** Matches the `/profile` page pattern users already know
2. **Safe Zone:** Guaranteed above mobile browser footer
3. **Context:** Shows what fields changed (prevents confusion)
4. **Safety:** "Discard" button prevents accidental saves
5. **Visibility:** Can't be missed, prominent visual feedback
6. **Professional:** Standard pattern in modern web apps

### Implementation Priority

**Phase 1: Core Functionality**
- [ ] Add `isDirty` and `dirtyFields` tracking to `EditLocationForm`
- [ ] Create change tracking logic (map dirty fields to readable labels)
- [ ] Add fixed bottom banner component with conditional render
- [ ] Remove Save button from sticky header

**Phase 2: Polish**
- [ ] Add slide-in animation (`animate-in slide-in-from-bottom`)
- [ ] Responsive styling (mobile vs desktop)
- [ ] Dark mode support
- [ ] Limit changes list to 3 items + "X more..."

**Phase 3: Enhancement**
- [ ] Add confirmation dialog on "Discard" if many changes
- [ ] Auto-dismiss banner after successful save
- [ ] Add keyboard shortcut (Cmd+S / Ctrl+S to save)
- [ ] Warn before closing panel if unsaved changes

---

## Code Files to Modify

### Option 1 Implementation

1. **`/src/components/locations/EditLocationForm.tsx`**
   - Add `hasChanges` and `changes` state
   - Add useEffect to track dirty fields
   - Add fixed bottom banner JSX
   - Add handleDiscard function

2. **`/src/app/locations/page.tsx`**
   - Remove Save button from Edit Panel header
   - Keep other controls (Camera, Indoor/Outdoor, Favorite, Close)

3. **Optional: Create reusable component**
   - `/src/components/ui/UnsavedChangesBanner.tsx`
   - Reusable across Edit Panel, Profile, etc.

---

## Testing Checklist

**Functionality:**
- [ ] Banner appears when any field is edited
- [ ] Banner shows correct list of changed fields
- [ ] "Discard" button resets form to original values
- [ ] "Save Changes" button submits form
- [ ] Banner disappears after successful save
- [ ] Banner disappears after discard

**Mobile:**
- [ ] Banner appears above browser footer (iPhone Safari, Chrome)
- [ ] Banner is readable on small screens
- [ ] Buttons are easily tappable (44px min)
- [ ] Content scrolls properly with banner visible

**Edge Cases:**
- [ ] Works with photo uploads
- [ ] Works with tag editing
- [ ] Handles form validation errors
- [ ] Warns before closing panel with unsaved changes

---

## Alternative: Hybrid Approach

**Combine Option 1 + Option 3:**

- **Desktop:** Fixed bottom banner (full context, Discard + Save)
- **Mobile:** FAB (less screen space, quick access)

```tsx
{hasChanges && (
    <>
        {/* Desktop: Full banner */}
        <div className="hidden sm:block fixed bottom-0 ...">
            {/* Full banner with change list */}
        </div>
        
        {/* Mobile: FAB */}
        <div className="sm:hidden fixed bottom-20 right-4 ...">
            <Button ... />
        </div>
    </>
)}
```

This gives best of both worlds but adds complexity.

---

## Status: Awaiting Decision

**Next Steps:**
1. User selects preferred option (1, 2, or 3)
2. Implement chosen option
3. Test on mobile devices
4. Deploy to production

**Questions:**
- Do you prefer Option 1's detail vs Option 3's simplicity?
- Should we add confirmation before discarding changes?
- Any other UX patterns you'd like to consider?
