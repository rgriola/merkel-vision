# Edit Location Panel - Maximum Update Depth Error Fix

**Date:** January 21, 2026  
**Error:** Maximum update depth exceeded - Infinite loop  
**Status:** ✅ Fixed

---

## Error Details

### Symptoms

**Error Message:**
```
Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate. 
React limits the number of nested updates to prevent infinite loops.
```

**Error Stack:**
```
at SelectTrigger (src/components/ui/select.tsx:36:5)
at EditLocationForm (src/components/locations/EditLocationForm.tsx:414:33)
at EditLocationPanel (src/components/panels/EditLocationPanel.tsx:60:17)
at LocationsPageInner (src/app/locations/page.tsx:315:29)
```

**When It Occurred:**
- Opening Edit Location Panel from `/locations` page
- Clicking "Edit" button on any location card
- Panel would crash immediately with infinite loop error

---

## Root Cause

### The Problem: `form.watch()` in `useEffect`

The change tracking `useEffect` was calling `form.watch()` inside the effect body:

```tsx
// ❌ CAUSED INFINITE LOOP
useEffect(() => {
    const { isDirty, dirtyFields } = form.formState;
    
    if (dirtyFields.name) {
        const newName = form.watch("name");  // ← Triggers re-render!
        changedFields.push(`Name: ${newName}`);
    }
    // ... more form.watch() calls ...
    
    setChanges(changedFields);  // ← setState triggers effect again
    setHasChanges(true);
}, [form.formState, form, tags, ...]);  // ← 'form' dependency
```

### Why It Caused Infinite Loop

1. **Initial render:** Component mounts, useEffect runs
2. **Effect calls `form.watch()`:** Subscribes to form field changes
3. **`form.watch()` triggers re-render:** React Hook Form internal state update
4. **Re-render triggers effect:** Because `form` is in dependency array
5. **Effect runs again:** Calls `form.watch()` again
6. **Loop continues:** Steps 3-5 repeat infinitely
7. **React throws error:** After ~50 iterations, React limits nested updates

### React Hook Form Compiler Warning

React Hook Form's documentation warns about this:

```
React Compiler Warning: Use of incompatible library
React Hook Form's useForm() API returns a watch() function 
which cannot be memoized safely.
```

---

## Solution

### Use `useWatch` Hook Instead

Replace all `form.watch()` calls with `useWatch` hook, which is designed for this use case:

```tsx
// ✅ CORRECT APPROACH
import { useForm, useWatch } from "react-hook-form";

// Watch form values OUTSIDE useEffect
const watchedName = useWatch({ control: form.control, name: "name" });
const watchedType = useWatch({ control: form.control, name: "type" });
const watchedPersonalRating = useWatch({ control: form.control, name: "personalRating" });
// ... etc

// Use watched values IN useEffect
useEffect(() => {
    const { isDirty, dirtyFields } = form.formState;
    
    if (dirtyFields.name) {
        changedFields.push(`Name: ${watchedName || '(empty)'}`);  // ✅ Use watched value
    }
    
    setChanges(changedFields);
    setHasChanges(true);
}, [
    form.formState.isDirty,      // ✅ Specific property
    form.formState.dirtyFields,  // ✅ Specific property
    watchedName,                 // ✅ Watched value
    watchedType,
    // ... other watched values
]);  // ❌ DON'T include 'form' object
```

---

## Implementation Details

### Changes Made

**File:** `/src/components/locations/EditLocationForm.tsx`

#### 1. Import `useWatch`

```tsx
import { useForm, useWatch } from "react-hook-form";
```

#### 2. Add `useWatch` Hooks for All Tracked Fields

```tsx
// Watch form values using useWatch to avoid infinite loops
const watchedName = useWatch({ control: form.control, name: "name" });
const watchedType = useWatch({ control: form.control, name: "type" });
const watchedCaption = useWatch({ control: form.control, name: "caption" });
const watchedProductionNotes = useWatch({ control: form.control, name: "productionNotes" });
const watchedPersonalRating = useWatch({ control: form.control, name: "personalRating" });
const watchedIndoorOutdoor = useWatch({ control: form.control, name: "indoorOutdoor" });
const watchedParking = useWatch({ control: form.control, name: "parking" });
const watchedEntryPoint = useWatch({ control: form.control, name: "entryPoint" });
const watchedAccess = useWatch({ control: form.control, name: "access" });
```

#### 3. Replace `form.watch()` Calls in useEffect

**Before:**
```tsx
if (dirtyFields.name) {
    const newName = form.watch("name");  // ❌ Infinite loop
    changedFields.push(`Name: ${newName || '(empty)'}`);
}
```

**After:**
```tsx
if (dirtyFields.name) {
    changedFields.push(`Name: ${watchedName || '(empty)'}`);  // ✅ Safe
}
```

