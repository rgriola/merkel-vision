# fotolokashen-Camera — Implementation Plan (snapshot)

Purpose

- Capture the decisions, required backend changes, configuration, and first tasks for the fotolokashen-Camera iOS companion app. Use this file as the authoritative implementation plan if coordination or errors occur.

Overview

- Target iOS: 16
- UI: SwiftUI
- Architecture: MVVM + Swift Concurrency (async/await)
- Maps: Google Maps iOS SDK
- Camera: AVFoundation (camera-first flow)
- Location: CoreLocation (WhenInUse)
- Persistence: Core Data (local drafts + photo references)
- Auth: Reuse fotolokashen auth (Authorization Code + PKCE); tokens in Keychain
- Sync: Manual-first with local draft queue; uploads on user demand

Config (editable: Config.plist or config.json)

- maxPhotosPerLocation: 20
- uploadTargetBytes: 1500000
- compressionQualityStart: 0.9
- compressionQualityFloor: 0.4
- compressionMaxDimension: 3000
- backendBaseURL: <https://staging.api.fotolokashen.example>
- googleMapsAPIKey: <ADD_AT_BUILD>

Image compression algorithm

- Resize to maxDimension while keeping aspect ratio
- Compress to JPEG starting at compressionQualityStart
- If result > uploadTargetBytes, reduce quality stepwise until <= target or until compressionQualityFloor
- Make all parameters configurable via the config file

Required fotolokashen backend changes / API requirements

- Auth endpoints that support OAuth2 Authorization Code + PKCE and token exchange for mobile
- Endpoint: POST /locations — create location metadata (accepts location fields and returns created location id)
- Endpoint: POST /locations/{id}/uploads — returns signed upload URL(s) for images or multipart upload instructions
- Endpoint: GET /locations/{id} — returns location with image references
- Upload behavior: server returns pre-signed URL(s) for direct upload to storage (S3/GCS) and an API to notify when upload completes
- Pagination and rate-limit headers for listing locations
- Staging base URL and a test client (or API key) for development (do not provide production keys here)

Data model (high level)

- LocationDraft (local): id, title, notes, lat, lon, accuracy, timestamp, heading, orientation, photos[PhotoDraft]
- PhotoDraft: localPath/originalRef, compressedPath, uploadState (pending/failed/done), size
- Location (server): id, ownerId, lat, lon, photos[URL], metadata

Minimum viable features (MVP)

1. Camera-first capture flow (camera opens on start; capture photo; capture best-available location at capture time)
2. Option to choose a photo from Photo Library
3. Create LocationDraft, allow editing title/notes/tags
4. Local save (Core Data) and manual "Sync" to upload drafts to fotolokashen
5. Show list/map of saved locations (map uses Google Maps SDK)
6. Image compression and configurable parameters

First implementation tasks (recommended order)

- Task A: Camera + PhotoPicker + Location capture (CameraSession + PhotoPicker + LocationManager + SwiftUI CameraCaptureView)
- Task C: ImageCompressor module + Config loader
- Task B: Core Data model & LocationDraft CRUD
- Task D: AuthService skeleton (PKCE flow) and Keychain token storage
- Task E: APIClient + UploadManager (create-location, request signed URLs, upload images, notify server)
- Map & list views, sync UI, account linking, analytics

Analytics & crash reporting

- Recommendation: Sentry for crash reporting; Amplitude (or PostHog) for analytics/events

Admin & governance

- Admin functions are best implemented in the fotolokashen web app (user management, moderation, configuration toggles). Mobile should consume admin-config flags from the backend if needed.

Notes and next steps for you

1. Add the backend features listed above to fotolokashen staging or provide API docs + staging creds (safer to provide a test client or mock server). Do not post secrets here.
2. Add Google Maps API key to project/CI when ready.
3. Confirm whether originals should be preserved locally alongside compressed copies.
4. When ready, tell me which task to start (recommended: "Start A+C").

Contact

- Keep this file as our single source of truth for decisions and required backend changes. If plans change, update this file before implementing.

-- fotolokashen-Camera planning snapshot
