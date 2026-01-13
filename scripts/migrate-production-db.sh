#!/bin/bash
# Production Database Migration Script for Neon
# This script applies the bannerImage field to your production database

echo "⚠️  WARNING: You are about to modify the PRODUCTION database"
echo "Make sure you have:"
echo "  1. Backed up your production data"
echo "  2. Tested this migration on development"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 1
fi

# Get production DATABASE_URL from Vercel or manual input
read -p "Enter your PRODUCTION DATABASE_URL: " PROD_DB_URL

if [ -z "$PROD_DB_URL" ]; then
    echo "Error: DATABASE_URL is required"
    exit 1
fi

# Temporarily set the DATABASE_URL
export DATABASE_URL="$PROD_DB_URL"

echo ""
echo "Running Prisma migration on production..."
npx prisma db push --accept-data-loss=false

echo ""
echo "Regenerating Prisma client..."
npx prisma generate

echo ""
echo "✅ Production database updated successfully!"
echo ""
echo "⚠️  Next steps:"
echo "  1. Verify the bannerImage field exists in production"
echo "  2. Deploy your updated application code to Vercel"
echo "  3. Test banner upload in production"
