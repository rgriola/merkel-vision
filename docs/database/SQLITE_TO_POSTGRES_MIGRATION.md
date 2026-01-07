# 🔄 Database Migration: SQLite (Render) → PostgreSQL (Vercel)

**Date:** January 7, 2026  
**Project:** Fotolokashen  
**Migration Type:** SQLite → PostgreSQL (Vercel Postgres/Neon)

---

## 🎯 **Overview**

Migrating from SQLite to PostgreSQL requires converting both the **schema** and **data** since they're different database engines.

**Challenges:**
- Different SQL syntax
- Different data types
- Auto-increment vs sequences
- Foreign key handling
- Date/time formats

**Good News:** With Prisma, this is much easier! ✅

---

## 📋 **Migration Methods**

### **Method 1: Prisma Migrate + Data Transfer** ⭐ **Recommended**

**Best for:** Prisma-based projects (like yours!)

**Time:** ~30 minutes  
**Difficulty:** Easy  
**Downtime:** ~5 minutes

---

### **Method 2: pgloader** 🚀 **Automated**

**Best for:** Large databases, automated migration

**Time:** ~15 minutes  
**Difficulty:** Medium  
**Downtime:** ~5 minutes

---

### **Method 3: Manual CSV Export/Import** 📊

**Best for:** Small databases, maximum control

**Time:** ~45 minutes  
**Difficulty:** Easy  
**Downtime:** ~10 minutes

---

## 🚀 **Method 1: Prisma Migrate + Data Transfer** (Recommended)

### **Step 1: Setup Vercel Postgres** (5 min)

1. **Create Vercel Postgres Database:**
   - Vercel Dashboard → Your Project → **Storage** tab
   - Click **Create Database** → Select **Postgres**
   - Choose region (e.g., Washington, D.C.)
   - Click **Connect**

2. **Get Connection Strings:**
   - Vercel auto-adds these to your project:
     - `POSTGRES_PRISMA_URL` (pooled)
     - `POSTGRES_URL_NON_POOLING` (direct)

3. **Update Local `.env.local`:**
   ```bash
   # Add these from Vercel dashboard
   POSTGRES_PRISMA_URL="postgresql://..."
   POSTGRES_URL_NON_POOLING="postgresql://..."
   ```

---

### **Step 2: Update Prisma Schema** (2 min)

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"  // Changed from "sqlite"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}

// Rest of your schema stays the same!
```

**Important Changes:**

```diff
// Before (SQLite)
- provider = "sqlite"
- url      = env("DATABASE_URL")

// After (PostgreSQL)
+ provider  = "postgresql"
+ url       = env("POSTGRES_PRISMA_URL")
+ directUrl = env("POSTGRES_URL_NON_POOLING")
```

---

### **Step 3: Generate New Prisma Client** (1 min)

```bash
# Generate Prisma Client for PostgreSQL
npx prisma generate
```

---

### **Step 4: Create PostgreSQL Schema** (2 min)

```bash
# Push schema to Vercel Postgres
npx prisma db push

# This creates all tables, indexes, and constraints
```

**Verify:**
```bash
# Open Prisma Studio to see empty tables
npx prisma studio
```

---

### **Step 5: Export Data from SQLite** (5 min)

Create a migration script: `scripts/export-sqlite-data.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

// Connect to SQLite (Render)
const sqlite = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db' // Or your Render SQLite path
    }
  }
});

async function exportData() {
  console.log('📦 Exporting data from SQLite...');

  const data = {
    users: await sqlite.user.findMany(),
    sessions: await sqlite.session.findMany(),
    locations: await sqlite.location.findMany(),
    photos: await sqlite.photo.findMany(),
    userSaves: await sqlite.userSave.findMany(),
    securityLogs: await sqlite.securityLog.findMany(),
  };

  // Save to JSON file
  fs.writeFileSync(
    'migration-data.json',
    JSON.stringify(data, null, 2)
  );

  console.log('✅ Data exported to migration-data.json');
  console.log(`   Users: ${data.users.length}`);
  console.log(`   Locations: ${data.locations.length}`);
  console.log(`   Photos: ${data.photos.length}`);
  console.log(`   User Saves: ${data.userSaves.length}`);

  await sqlite.$disconnect();
}

exportData().catch(console.error);
```

**Run export:**
```bash
# If SQLite is on Render, download it first
# Then run:
npx ts-node scripts/export-sqlite-data.ts
```

---

### **Step 6: Import Data to PostgreSQL** (5 min)

Create import script: `scripts/import-to-postgres.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

