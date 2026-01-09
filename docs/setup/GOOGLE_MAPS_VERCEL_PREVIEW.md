# Google Maps API Configuration for Vercel Preview Deployments

**Status**: Configuration Guide  
**Last Updated**: January 9, 2026

---

## Problem

Vercel preview deployments use dynamic URLs with unique hashes:
```
https://fotolokashen-[unique-hash]-rodczaro.vercel.app
                     ^^^^^^^^^^^^^ This changes with each deployment
```

Google Maps API needs to know which domains are allowed to use your API key.

---

## Solution: Wildcard Domain Patterns

### Recommended Setup (3 API Keys)

Create **three separate API keys** for different environments:

#### 1. Production API Key

**Restrictions:**
```
https://fotolokashen.com/*
https://www.fotolokashen.com/*
```

**Usage:**
- Production deployments only
- Vercel Production environment variable

#### 2. Preview API Key

**Restrictions:**
```
https://*.vercel.app/*
https://fotolokashen-*.vercel.app/*
https://fotolokashen-*-rodczaro.vercel.app/*
```

**Usage:**
- All Vercel preview deployments
- Vercel Preview environment variable

#### 3. Development API Key

**Restrictions:**
```
http://localhost:*/*
http://127.0.0.1:*/*
```

**Usage:**
- Local development
- Your `.env.local` file

---

## Step-by-Step Implementation

### Step 1: Create API Keys in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Repeat 3 times to create 3 keys

### Step 2: Configure Each API Key

#### Production Key Configuration

1. Click on the key → **Edit**
2. **Name**: "Google Maps API - Production"
3. **Application restrictions**: HTTP referrers (web sites)
4. **Website restrictions** → Add these:
   ```
   https://fotolokashen.com/*
   https://www.fotolokashen.com/*
   ```
5. **API restrictions**: 
   - Select "Restrict key"
   - Enable only:
     - Maps JavaScript API
     - Places API
     - Geocoding API
6. Click **Save**

#### Preview Key Configuration

1. Click on the key → **Edit**
2. **Name**: "Google Maps API - Preview/Staging"
3. **Application restrictions**: HTTP referrers (web sites)
4. **Website restrictions** → Add these:
   ```
   https://*.vercel.app/*
   https://fotolokashen-*.vercel.app/*
   ```
5. **API restrictions**: 
   - Select "Restrict key"
   - Enable only:
     - Maps JavaScript API
     - Places API
     - Geocoding API
6. Click **Save**

#### Development Key Configuration

1. Click on the key → **Edit**
2. **Name**: "Google Maps API - Development"
3. **Application restrictions**: HTTP referrers (web sites)
4. **Website restrictions** → Add these:
   ```
   http://localhost:*/*
   http://127.0.0.1:*/*
   ```
5. **API restrictions**: 
   - Select "Restrict key"
   - Enable only:
     - Maps JavaScript API
     - Places API
     - Geocoding API
6. Click **Save**

---

## Step 3: Configure Environment Variables

### Local Development (`.env.local`)

```bash
# Local development - uses development key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza...your_development_key_here"
```

### Vercel Dashboard Configuration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **fotolokashen**
3. Navigate to **Settings** → **Environment Variables**

#### Add/Update `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`:

**For Production:**
- **Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Value**: `AIza...your_production_key_here`
- **Environment**: ✅ Production only

**For Preview:**
- Click "Add Another"
- **Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Value**: `AIza...your_preview_key_here`
- **Environment**: ✅ Preview only

**For Development (optional):**
- Click "Add Another"
- **Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Value**: `AIza...your_development_key_here`
- **Environment**: ✅ Development only

### Visual Guide:

