# Day 4 Testing Guide

## Testing Checklist for Mobile APIs

### ✅ Prerequisites
- [ ] Development server running (`npm run dev`)
- [ ] Database has test users with public locations
- [ ] Prisma Client regenerated with latest schema

---

## Test Data Creation

### Option 1: Via Web UI
1. Register a test user: http://localhost:3000/register
2. Login and create some saved locations
3. Set visibility to "public" for some locations

### Option 2: Manual Database Insert
```sql
-- Create test user (if needed)
INSERT INTO users (username, email, "passwordHash", "firstName", "lastName", bio, "emailVerified")
VALUES ('test_user', 'test@example.com', '$2a$10$...', 'Test', 'User', 'Test bio for API testing', true);

-- Update existing saved locations to be public
UPDATE user_saves 
SET visibility = 'public', caption = 'Test caption for location'
WHERE "userId" = (SELECT id FROM users WHERE username = 'test_user')
LIMIT 3;
```

---

## Manual API Testing

### Test 1: Get User Profile

```bash
# Test with username
curl -i http://localhost:3000/api/v1/users/test_user

# Test with @ prefix
curl -i http://localhost:3000/api/v1/users/@test_user

# Pretty print
curl -s http://localhost:3000/api/v1/users/test_user | jq .
```

**Expected Response**:
```json
{
  "id": 1,
  "username": "test_user",
  "displayName": "Test User",
  "firstName": "Test",
  "lastName": "User",
  "avatar": null,
  "bannerImage": null,
  "bio": "Test bio for API testing",
  "publicLocationCount": 3,
  "joinedAt": "2024-01-15T08:30:00.000Z",
  "profileUrl": "/@test_user"
}
```

**Check**:
- [ ] Status code: 200
- [ ] Header `X-API-Version: 1.0`
- [ ] Header `Cache-Control` present
- [ ] `publicLocationCount` matches number of public saves
- [ ] `@` prefix in username works

### Test 2: Get User Locations (Default Pagination)

```bash
curl -s http://localhost:3000/api/v1/users/test_user/locations | jq .
```

**Expected Response**:
```json
{
  "locations": [
    {
      "id": 123,
      "caption": "Test caption for location",
      "savedAt": "2024-12-15T19:30:00.000Z",
      "location": {
        "id": 456,
        "name": "Test Location",
        "address": "123 Test St",
        "city": "Portland",
        "state": "OR",
        "country": "USA",
        "latitude": 45.5152,
        "longitude": -122.6784,
        "type": "outdoor",
        "subtype": null,
        "photos": [...]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1,
    "hasMore": false
  },
  "user": {
    "username": "test_user",
    "profileUrl": "/@test_user"
  }
}
```

**Check**:
- [ ] Status code: 200
- [ ] Header `X-Total-Count` matches `pagination.total`
- [ ] Header `X-Page: 1`
- [ ] Header `X-Per-Page: 20`
- [ ] Only public locations returned (visibility = 'public')
- [ ] Locations sorted by `savedAt DESC` (newest first)

### Test 3: Pagination

```bash
# Get 2 items per page
curl -s "http://localhost:3000/api/v1/users/test_user/locations?limit=2" | jq '.pagination'

# Get page 2
curl -s "http://localhost:3000/api/v1/users/test_user/locations?page=2&limit=2" | jq '.pagination'
```

**Check**:
- [ ] `limit` parameter works (max 2 items returned)
- [ ] `page` parameter works (different items on page 2)
- [ ] `hasMore: true` when more pages exist
- [ ] `hasMore: false` on last page
- [ ] `totalPages` calculated correctly (total / limit, rounded up)

### Test 4: Error Handling

```bash
# Non-existent user
curl -i http://localhost:3000/api/v1/users/nonexistent_user

# Expected: 404 with error message
```

**Check**:
- [ ] Status code: 404
- [ ] Response: `{"error": "User not found", "code": "USER_NOT_FOUND"}`

### Test 5: Edge Cases

```bash
# Page 0 (should default to 1)
curl -s "http://localhost:3000/api/v1/users/test_user/locations?page=0" | jq '.pagination.page'

# Negative page (should default to 1)
curl -s "http://localhost:3000/api/v1/users/test_user/locations?page=-5" | jq '.pagination.page'

# Limit > 100 (should cap at 100)
curl -s "http://localhost:3000/api/v1/users/test_user/locations?limit=999" | jq '.pagination.limit'

# Limit 0 (should default to 1)
curl -s "http://localhost:3000/api/v1/users/test_user/locations?limit=0" | jq '.pagination.limit'
```

