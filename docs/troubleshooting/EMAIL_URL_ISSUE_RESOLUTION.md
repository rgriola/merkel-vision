# EMAIL URL ISSUE - ROOT CAUSE & SOLUTION

## 🔴 PROBLEM IDENTIFIED

Production emails are being sent with the old URL `https://merkelvision.com` instead of `https://fotolokashen.com`.

### Root Cause
The environment variable `NEXT_PUBLIC_APP_URL` is set to the old domain in **Vercel's production environment**.

### Where `process.env` Variables Come From

1. **Local Development**: `.env.local` file (✅ Correct - shows `http://localhost:3000`)
2. **Vercel Production/Preview**: Environment variables set in Vercel dashboard
3. **`.env.production.example`**: ❌ **NOT USED** - It's just a template/documentation

## 🔧 IMMEDIATE FIX REQUIRED

### Step 1: Update Vercel Environment Variables

1. Go to: https://vercel.com/rgriolas-projects/fotolokashen/settings/environment-variables
2. Find `NEXT_PUBLIC_APP_URL`
3. Update values:
   - **Production**: `https://fotolokashen.com`
   - **Preview**: `https://fotolokashen.com` (or leave as preview URL)
   - **Development**: Leave empty (uses .env.local)

### Step 2: Verify Other Email Variables on Vercel

Ensure these are set correctly in Vercel:

```bash
# Email Configuration (Production)
EMAIL_API_KEY=re_YourResendAPIKey     # Your actual Resend key
EMAIL_MODE=production                  # Must be "production" not "development"
EMAIL_FROM_NAME=Fotolokashen
EMAIL_FROM_ADDRESS=noreply@fotolokashen.com  # Or your verified domain
```

### Step 3: Redeploy

After updating environment variables:
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Select "Redeploy" to apply new environment variables

## 📋 VERIFICATION CHECKLIST

After redeployment, verify:

- [ ] Password reset emails show `https://fotolokashen.com/reset-password?token=...`
- [ ] Email verification shows `https://fotolokashen.com/verify-email?token=...`
- [ ] No references to `merkelvision.com` in any emails
- [ ] Emails are actually being sent (not just logged to console)

## 🏗️ ENVIRONMENT VARIABLE HIERARCHY

### Next.js Priority Order (Highest to Lowest)
1. `.env.local` - Used ONLY for local development
2. `.env.production` / `.env.development` - Environment-specific (we don't use these)
3. `.env` - Default fallback (we don't use this either)

### Our Setup (Recommended)
- **Local Dev**: `.env.local` (in .gitignore, not committed)
- **Production**: Vercel Environment Variables Dashboard
- **Examples**: `.env.production.example` (documentation only, never loaded by Next.js)

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ WRONG: Using .env files in production
```
# Don't do this - .env files shouldn't be deployed
.env.production (in repo)
```

### ✅ CORRECT: Use Vercel dashboard
```
Vercel Dashboard → Settings → Environment Variables
```

## 🔐 SECURITY NOTES

### Variables That Should Be in Vercel (Not in Code)
- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Session signing key
- `EMAIL_API_KEY` - Resend API key
- `IMAGEKIT_PRIVATE_KEY` - ImageKit private key
- All other secrets

### Variables Safe to Be Public (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_APP_URL` - App URL (visible to client)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Maps API (restricted by domain)
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` - ImageKit public key
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

## 📝 UPDATING .env.production.example

The `.env.production.example` file should be updated to show the NEW domain as an example:

```bash
# Application URL (Production)
NEXT_PUBLIC_APP_URL="https://fotolokashen.com"

# Email Configuration (Production)
EMAIL_MODE="production"
EMAIL_FROM_ADDRESS="noreply@fotolokashen.com"
```

This helps future developers know what values to set in Vercel.

## 🚀 PREVENTION STRATEGY

### 1. Environment Variable Documentation
Create a checklist in your README or docs:
- Document all required environment variables
- Show where to set them (Vercel dashboard)
- Provide example values

### 2. Automated Checks
Add a startup check in your app to verify critical variables:

```typescript
// src/lib/env-check.ts
export function checkCriticalEnvVars() {
  const required = [
    'NEXT_PUBLIC_APP_URL',
    'DATABASE_URL',
    'JWT_SECRET',
    'EMAIL_API_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Critical environment variables missing');
    }
  }
}
```

### 3. Test Email on Deploy
After each production deployment:
1. Trigger a password reset
2. Verify the email contains the correct domain
3. Click the link to ensure it works

## 📊 CURRENT STATE

### Local (.env.local) ✅
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EMAIL_MODE="development"  # Logs to console
```

### Production (Vercel) ❌ NEEDS UPDATE
```bash
NEXT_PUBLIC_APP_URL="https://merkelvision.com"  # OLD - CHANGE THIS!
EMAIL_MODE="production"  # Should send real emails
```

## 🎯 ACTION ITEMS

1. **URGENT**: Update `NEXT_PUBLIC_APP_URL` in Vercel dashboard
2. Update `.env.production.example` to reflect new domain (documentation)
3. Verify `EMAIL_MODE=production` in Vercel (not development)
4. Redeploy application
5. Test password reset email
6. Update any hardcoded references to merkelvision.com in codebase

## 📞 SUPPORT

If emails still show old URL after these changes:
1. Check browser cache (hard refresh)
2. Verify Vercel deployment used new environment variables
3. Check Vercel deployment logs for actual environment variable values
4. Contact Vercel support if variables aren't being picked up

---

**Created**: January 9, 2026
**Status**: Action Required - Update Vercel Environment Variables