```
┌─────────────────────────────────────────────────────────┐
│ Environment Variables                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY                        │
│ ┌─────────────────────────────────────────────────┐   │
│ │ AIza...production_key (first 10 chars shown)    │   │
│ └─────────────────────────────────────────────────┘   │
│ Environments: ☑ Production  ☐ Preview  ☐ Development  │
│                                                         │
│ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY                        │
│ ┌─────────────────────────────────────────────────┐   │
│ │ AIza...preview_key (first 10 chars shown)       │   │
│ └─────────────────────────────────────────────────┘   │
│ Environments: ☐ Production  ☑ Preview  ☐ Development  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Step 4: Redeploy

After configuring Vercel environment variables:

### For Preview Deployments:
- Push a new commit to a feature branch
- Vercel will auto-deploy with preview key

### For Production:
- Merge to `main` branch
- Manually promote deployment in Vercel dashboard
- Will use production key

---

## Verification

### Test Each Environment:

#### 1. Local Development
```bash
npm run dev
# Open http://localhost:3000/map
# Map should load with development key
```

#### 2. Preview Deployment
```bash
git checkout -b test/maps-preview
git commit --allow-empty -m "Test preview deployment"
git push origin test/maps-preview
# Open preview URL (fotolokashen-xxx-rodczaro.vercel.app/map)
# Map should load with preview key
```

#### 3. Production
```bash
# After merging to main and promoting in Vercel
# Open https://fotolokashen.com/map
# Map should load with production key
```

### Check Browser Console:

If API key is working correctly, you should see:
```
✅ No errors about "RefererNotAllowedMapError"
✅ Map loads properly
✅ Autocomplete search works
✅ Geocoding works
```

If API key is NOT working:
```
❌ "RefererNotAllowedMapError" in console
❌ Gray map background
❌ "This page can't load Google Maps correctly" message
```

---

## Alternative: Single Key with Wildcards (Simpler but Less Secure)

If you prefer using **one key** for all environments:

### Single Key Configuration:

1. Create one API key
2. **Name**: "Google Maps API - All Environments"
3. **Website restrictions**:
   ```
   # Production
   https://fotolokashen.com/*
   https://www.fotolokashen.com/*
   
   # All Vercel previews
   https://*.vercel.app/*
   
   # Local development
   http://localhost:*/*
   http://127.0.0.1:*/*
   ```
4. Use this key in all environments

### Pros:
- ✅ Simpler setup
- ✅ One key to manage

### Cons:
- ❌ Less secure (key works on all Vercel apps)
- ❌ Can't track usage per environment
- ❌ If key leaks, affects all environments

---

## Security Best Practices

### ✅ DO:
- Use separate keys per environment
- Restrict keys to specific domains
- Restrict keys to only needed APIs
- Monitor usage in Google Cloud Console
- Set up billing alerts
- Rotate keys periodically (every 90 days)

### ❌ DON'T:
- Use unrestricted API keys
- Commit API keys to git
- Share API keys in public channels
- Use production keys for testing
- Allow `*` or `*.com/*` patterns

---

## Monitoring Usage

### Google Cloud Console:

1. Go to **APIs & Services** → **Dashboard**
2. Click **Maps JavaScript API**
3. View usage metrics:
   - Requests per day
   - Errors
   - Latency

### Set Up Billing Alerts:

1. Go to **Billing** → **Budgets & alerts**
2. Create alert for **Google Maps Platform**
3. Set threshold: e.g., $50/month
4. Add email notification

---

## Troubleshooting

### Error: "RefererNotAllowedMapError"

**Cause**: Domain not in API key's allowed list

**Solution**:
1. Check browser console for exact URL
2. Add that URL pattern to API key restrictions
3. Wait 5 minutes for changes to propagate
4. Clear browser cache and reload

### Preview Deployment Not Working

**Cause**: Vercel environment variable not set for Preview

**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` has ☑ Preview checked
3. Redeploy the preview branch

### Map Works Locally but Not on Vercel

**Cause**: Different API keys configured

**Solution**:
1. Check `.env.local` (local key)
2. Check Vercel dashboard (preview/production key)
3. Ensure correct key restrictions match environment

---

## Cost Optimization

### Free Tier:
- Google gives $200/month free credit
- That covers approximately:
  - **28,000 map loads** per month
  - **40,000 autocomplete requests** per month

### Reduce Costs:
1. **Restrict to necessary APIs only**
   - Don't enable all Maps APIs if you don't need them
   
2. **Use Static Maps for thumbnails**
   - Cheaper than dynamic maps
   
3. **Cache geocoding results**
   - Store lat/lng in database
   - Don't geocode same address multiple times

4. **Lazy load maps**
   - Only load Google Maps SDK when needed
   - Use intersection observer

---

## Summary

### Recommended Configuration:

| Environment | API Key | Domain Pattern |
|-------------|---------|----------------|
| **Production** | Production Key | `fotolokashen.com/*` |
| **Preview** | Preview Key | `*.vercel.app/*` |
| **Development** | Development Key | `localhost:*/*` |

### Vercel Environment Variable Setup:

```bash
# Production environment
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIza...production_key

# Preview environment  
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIza...preview_key

# Development environment (optional - use .env.local instead)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIza...development_key
```

### Next Steps:

1. ✅ Create 3 API keys in Google Cloud Console
2. ✅ Configure domain restrictions for each key
3. ✅ Add keys to Vercel environment variables
4. ✅ Update `.env.local` with development key
5. ✅ Redeploy and test all environments
6. ✅ Set up billing alerts
7. ✅ Monitor usage weekly

---

**Status**: Ready to implement  
**Estimated Time**: 15-20 minutes  
**Difficulty**: Easy  

Let me know if you need help with any of these steps!
