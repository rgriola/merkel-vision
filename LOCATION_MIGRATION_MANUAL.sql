-- MANUAL MIGRATION: Make Locations User-Specific
-- Run this SQL directly in your database before applying schema changes
-- This handles existing data gracefully

-- STEP 1: Add locationId column to photos (nullable initially)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'locationId'
    ) THEN
        ALTER TABLE "photos" ADD COLUMN "locationId" INTEGER;
    END IF;
END $$;

-- STEP 2: For each photo, assign it to the location created by its uploader
-- This ensures photos stay with the correct user's location
UPDATE "photos" p
SET "locationId" = (
    SELECT l.id 
    FROM "locations" l 
    WHERE l."placeId" = p."placeId" 
      AND l."createdBy" = p."userId"
    LIMIT 1
)
WHERE p."userId" IS NOT NULL
  AND p."locationId" IS NULL;

-- STEP 3: For photos without userId (shouldn't happen but just in case)
-- Assign to ANY location with that placeId
UPDATE "photos" p
SET "locationId" = (
    SELECT l.id 
    FROM "locations" l 
    WHERE l."placeId" = p."placeId"
    LIMIT 1
)
WHERE p."locationId" IS NULL;

-- STEP 4: Drop the unique constraint on placeId
ALTER TABLE "locations" DROP CONSTRAINT IF EXISTS "locations_placeId_key";

-- STEP 5: Add index on placeId (for lookups)
CREATE INDEX IF NOT EXISTS "locations_placeId_idx" ON "locations"("placeId");

-- STEP 6: Add unique constraint on (createdBy, placeId)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'locations_createdBy_placeId_key'
    ) THEN
        ALTER TABLE "locations" ADD CONSTRAINT "locations_createdBy_placeId_key" 
            UNIQUE ("createdBy", "placeId");
    END IF;
END $$;

-- STEP 7: Make locationId NOT NULL (now that it's populated)
ALTER TABLE "photos" ALTER COLUMN "locationId" SET NOT NULL;

-- STEP 8: Add index on locationId
CREATE INDEX IF NOT EXISTS "photos_locationId_idx" ON "photos"("locationId");

-- STEP 9: Add foreign key from photos to locations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'photos_locationId_fkey'
    ) THEN
        ALTER TABLE "photos" ADD CONSTRAINT "photos_locationId_fkey" 
            FOREIGN KEY ("locationId") REFERENCES "locations"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- VERIFICATION QUERIES
-- Run these to verify the migration worked:

-- 1. Check all photos have locationId
SELECT 
    COUNT(*) as total_photos,
    COUNT("locationId") as photos_with_location,
    COUNT(*) - COUNT("locationId") as photos_missing_location
FROM "photos";

-- 2. Check for duplicate user+placeId (should be 0)
SELECT "createdBy", "placeId", COUNT(*) as duplicate_count
FROM "locations"
GROUP BY "createdBy", "placeId"
HAVING COUNT(*) > 1;

-- 3. Show summary
SELECT 
    (SELECT COUNT(*) FROM "locations") as total_locations,
    (SELECT COUNT(*) FROM "photos") as total_photos,
    (SELECT COUNT(DISTINCT "placeId") FROM "locations") as unique_places,
    (SELECT COUNT(DISTINCT "createdBy") FROM "locations") as users_with_locations;

PRINT '✅ Migration complete! Schema is now user-specific.';