#### 4. Fix Dependency Array

**Before:**
```tsx
}, [form.formState, form, tags, userSave.tags, photosToDelete.length]);
//   ^^^^^^^^^^^^  ^^^^ 
//   Objects that change every render
```

**After:**
```tsx
}, [
    form.formState.isDirty,      // Specific property
    form.formState.dirtyFields,  // Specific property
    watchedName,                 // Watched value
    watchedType,
    watchedCaption,
    watchedProductionNotes,
    watchedPersonalRating,
    watchedParking,
    watchedEntryPoint,
    watchedAccess,
    watchedIndoorOutdoor,
    tags,
    userSave.tags,
    photosToDelete.length
]);
```

#### 5. Fix Character Count Helper

**Before:**
```tsx
const productionNotesCount = form.watch("productionNotes")?.length || 0;  // ❌
```

**After:**
```tsx
const productionNotesCount = watchedProductionNotes?.length || 0;  // ✅
```

---

## Technical Explanation

### Why `useWatch` Works

1. **Designed for Subscriptions:** `useWatch` is specifically designed to subscribe to form field changes
2. **Memoized Internally:** React Hook Form handles memoization internally
3. **Stable Reference:** Returns stable values that don't cause re-renders
4. **Optimized:** Only re-renders when the watched field actually changes

### Why `form.watch()` Doesn't Work in Effects

1. **Function Call Every Render:** `form.watch()` is a function that runs on every render
2. **Subscription Side Effect:** Calling it subscribes to field changes (side effect)
3. **Triggers Re-render:** Subscription causes internal state updates
4. **Not Memoized:** Cannot be safely memoized by React Compiler

---

## Testing Checklist

- [x] Edit Panel opens without error
- [x] No "Maximum update depth exceeded" error
- [x] Change tracking works correctly
- [x] Banner appears when fields are edited
- [x] Banner shows correct list of changed fields
- [x] "Discard" button resets form
- [x] "Save Changes" button submits form
- [x] Character count for production notes works
- [x] All form fields tracked properly

---

## Impact

### Before Fix

- ❌ Edit Panel crashed on open
- ❌ Infinite loop error in console
- ❌ SelectTrigger component errors
- ❌ Cannot edit any locations
- ❌ Application unusable for editing

### After Fix

- ✅ Edit Panel opens smoothly
- ✅ No infinite loop errors
- ✅ Change tracking works perfectly
- ✅ Banner appears/disappears correctly
- ✅ All form functionality restored

---

## Lessons Learned

### Best Practices

1. **Never call `form.watch()` inside `useEffect`**
   - Use `useWatch` hook instead
   - Call `useWatch` at component top level

2. **Be specific with dependencies**
   - Use `form.formState.isDirty` instead of `form.formState`
   - Use `form.formState.dirtyFields` instead of `form`

3. **Read React Hook Form warnings**
   - Compiler warnings about `watch()` are serious
   - Follow recommended patterns in docs

4. **Test form interactions thoroughly**
   - Open/close panels
   - Edit multiple fields
   - Check for infinite loops in React DevTools

### Common Pitfalls

❌ **Don't:**
```tsx
useEffect(() => {
    const value = form.watch("field");  // Infinite loop!
}, [form]);
```

✅ **Do:**
```tsx
const watchedValue = useWatch({ control: form.control, name: "field" });

useEffect(() => {
    // Use watchedValue here
}, [watchedValue]);
```

---

## Related Issues

**Similar Errors:**
- "Too many re-renders" in React
- "Maximum call stack size exceeded"
- "Component is re-rendering too frequently"

**Related Files:**
- `/src/components/locations/EditLocationForm.tsx` - Fixed
- `/src/components/profile/AccountSettingsForm.tsx` - Reference (correct pattern)

---

## Prevention Strategy

### Code Review Checklist

When reviewing forms with `useEffect`:

- [ ] Check for `form.watch()` calls inside effects
- [ ] Verify `useWatch` is used for subscriptions
- [ ] Ensure dependency arrays are specific (not entire objects)
- [ ] Test opening/closing forms multiple times
- [ ] Check React DevTools for excessive re-renders

### ESLint Rule Suggestion

Consider adding a custom ESLint rule to catch this:

```js
// .eslintrc.js
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.property.name='watch']",
        "message": "Avoid using form.watch() in useEffect. Use useWatch hook instead."
      }
    ]
  }
}
```

---

## Status: ✅ Fixed and Tested

The Edit Location Panel now:
- Opens without errors
- Tracks changes correctly
- Displays unsaved changes banner
- Submits and discards changes properly
- No infinite loops or excessive re-renders

**Commit:** `5d57714` - "fix: resolve infinite loop in EditLocationForm change tracking"
