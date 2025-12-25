---
description: Deploy to Vercel + PlanetScale production environment
---

# 🚀 Production Deployment Guide: Vercel + PlanetScale + Resend

This guide will walk you through deploying your Next.js Google Search Me application to production.

## 📋 Prerequisites Checklist

- [ ] GitHub repository with latest code pushed
- [ ] Cloudflare account (for DNS)
- [ ] Credit card for service sign-ups (most have generous free tiers)

---

## Phase 1: Email Setup (Resend)

### 1.1 Create Resend Account
1. Go to https://resend.com
2. Sign up with GitHub (easiest)
3. Verify your email address

### 1.2 Add & Verify Your Domain
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records to **Cloudflare**:
   - Go to your Cloudflare dashboard
   - Select your domain
   - Go to **DNS** → **Records**
   - Add the SPF, DKIM, and DMARC records provided by Resend
   - Wait 5-10 minutes for DNS propagation
5. In Resend, click **Verify** - should turn green ✅

### 1.3 Generate API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `Production - Google Search Me`
4. Select **Full Access** (or **Sending access** only)
5. **COPY THE KEY** - you'll need this for Vercel
6. Format: `re_xxxxxxxxxxxxxxxxxxxxx`

### 1.4 Test Email (Optional)
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Hello from Resend!</p>"
  }'
```

**Environment Variables Needed:**
```bash
EMAIL_SERVICE="resend"
EMAIL_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"  # Your Resend API key
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"  # Must match verified domain
EMAIL_FROM_NAME="Google Search Me"
```

---

## Phase 2: Database Setup (PlanetScale)

### 2.1 Create PlanetScale Account
1. Go to https://planetscale.com
2. Sign up with GitHub (recommended)
3. Choose the **Hobby** plan (FREE - up to 1 billion row reads/month)

### 2.2 Create Database
1. Click **Create a Database**
2. Database name: `google-search-me` (or your preferred name)
3. Region: Choose closest to your users (e.g., `us-east` or `us-west`)
4. Click **Create Database**

### 2.3 Create Production Branch
PlanetScale uses branches like Git:
1. You'll start with a `main` branch
2. This is perfect for production
3. Later, you can create `dev` branches for testing schema changes

### 2.4 Get Connection String
1. In your database, click **Connect**
2. Select **Prisma** (or **General** if not shown)
3. Copy the connection string - it looks like:
   ```
   mysql://xxxxxxxxx:************@aws.connect.psdb.cloud/google-search-me?sslaccept=strict
   ```
4. **IMPORTANT**: Save this securely - it contains credentials!

### 2.5 Import Your Local Database

#### Option A: Export/Import (Recommended)
```bash
# 1. Export your local database
mysqldump -u root google_search_me > backup.sql

# 2. Install PlanetScale CLI
brew install planetscale/tap/pscale

# 3. Login to PlanetScale
pscale auth login

# 4. Connect to your database
pscale connect google-search-me main --port 3309

# 5. In a new terminal, import the data
mysql -h 127.0.0.1 -P 3309 -u root google_search_me < backup.sql
```

#### Option B: Use Prisma (if you have migrations)
```bash
# 1. Update DATABASE_URL in .env to PlanetScale connection string
# 2. Push your schema
npx prisma db push
```

### 2.6 Enable Production Branch Protection
1. In PlanetScale dashboard, go to your database
2. Click **Settings** → **General**
3. Enable **Require approval for schema changes**
4. This protects your production data

**Environment Variable Needed:**
```bash
DATABASE_URL="mysql://user:pass@aws.connect.psdb.cloud/google-search-me?sslaccept=strict"
```

---

## Phase 3: Vercel Deployment

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub (MUST use same account as your repo)
3. Skip any onboarding wizards

### 3.2 Import Project
1. Click **Add New...** → **Project**
2. Find your `google-search-me-refactor` repository
3. Click **Import**

### 3.3 Configure Build Settings
Vercel should auto-detect Next.js. Verify:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave default)
- **Build Command**: `next build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 3.4 Add Environment Variables
Click **Environment Variables** and add ALL of these:

```bash
# Node Environment
NODE_ENV=production

# Database (from PlanetScale - Step 2.4)
DATABASE_URL=mysql://xxxxxxxxx:************@aws.connect.psdb.cloud/google-search-me?sslaccept=strict

# JWT Secret (GENERATE A NEW ONE FOR PRODUCTION!)
JWT_SECRET=<GENERATE_NEW_SECRET_SEE_BELOW>

# Google Maps API Key (same as local)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCHQECnK2DXcNXIQR0ZfvIEPrAJWIH8JsM

# ImageKit (same as local)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_O/9pxeXVXghCIZD8o8ySi04JvK4=
IMAGEKIT_PRIVATE_KEY=private_z98e1q+JMejEDabjjvzijXlKH84=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/rgriola

# Email (from Resend - Step 1.3)
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Google Search Me

# Application URL (will update after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Sentry (same as local)
NEXT_PUBLIC_SENTRY_DSN=https://1e6219bd27e095b18fc73fec018da187@o4510596205838336.ingest.us.sentry.io/4510596233101312
```

#### 🔐 Generate New JWT Secret for Production:
```bash
# Run this in your terminal:
openssl rand -base64 48
```
Copy the output and use it as `JWT_SECRET`

### 3.5 Deploy!
1. Click **Deploy**
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://google-search-me-refactor.vercel.app`

### 3.6 Test Your Deployment
1. Visit your Vercel URL
2. Test authentication (sign up/login)
3. Test map features
4. Check that emails are sent (via Resend)
5. Check Sentry for any errors

---

## Phase 4: Custom Domain Setup (Cloudflare DNS)

### 4.1 Add Domain to Vercel
1. In Vercel dashboard, select your project
2. Go to **Settings** → **Domains**
3. Add your domain (e.g., `app.yourdomain.com`)
4. Vercel will provide DNS records

### 4.2 Configure Cloudflare DNS
1. Go to Cloudflare dashboard
2. Select your domain
3. Go to **DNS** → **Records**
4. Add the CNAME record Vercel provided:
   ```
   Type: CNAME
   Name: app (or @, or www)
   Target: cname.vercel-dns.com
   Proxy status: Proxied (orange cloud)
   ```
5. Wait 5-10 minutes for DNS propagation

### 4.3 Update Environment Variable
1. In Vercel, go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to your custom domain:
   ```
   NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
   ```
3. Click **Save**
4. Redeploy (Settings → Deployments → Click ⋯ → Redeploy)

### 4.4 Enable Automatic HTTPS
- Vercel + Cloudflare will automatically provision SSL certificates
- Your site will be HTTPS within 5-10 minutes

---

## Phase 5: Configure Update Email Service in Code

### 5.1 Update Email Service
Your current code uses nodemailer with SMTP. We need to switch to Resend's API.

#### Install Resend SDK:
```bash
npm install resend
```

#### Update your email utility to support both:
Create/update `src/lib/email.ts`:

```typescript
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from './env';

// Initialize Resend for production
const resend = env.EMAIL_SERVICE === 'resend' 
  ? new Resend(process.env.EMAIL_API_KEY) 
  : null;

// Keep your existing nodemailer transporter for development
const transporter = env.EMAIL_SERVICE === 'mailtrap' 
  ? nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    })
  : null;

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (env.EMAIL_SERVICE === 'resend' && resend) {
    // Production: Use Resend
    return await resend.emails.send({
      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } else if (transporter) {
    // Development: Use Mailtrap
    return await transporter.sendMail({
      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } else {
    throw new Error('No email service configured');
  }
}
```

### 5.2 Update Environment Validation
Update `src/lib/env.ts` to handle Resend:

```typescript
// Email configuration (conditional based on service)
EMAIL_SERVICE: z.enum(['mailtrap', 'resend']).default('mailtrap'),

// Resend-specific
EMAIL_API_KEY: z.string().optional(),

// SMTP-specific (Mailtrap)
EMAIL_HOST: z.string().optional(),
EMAIL_PORT: z.string().optional(),
EMAIL_USER: z.string().optional(),
EMAIL_PASS: z.string().optional(),

// Common
EMAIL_FROM_ADDRESS: z.string().email(),
EMAIL_FROM_NAME: z.string().default('Google Search Me'),
```

---

## Phase 6: Post-Deployment Checklist

### 6.1 Monitoring Setup
- [ ] Check Vercel dashboard for build errors
- [ ] Review Vercel Analytics (auto-enabled)
- [ ] Check Sentry dashboard for runtime errors
- [ ] Monitor PlanetScale Insights for slow queries

### 6.2 Performance Optimization
- [ ] Enable Vercel Speed Insights (free)
- [ ] Review Lighthouse scores
- [ ] Check Core Web Vitals in Vercel dashboard
- [ ] Test from different locations (use https://webpagetest.org)

### 6.3 Security
- [ ] Review Vercel Firewall settings
- [ ] Enable PlanetScale IP restrictions (if needed)
- [ ] Check Cloudflare security settings
- [ ] Verify HTTPS is working
- [ ] Test authentication flows

### 6.4 Backup Strategy
- [ ] PlanetScale automatically backs up your database
- [ ] Download a backup: `pscale backup create google-search-me main`
- [ ] Set up automated backups (PlanetScale settings)

---

## 📊 Cost Breakdown (Estimated)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Hobby | $0 | Unlimited deployments, 100GB bandwidth |
| **PlanetScale** | Hobby | $0 | 1B row reads, 10M row writes/month |
| **Resend** | Free | $0 | 3,000 emails/month, 100/day |
| **Cloudflare** | Free | $0 | Unlimited bandwidth |
| **ImageKit** | Free | $0 | 20GB bandwidth, 20GB storage |
| **Sentry** | Free | $0 | 5K errors/month |
| **TOTAL** | | **$0/month** | Great for MVP/startup! |

### When You'll Need to Upgrade:
- **Vercel Pro ($20/mo)**: Custom domains, analytics, more team members
- **PlanetScale Scaler ($39/mo)**: More reads/writes, branching
- **Resend Email ($20/mo)**: 50k emails/month
- **Total at scale**: ~$80-100/month for serious traffic

---

## 🚨 Troubleshooting

### Build Fails on Vercel
```bash
# Check build logs in Vercel dashboard
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Database connection issues (use Vercel preview DB_URL)
```

### Database Connection Errors
```bash
# Ensure PlanetScale connection string is correct
# Check SSL settings: ?sslaccept=strict
# Verify branch is not sleeping (Hobby tier doesn't sleep)
```

### Emails Not Sending
```bash
# Verify Resend domain is verified (green checkmark)
# Check EMAIL_FROM_ADDRESS matches verified domain
# Review Resend logs in dashboard
```

### Custom Domain Not Working
```bash
# DNS propagation can take up to 48 hours (usually 5-10 min)
# Check DNS with: dig app.yourdomain.com
# Verify Cloudflare proxy is enabled (orange cloud)
```

---

## 🎯 Next Steps After Deployment

1. **Set up continuous deployment**: Every push to `main` auto-deploys
2. **Create preview environments**: Use Vercel preview deployments for PRs
3. **Database branching**: Use PlanetScale dev branches for schema changes
4. **Monitoring alerts**: Set up Sentry alerts for critical errors
5. **Performance monitoring**: Review Vercel Analytics weekly

---

## 📚 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [PlanetScale Dashboard](https://app.planetscale.com)
- [Resend Dashboard](https://resend.com/overview)
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Vercel Docs](https://vercel.com/docs)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Resend Docs](https://resend.com/docs)

---

**Good luck with your deployment!** 🚀

If you run into issues, check the troubleshooting section or reach out for help.
