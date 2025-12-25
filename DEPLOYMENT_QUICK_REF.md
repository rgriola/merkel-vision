# 🚀 Quick Deployment Reference

## TL;DR - Production Stack

```
Frontend/Backend → Vercel
Database        → PlanetScale  
Email           → Resend
CDN/Images      → ImageKit (already setup ✅)
DNS             → Cloudflare (already setup ✅)
Monitoring      → Sentry (already setup ✅)
```

## Cost: $0/month (Free tiers cover MVP to ~10k users)

---

## Quick Links

| Service | Dashboard | Docs |
|---------|-----------|------|
| **Vercel** | [dashboard](https://vercel.com/dashboard) | [docs](https://vercel.com/docs) |
| **PlanetScale** | [app](https://app.planetscale.com) | [docs](https://planetscale.com/docs) |
| **Resend** | [overview](https://resend.com/overview) | [docs](https://resend.com/docs) |

---

## Deployment Order (30 minutes total)

### Phase 1: Email (5 min)
1. Sign up at resend.com
2. Add + verify domain in Cloudflare
3. Generate API key
4. Save for Vercel setup

### Phase 2: Database (10 min)
1. Sign up at planetscale.com
2. Create database: `google-search-me`
3. Get connection string
4. Import local data (optional)

### Phase 3: Deploy App (10 min)
1. Link GitHub to Vercel
2. Import project
3. Add all environment variables
4. Deploy!

### Phase 4: Custom Domain (5 min)
1. Add domain in Vercel
2. Add CNAME in Cloudflare
3. Wait for SSL (auto)

---

## Environment Variables (Copy-Paste for Vercel)

When you deploy, you'll need these from your `.env.local` **PLUS** these new ones:

### 🆕 New for Production:
```bash
# Database (from PlanetScale)
DATABASE_URL=mysql://xxxxx@aws.connect.psdb.cloud/google-search-me?sslaccept=strict

# JWT Secret (GENERATE NEW - don't reuse local!)
JWT_SECRET=<run: openssl rand -base64 48>

# Email (from Resend)
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_MODE=production

# App URL (after first deploy, update with custom domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### ✅ Same as Local:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<from .env.local>
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=<from .env.local>
IMAGEKIT_PRIVATE_KEY=<from .env.local>
IMAGEKIT_URL_ENDPOINT=<from .env.local>
NEXT_PUBLIC_SENTRY_DSN=<from .env.local>
NODE_ENV=production
```

---

## Common Issues & Solutions

### "Email not sending"
- ✅ Domain verified in Resend? (green checkmark)
- ✅ `EMAIL_FROM_ADDRESS` matches verified domain?
- ✅ Check Resend logs in dashboard

### "Database connection failed"
- ✅ Connection string has `?sslaccept=strict`?
- ✅ Branch is `main` (not sleeping)?
- ✅ Copied from PlanetScale dashboard "Connect" tab?

### "Build fails on Vercel"
- ✅ All required env vars added?
- ✅ Check build logs in Vercel dashboard
- ✅ Local build works? (`npm run build`)

---

## Testing Checklist (After Deploy)

- [ ] Site loads at Vercel URL
- [ ] User can sign up
- [ ] Verification email sent (check Resend)
- [ ] User can login
- [ ] Map loads correctly
- [ ] Can save locations
- [ ] Password reset works
- [ ] Check Sentry for errors
- [ ] Custom domain working (if added)

---

## Scaling & Costs

### When to Upgrade?

| Metric | Free Tier Limit | When to Upgrade | Cost |
|--------|-----------------|-----------------|------|
| **Vercel** | 100GB bandwidth | >100GB/mo | $20/mo (Pro) |
| **PlanetScale** | 1B row reads | >1B reads/mo | $39/mo (Scaler) |
| **Resend** | 3k emails/mo | >3k emails/mo | $20/mo |
| **ImageKit** | 20GB | >20GB/mo | $0-49/mo |

**Typical breakpoint:** ~5-10k active users → ~$80-100/mo total

---

## Support

- **Deployment guide**: `.agent/workflows/deploy-to-production.md`
- **Email changes**: `EMAIL_SERVICE_UPDATE.md`
- **Vercel support**: https://vercel.com/help
- **PlanetScale support**: https://support.planetscale.com
- **Resend support**: support@resend.com

---

Ready to deploy? Run: **`/deploy-to-production`** 🚀
