# Mobile API Documentation (v1)

## Base URL
```
https://fotolokashen.com/api/v1
http://localhost:3000/api/v1 (development)
```

## API Versioning
All mobile endpoints are prefixed with `/api/v1/` to support future API changes without breaking existing iOS apps.

---

## Authentication
Currently PUBLIC endpoints (no authentication required).
Phase 2 will add Bearer token authentication via OAuth2/PKCE.

---

## Endpoints

### 1. Get User Profile

**GET** `/api/v1/users/:username`

Get public profile information for a user.

#### Parameters
- `username` (path, required): Username with or without @ prefix

#### Response Headers
- `Cache-Control`: `public, s-maxage=60, stale-while-revalidate=120`
- `X-API-Version`: `1.0`

#### Success Response (200 OK)
```json
{
  "id": 1,
  "username": "john_doe",
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://ik.imagekit.io/.../avatar.jpg",
  "bannerImage": "https://ik.imagekit.io/.../banner.jpg",
  "bio": "Professional photographer based in Portland",
  "publicLocationCount": 42,
  "joinedAt": "2024-01-15T08:30:00.000Z",
  "profileUrl": "/@john_doe"
}
```

#### Error Responses

**404 Not Found** - User doesn't exist
```json
{
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch user",
  "code": "INTERNAL_ERROR"
}
```

---

### 2. Get User's Public Locations

**GET** `/api/v1/users/:username/locations`

Get paginated list of user's public locations.

#### Parameters
- `username` (path, required): Username with or without @ prefix
- `page` (query, optional): Page number (default: 1, min: 1)
- `limit` (query, optional): Items per page (default: 20, min: 1, max: 100)

#### Response Headers
- `Cache-Control`: `public, s-maxage=30, stale-while-revalidate=60`
- `X-API-Version`: `1.0`
- `X-Total-Count`: Total number of public locations
- `X-Page`: Current page number
- `X-Per-Page`: Items per page

#### Success Response (200 OK)
```json
{
  "locations": [
    {
      "id": 123,
      "caption": "Amazing sunset spot!",
      "savedAt": "2024-12-15T19:30:00.000Z",
      "location": {
        "id": 456,
        "name": "Cannon Beach",
        "address": "123 Beach St",
        "city": "Cannon Beach",
        "state": "OR",
        "country": "USA",
        "latitude": 45.8918,
        "longitude": -123.9615,
        "type": "outdoor",
        "subtype": "beach",
        "photos": [
          {
            "id": 789,
            "url": "https://ik.imagekit.io/.../photo.jpg",
            "thumbnailUrl": "https://ik.imagekit.io/.../tr:w-400/photo.jpg",
            "order": 0
          }
        ]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasMore": true
  },
  "user": {
    "username": "john_doe",
    "profileUrl": "/@john_doe"
  }
}
```

#### Error Responses

**404 Not Found** - User doesn't exist
```json
{
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch locations",
  "code": "INTERNAL_ERROR"
}
```

---

## Privacy & Visibility

Only locations with `visibility: 'public'` are returned via the API.

Visibility levels:
- `public`: Visible to everyone, appears in API responses
- `unlisted`: Accessible via direct link only (future)
- `private`: Only visible to the owner (not returned by API)

---

## Rate Limiting

**Current**: No rate limiting (Phase 1)

**Phase 2 Plan**:
- 100 requests/minute per IP (unauthenticated)
- 1000 requests/minute per user (authenticated)
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Testing Examples

### cURL Examples

```bash
# Get user profile
curl -i https://fotolokashen.com/api/v1/users/john_doe

# Get user profile (with @ prefix)
curl -i https://fotolokashen.com/api/v1/users/@john_doe

# Get user's locations (first page)
curl -i https://fotolokashen.com/api/v1/users/john_doe/locations

# Get user's locations (page 2, 10 items per page)
curl -i "https://fotolokashen.com/api/v1/users/john_doe/locations?page=2&limit=10"

# Check headers
curl -I https://fotolokashen.com/api/v1/users/john_doe
```

### Local Development Testing

```bash
# Start dev server
npm run dev

# Test profile endpoint
curl -i http://localhost:3000/api/v1/users/john_doe

# Test locations endpoint
curl -i "http://localhost:3000/api/v1/users/john_doe/locations?limit=5"

# Pretty print JSON
curl -s http://localhost:3000/api/v1/users/john_doe | jq .
```

---

## iOS Integration Notes

### URL Construction
```swift
let baseURL = "https://fotolokashen.com/api/v1"
let username = "john_doe"

// Profile endpoint
let profileURL = URL(string: "\(baseURL)/users/\(username)")!

// Locations endpoint with pagination
var components = URLComponents(string: "\(baseURL)/users/\(username)/locations")!
components.queryItems = [
    URLQueryItem(name: "page", value: "1"),
    URLQueryItem(name: "limit", value: "20")
]
let locationsURL = components.url!
```

### Response Parsing
```swift
struct UserProfile: Codable {
    let id: Int
    let username: String
    let displayName: String
    let firstName: String?
    let lastName: String?
    let avatar: String?
    let bannerImage: String?
    let bio: String?
    let publicLocationCount: Int
    let joinedAt: String
    let profileUrl: String
}

struct LocationsResponse: Codable {
    let locations: [UserLocation]
    let pagination: Pagination
    let user: UserInfo
}

struct Pagination: Codable {
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
    let hasMore: Bool
}
```

### Error Handling
```swift
enum APIError: Error {
    case userNotFound
    case internalError
    case networkError(Error)
    case decodingError(Error)
}

// Check status code
if response.statusCode == 404 {
    throw APIError.userNotFound
}
```

---

## Changelog

### v1.0 (Phase 1 - Current)
- ✅ GET /api/v1/users/:username
- ✅ GET /api/v1/users/:username/locations
- ✅ Pagination support
- ✅ Public visibility filtering
- ✅ Cache headers
- ⏳ No authentication required

### v1.1 (Phase 2 - Planned)
- Bearer token authentication
- Rate limiting headers
- OAuth2/PKCE endpoints
- Protected user data access