**Check**:
- [ ] Invalid page defaults to 1
- [ ] Invalid limit defaults to 1
- [ ] Limit capped at 100

---

## Response Header Validation

### Check All Headers Present

```bash
curl -I http://localhost:3000/api/v1/users/test_user
```

**Expected Headers**:
```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, s-maxage=60, stale-while-revalidate=120
X-API-Version: 1.0
```

```bash
curl -I http://localhost:3000/api/v1/users/test_user/locations
```

**Expected Headers**:
```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, s-maxage=30, stale-while-revalidate=60
X-API-Version: 1.0
X-Total-Count: 3
X-Page: 1
X-Per-Page: 20
```

---

## Privacy Testing

### Verify Visibility Filtering

1. Create test user with mixed visibility locations:
   ```sql
   -- User has 3 saves: 1 public, 1 unlisted, 1 private
   UPDATE user_saves SET visibility = 'public' WHERE id = 1;
   UPDATE user_saves SET visibility = 'unlisted' WHERE id = 2;
   UPDATE user_saves SET visibility = 'private' WHERE id = 3;
   ```

2. Test API only returns public:
   ```bash
   curl -s http://localhost:3000/api/v1/users/test_user/locations | jq '.pagination.total'
   # Expected: 1 (only the public location)
   ```

**Check**:
- [ ] API returns ONLY `visibility: 'public'` locations
- [ ] `publicLocationCount` in profile matches public location count
- [ ] Unlisted and private locations NOT exposed

---

## Performance Testing

### Check Response Times

```bash
# Test profile endpoint
time curl -s http://localhost:3000/api/v1/users/test_user > /dev/null

# Test locations endpoint
time curl -s http://localhost:3000/api/v1/users/test_user/locations > /dev/null
```

**Expected**:
- [ ] Profile endpoint: < 200ms
- [ ] Locations endpoint: < 500ms (with photos)

### Cache Validation

```bash
# Make request twice, check if cached
curl -i http://localhost:3000/api/v1/users/test_user
sleep 1
curl -i http://localhost:3000/api/v1/users/test_user
```

**Check**:
- [ ] `Cache-Control` header present on both requests
- [ ] Response should be cacheable by CDN/browser

---

## TypeScript Compilation

### Check for Type Errors

```bash
# Build the project
npm run build
```

**Check**:
- [ ] No TypeScript errors in API routes
- [ ] Prisma types correctly generated
- [ ] Build completes successfully

---

## iOS Compatibility Testing

### Test JSON Structure

```bash
# Validate JSON structure matches iOS models
curl -s http://localhost:3000/api/v1/users/test_user | jq 'keys'
```

**Expected Keys**:
```json
[
  "avatar",
  "bannerImage",
  "bio",
  "displayName",
  "firstName",
  "id",
  "joinedAt",
  "lastName",
  "profileUrl",
  "publicLocationCount",
  "username"
]
```

**Check**:
- [ ] All keys use camelCase (not snake_case)
- [ ] Dates in ISO 8601 format
- [ ] URLs absolute (https://)
- [ ] No sensitive data exposed (email, passwordHash, etc.)

---

## Production Readiness

### Pre-Deployment Checklist

- [ ] All manual tests passing
- [ ] TypeScript compilation successful
- [ ] No console errors in dev server
- [ ] Privacy filtering working (only public locations)
- [ ] Pagination working correctly
- [ ] Error handling tested (404s, etc.)
- [ ] Headers correct (Cache-Control, X-API-Version, etc.)
- [ ] Response times acceptable
- [ ] Documentation complete

---

## Next Steps (Day 5)

Once all tests pass:

1. ✅ Commit Day 4 changes
2. ✅ Push to GitHub
3. ✅ Deploy to production (Vercel)
4. ✅ Test in production with real data
5. ✅ Update NAMESPACES_DECISIONS.md
6. 🎉 Complete Phase 1!

---

## Troubleshooting

### Issue: TypeScript errors about `visibility` field

**Solution**: Regenerate Prisma Client and restart dev server
```bash
rm -rf node_modules/.prisma
npx prisma generate
pkill -f "next dev"
npm run dev
```

### Issue: `publicLocationCount` always 0

**Solution**: Check if Prisma Client includes `_count` in select
```typescript
_count: {
  select: {
    savedLocations: {
      where: { visibility: 'public' }
    }
  }
}
```

### Issue: 404 for existing user

**Solution**: Check username normalization (case-insensitive)
```typescript
const normalizedUsername = normalizeUsername(username);
```

### Issue: Photos not loading

**Solution**: Check Photo model has `order` field
```sql
-- Add order column if missing
ALTER TABLE photos ADD COLUMN "order" INTEGER DEFAULT 0;
```