// Connect to PostgreSQL (Vercel)
const postgres = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL_NON_POOLING
    }
  }
});

async function importData() {
  console.log('📥 Importing data to PostgreSQL...');

  // Read exported data
  const data = JSON.parse(
    fs.readFileSync('migration-data.json', 'utf-8')
  );

  // Import in correct order (respect foreign keys)
  
  // 1. Users first (no dependencies)
  console.log('Importing users...');
  for (const user of data.users) {
    await postgres.user.create({ data: user });
  }

  // 2. Sessions (depends on users)
  console.log('Importing sessions...');
  for (const session of data.sessions) {
    await postgres.session.create({ data: session });
  }

  // 3. Locations (depends on users)
  console.log('Importing locations...');
  for (const location of data.locations) {
    await postgres.location.create({ data: location });
  }

  // 4. Photos (depends on users and locations)
  console.log('Importing photos...');
  for (const photo of data.photos) {
    await postgres.photo.create({ data: photo });
  }

  // 5. User Saves (depends on users and locations)
  console.log('Importing user saves...');
  for (const save of data.userSaves) {
    await postgres.userSave.create({ data: save });
  }

  // 6. Security Logs (depends on users)
  console.log('Importing security logs...');
  for (const log of data.securityLogs) {
    await postgres.securityLog.create({ data: log });
  }

  console.log('✅ Import complete!');

  await postgres.$disconnect();
}

importData().catch(console.error);
```

**Run import:**
```bash
npx ts-node scripts/import-to-postgres.ts
```

---

### **Step 7: Verify Migration** (5 min)

```bash
# Open Prisma Studio
npx prisma studio

# Check row counts match
# Verify data integrity
# Test relationships
```

**SQL Verification:**
```bash
# Connect to Vercel Postgres
psql "$POSTGRES_URL_NON_POOLING"

# Check counts
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Location";
SELECT COUNT(*) FROM "Photo";

# Verify data
SELECT * FROM "User" LIMIT 5;

\q
```

---

### **Step 8: Test Application** (5 min)

```bash
# Update .env.local to use PostgreSQL
DATABASE_URL="$POSTGRES_PRISMA_URL"

# Start dev server
npm run dev

# Test all features:
# - Login
# - Save location
# - Upload photo
# - View saved locations
# - Edit profile
```

---

### **Step 9: Deploy to Vercel** (2 min)

```bash
# Commit changes
git add prisma/schema.prisma
git commit -m "chore: migrate from SQLite to PostgreSQL"

# Push to deploy
git push origin main

# Vercel auto-deploys with new PostgreSQL connection
```

---

## 🚀 **Method 2: pgloader** (Automated)

**pgloader** is a tool that automatically converts SQLite to PostgreSQL.

### **Installation:**

```bash
# macOS
brew install pgloader

# Linux
sudo apt-get install pgloader
```

### **Usage:**

```bash
# Download SQLite database from Render
# (via Render dashboard or SSH)

# Run pgloader
pgloader \
  sqlite://./path/to/sqlite.db \
  postgresql://user:password@vercel-host:5432/database

# pgloader handles:
# - Schema conversion
# - Data type mapping
# - Index creation
# - Foreign key constraints
```

### **Configuration File (Optional):**

Create `migration.load`:

```lisp
LOAD DATABASE
  FROM sqlite://./prisma/dev.db
  INTO postgresql://user:password@host:5432/database

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '16MB', maintenance_work_mem to '512 MB';
```

Run:
```bash
pgloader migration.load
```

---

## 📊 **Method 3: CSV Export/Import**

### **Step 1: Export from SQLite**

```bash
# Connect to SQLite
sqlite3 prisma/dev.db

# Export each table
.headers on
.mode csv
.output users.csv
SELECT * FROM User;
.output locations.csv
SELECT * FROM Location;
.output photos.csv
SELECT * FROM Photo;
.quit
```

### **Step 2: Import to PostgreSQL**

```bash
# Connect to Vercel Postgres
psql "$POSTGRES_URL_NON_POOLING"

# Create schema first (via Prisma)
# Then import CSVs

