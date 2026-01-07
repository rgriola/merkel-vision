-- Migration: Make Locations User-Specific
-- Date: 2026-01-02
-- Description: Change locations from shared (unique placeId) to user-specific (unique per user+placeId)

-- Step 1: Add locationId column to photos table (nullable for now)
ALTER TABLE "photos" ADD COLUMN "locationId" INTEGER;

-- Step 2: Create index on locationId before adding foreign key
CREATE INDEX "photos_locationId_idx" ON "photos"("locationId");

-- Step 3: Add index on placeId in locations table (for faster lookups)
CREATE INDEX "locations_placeId_idx" ON "locations"("placeId");

-- Step 4: Populate locationId in photos table based on placeId and userId
-- For each photo, find the location record created by the photo's uploader
UPDATE "photos" p
SET "locationId" = (
    SELECT l.id 
    FROM "locations" l 
    WHERE l."placeId" = p."placeId" 
    AND l."createdBy" = p."userId"
    LIMIT 1
)
WHERE p."userId" IS NOT NULL;

-- Step 5: For photos without a userId, assign to the first location with that placeId
UPDATE "photos" p
SET "locationId" = (
    SELECT l.id 
    FROM "locations" l 
    WHERE l."placeId" = p."placeId"
    LIMIT 1
)
WHERE "locationId" IS NULL;

-- Step 6: Drop the unique constraint on placeId
ALTER TABLE "locations" DROP CONSTRAINT IF EXISTS "locations_placeId_key";

-- Step 7: Add unique constraint on (createdBy, placeId)
ALTER TABLE "locations" ADD CONSTRAINT "locations_createdBy_placeId_key" UNIQUE ("createdBy", "placeId");

-- Step 8: Make locationId NOT NULL now that it's populated
ALTER TABLE "photos" ALTER COLUMN "locationId" SET NOT NULL;

-- Step 9: Add foreign key constraint from photos to locations
ALTER TABLE "photos" ADD CONSTRAINT "photos_locationId_fkey" 
    FOREIGN KEY ("locationId") REFERENCES "locations"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: Verify migration
-- Check that all photos have a locationId
SELECT COUNT(*) as photos_without_location FROM "photos" WHERE "locationId" IS NULL;

-- Check for duplicate user+placeId combinations (should be 0)
SELECT "createdBy", "placeId", COUNT(*) as count 
FROM "locations" 
GROUP BY "createdBy", "placeId" 
HAVING COUNT(*) > 1;

-- Show summary
SELECT 
    (SELECT COUNT(*) FROM "locations") as total_locations,
    (SELECT COUNT(*) FROM "photos") as total_photos,
    (SELECT COUNT(*) FROM "photos" WHERE "locationId" IS NOT NULL) as photos_with_location;