\copy "User" FROM 'users.csv' CSV HEADER;
\copy "Location" FROM 'locations.csv' CSV HEADER;
\copy "Photo" FROM 'photos.csv' CSV HEADER;
```

---

## ⚠️ **Common Issues & Solutions**

### **Issue 1: Date/Time Format Differences**

**SQLite:**
```sql
createdAt TEXT -- "2026-01-07 16:30:00"
```

**PostgreSQL:**
```sql
createdAt TIMESTAMP -- Proper timestamp type
```

**Solution:** Prisma handles this automatically! ✅

---

### **Issue 2: Boolean Type**

**SQLite:**
```sql
isAdmin INTEGER -- 0 or 1
```

**PostgreSQL:**
```sql
isAdmin BOOLEAN -- true or false
```

**Solution:** Convert during import:

```typescript
const user = {
  ...sqliteUser,
  isAdmin: Boolean(sqliteUser.isAdmin),
  isVerified: Boolean(sqliteUser.isVerified),
};
```

---

### **Issue 3: Auto-increment IDs**

**SQLite:**
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
```

**PostgreSQL:**
```sql
id SERIAL PRIMARY KEY
-- or
id INTEGER GENERATED ALWAYS AS IDENTITY
```

**Solution:** Prisma handles this in schema! ✅

After import, reset sequences:

```sql
-- Reset sequence to max ID + 1
SELECT setval('"User_id_seq"', (SELECT MAX(id) FROM "User"));
SELECT setval('"Location_id_seq"', (SELECT MAX(id) FROM "Location"));
```

---

### **Issue 4: Foreign Key Constraints**

**Problem:** Import fails due to FK violations

**Solution:** Import in correct order:
1. Users (no dependencies)
2. Sessions (depends on Users)
3. Locations (depends on Users)
4. Photos (depends on Users + Locations)
5. UserSaves (depends on Users + Locations)

---

## 📋 **Pre-Migration Checklist**

- [ ] Backup SQLite database from Render
- [ ] Create Vercel Postgres database
- [ ] Update Prisma schema to PostgreSQL
- [ ] Test schema push locally
- [ ] Prepare migration scripts
- [ ] Test migration with sample data
- [ ] Plan maintenance window (if needed)

---

## ✅ **Post-Migration Checklist**

- [ ] All tables created in PostgreSQL
- [ ] Row counts match SQLite
- [ ] Data integrity verified
- [ ] Foreign keys intact
- [ ] Sequences reset correctly
- [ ] Application connects successfully
- [ ] All features work
- [ ] Performance acceptable
- [ ] Vercel env vars correct
- [ ] Monitor for 24-48 hours
- [ ] Keep SQLite backup for 30 days

---

## 🎯 **Quick Migration Script**

Save as `scripts/migrate-sqlite-to-postgres.sh`:

```bash
#!/bin/bash

echo "🔄 Migrating SQLite → PostgreSQL"

# Step 1: Update Prisma schema
echo "📝 Update prisma/schema.prisma to use PostgreSQL"
read -p "Press enter when done..."

# Step 2: Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Step 3: Push schema to PostgreSQL
echo "📤 Pushing schema to Vercel Postgres..."
npx prisma db push

# Step 4: Export SQLite data
echo "📦 Exporting SQLite data..."
npx ts-node scripts/export-sqlite-data.ts

# Step 5: Import to PostgreSQL
echo "📥 Importing to PostgreSQL..."
npx ts-node scripts/import-to-postgres.ts

# Step 6: Verify
echo "🔍 Opening Prisma Studio for verification..."
npx prisma studio

echo "✅ Migration complete!"
```

---

## 💡 **Pro Tips**

1. **Test Locally First:**
   ```bash
   # Use local PostgreSQL for testing
   docker run --name postgres-test -e POSTGRES_PASSWORD=test -p 5432:5432 -d postgres
   ```

2. **Batch Imports:**
   ```typescript
   // Instead of one-by-one
   await postgres.user.createMany({
     data: data.users,
     skipDuplicates: true
   });
   ```

3. **Progress Tracking:**
   ```typescript
   for (let i = 0; i < data.users.length; i++) {
     await postgres.user.create({ data: data.users[i] });
     if (i % 100 === 0) {
       console.log(`Imported ${i}/${data.users.length} users`);
     }
   }
   ```

---

## 🚀 **Next Steps**

1. **Download SQLite from Render** (if not local)
2. **Run Method 1** (Prisma migration)
3. **Verify data** in Prisma Studio
4. **Test application** locally
5. **Deploy to Vercel**
6. **Monitor for issues**

---

**Need help with the actual migration?** Let me know and I can:
- Help you download the SQLite database from Render
- Create the migration scripts for your specific schema
- Guide you through the process step-by-step

Would you like me to proceed with creating the migration scripts? 🚀
