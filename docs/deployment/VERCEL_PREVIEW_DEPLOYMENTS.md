# Vercel Preview Deployments Guide

**Status**: ✅ Configured for Automatic Preview Deployments

**Last Updated**: January 9, 2026

---

## Overview

This project uses Vercel's Git integration to automatically deploy preview environments for every branch and pull request.

### Deployment Strategy

| Branch Type | Deployment Type | URL Pattern | Auto-Deploy |
|-------------|----------------|-------------|-------------|
| `main` | Production | `fotolokashen.com` | ❌ Manual only |
| Feature branches | Preview | `fotolokashen-git-[branch-name]-rgriola.vercel.app` | ✅ Automatic |
| Pull Requests | Preview | `fotolokashen-git-[branch-name]-rgriola.vercel.app` | ✅ Automatic |

---

## How It Works

### 1. Create a Feature Branch

```bash
# Create and switch to a new feature branch
git checkout -b feature/my-new-feature

# Make your changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/my-new-feature
```

### 2. Automatic Preview Deployment

Once you push to GitHub, Vercel will automatically:

1. **Detect the push** to your branch
2. **Build your application** with the branch's code
3. **Deploy to a preview URL** (e.g., `fotolokashen-git-feature-my-new-feature-rgriola.vercel.app`)
4. **Comment on GitHub** with the preview URL (if you have a PR open)

### 3. Review Your Preview

- Open the preview URL Vercel provides
- Test your changes in a production-like environment
- Share the URL with team members for review
- Check the deployment logs in Vercel dashboard

### 4. Merge When Ready

Once your preview looks good:

```bash
# Switch back to main
git checkout main

# Merge your feature branch
git merge feature/my-new-feature

# Note: Main branch requires manual deployment in Vercel dashboard
# (Automatic deployment is disabled for production safety)
```

---

## Configuration

### vercel.json Settings

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false  // Manual production deployments only
    }
  },
  "github": {
    "silent": false,     // Show deployment comments on PRs
    "autoAlias": true    // Auto-generate preview URLs
  }
}
```

### Why Main Branch Auto-Deploy is Disabled

**Production Safety**: 
- Main branch deploys to production domain (`fotolokashen.com`)
- Manual deployment prevents accidental production releases
- Allows for final review before going live
- Recommended for production applications

---

## Workflow Examples

### Example 1: Quick Feature Test

```bash
# 1. Create branch for quick test
git checkout -b test/button-color

# 2. Make change
# Edit src/components/ui/button.tsx

# 3. Push to trigger preview
git add .
git commit -m "Test: Change button color to blue"
git push origin test/button-color

# 4. Wait ~2 minutes for Vercel to build
# 5. Check preview URL in Vercel dashboard or GitHub
# 6. If good, merge to main; if not, make more commits
```

### Example 2: Team Collaboration with PR

```bash
# 1. Create feature branch
git checkout -b feature/add-map-filters

# 2. Make changes and push
git add .
git commit -m "Add location type filters to map"
git push origin feature/add-map-filters

# 3. Create Pull Request on GitHub
# Go to github.com/rgriola/fotolokashen and create PR

# 4. Vercel automatically comments with preview URL
# "✅ Preview deployment ready: https://fotolokashen-git-feature-add-map-filters-rgriola.vercel.app"

# 5. Team reviews preview and code
# 6. Make changes based on feedback (new commits trigger new previews)
# 7. Merge PR when approved
```

### Example 3: Multiple Features in Parallel

```bash
# Developer 1: Works on mobile menu
git checkout -b feature/mobile-menu
# ... makes changes and pushes ...
# Preview: fotolokashen-git-feature-mobile-menu-rgriola.vercel.app

# Developer 2: Works on search improvements
git checkout -b feature/search-improvements
# ... makes changes and pushes ...
# Preview: fotolokashen-git-feature-search-improvements-rgriola.vercel.app

# Each feature gets its own isolated preview environment!
```

---

## Preview Environment Features

### What Preview Deployments Include

✅ **Full Production Build**
- Same build process as production
- All optimizations enabled (Turbopack, React Server Components)
- Production-level performance

✅ **Environment Variables**
- Uses preview environment variables from Vercel dashboard
- Can override specific variables per branch if needed
- Separate from production secrets

✅ **Database Access**
- Connects to your database (check DIRECT_URL in Vercel)
- ⚠️ **Warning**: Previews use same database as production by default
- Consider using a separate staging database for preview branches

✅ **Real URLs**
- Shareable links for stakeholders
- Works on all devices
- HTTPS enabled automatically

✅ **Deployment Logs**
- Full build logs available in Vercel dashboard
- Error tracking and debugging
- Performance metrics

### What's Different from Production

| Feature | Production | Preview |
|---------|-----------|---------|
| Domain | fotolokashen.com | fotolokashen-git-[branch].vercel.app |
| Manual Deploy | Required | Automatic |
| Analytics | Full analytics | Same as production |
| Environment | Production | Preview (can customize) |
| Permanence | Permanent | Deleted after branch merge/delete |

---

## Vercel Dashboard Setup

### 1. Connect GitHub Repository

If not already connected:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your GitHub repository (`rgriola/fotolokashen`)
4. Vercel auto-detects Next.js and configures build settings
5. Click "Deploy"

### 2. Configure Git Integration

1. Go to Project Settings → Git
2. **Production Branch**: Ensure it's set to `main`
3. **Preview Deployments**: Enable "Deploy on push to feature branches"
4. **Ignored Build Step**: Leave empty (or customize)
5. **GitHub Integration**: Enable "Comment on pull requests"

### 3. Environment Variables (Optional)

For preview-specific configuration:

1. Go to Project Settings → Environment Variables
2. Add variables with "Preview" scope
3. Examples:
   - `NEXT_PUBLIC_APP_URL` → Set to `https://fotolokashen-git-${VERCEL_GIT_COMMIT_REF}-rgriola.vercel.app`
   - `EMAIL_MODE` → Set to `preview` or `development`
   - Database URLs can point to staging database

---

## Preview URL Patterns

Vercel generates predictable URLs:

```
https://fotolokashen-git-[branch-name]-[owner].vercel.app
```

**Examples:**
- `feature/mobile-menu` → `fotolokashen-git-feature-mobile-menu-rgriola.vercel.app`
- `fix/email-bug` → `fotolokashen-git-fix-email-bug-rgriola.vercel.app`
- `test/new-design` → `fotolokashen-git-test-new-design-rgriola.vercel.app`

**Special characters** (spaces, slashes, underscores) are converted to hyphens.

---

## Monitoring Deployments

### GitHub Integration

When you push a branch or open a PR:

1. **GitHub Checks**: Vercel adds a check to your commits
   - ✅ "Vercel — Preview Deployment Ready"
   - ❌ "Vercel — Preview Deployment Failed"

2. **PR Comments**: Vercel bot comments with deployment details
   - Preview URL
   - Deployment status
   - Build time
   - Commit SHA

### Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. See list of all deployments (Production + Previews)
4. Click any deployment to see:
   - Build logs
   - Runtime logs
   - Environment variables used
   - Deployment source (branch, commit)

### Email Notifications

Vercel sends emails for:
- ✅ Successful deployments
- ❌ Failed deployments
- Can be configured in Account Settings

---

## Troubleshooting

### Preview Deployment Not Triggering

**Check:**
1. GitHub integration is connected in Vercel dashboard
2. Repository permissions are granted
3. Branch is pushed to GitHub (not just local)
4. `vercel.json` doesn't have `deploymentEnabled: false` for all branches

**Solution:**
```bash
# Verify remote is set
git remote -v

# Ensure branch is pushed
git push origin [branch-name]

# Check Vercel dashboard for webhooks
# Settings → Git → GitHub Integration → Check webhook status
```

### Build Failing on Preview

**Check build logs:**
1. Go to Vercel dashboard
2. Click failed deployment
3. View build logs
4. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Package installation failures
   - Build command issues

**Solution:**
```bash
# Test build locally first
npm run build

# Check environment variables in Vercel
# Settings → Environment Variables → Preview scope

# Ensure all preview-specific variables are set
```

### Preview URL Not Working (404)

**Possible causes:**
1. Deployment succeeded but app has runtime errors
2. Incorrect routing in Next.js
3. Build output directory mismatch

**Solution:**
1. Check runtime logs in Vercel dashboard
2. Test the same code locally: `npm run build && npm run start`
3. Verify `next.config.ts` settings

### Database Connection Issues on Preview

**Issue**: Preview can't connect to database

**Solution:**
```bash
# Check DATABASE_URL in Vercel preview environment
# Settings → Environment Variables → Preview

# Ensure DIRECT_URL is set for Prisma migrations
# Common issue: Using localhost or development URLs in preview

# Use staging database for previews (recommended):
# DATABASE_URL="postgresql://user:pass@staging-db.com/dbname"
```

---

## Best Practices

### 1. Branch Naming

Use clear, descriptive branch names:

```bash
# Good
git checkout -b feature/map-search
git checkout -b fix/mobile-menu-z-index
git checkout -b test/new-color-scheme

# Avoid
git checkout -b updates
git checkout -b test
git checkout -b asdf
```

Clear names = clear preview URLs!

### 2. Commit Messages

Write meaningful commits:

```bash
# Good
git commit -m "Add GPS location filter to map view"
git commit -m "Fix: Mobile menu overlapping header"

# Avoid
git commit -m "updates"
git commit -m "fix"
```

Helps team understand what's in each preview.

### 3. Clean Up Branches

Delete merged branches to clean up preview deployments:

```bash
# After merging to main
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

Vercel automatically deletes preview deployments for deleted branches.

### 4. Use Preview Comments

When creating PRs, add context:

```markdown
## Preview Checklist
- [ ] Desktop layout tested
- [ ] Mobile layout tested
- [ ] Forms validated
- [ ] Links working
- [ ] Performance checked

Preview: [Click here](https://fotolokashen-git-feature-name.vercel.app)
```

### 5. Test Before Merging

Always test your preview deployment before merging:
- ✅ Click through the entire feature
- ✅ Test on mobile device
- ✅ Check console for errors
- ✅ Verify database operations work
- ✅ Test authentication flows

---

## Production Deployment Workflow

Since `main` branch auto-deploy is **disabled**, here's how to deploy to production:

### Manual Production Deployment

1. **Merge feature to main:**
   ```bash
   git checkout main
   git merge feature/my-feature
   git push origin main
   ```

2. **Deploy via Vercel Dashboard:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click on your project
   - Find the latest `main` branch deployment
   - Click "Promote to Production"
   
   **OR**

3. **Deploy via Vercel CLI:**
   ```bash
   # Install Vercel CLI if not installed
   npm i -g vercel

   # Deploy to production
   vercel --prod
   ```

### Why Manual Production Deploys?

✅ **Safety**: Prevents accidental production releases  
✅ **Control**: Final review before going live  
✅ **Flexibility**: Deploy specific commits, not just latest  
✅ **Rollback**: Easy to revert to previous deployment  

---

## Quick Reference

### Common Commands

```bash
# Create and deploy feature branch
git checkout -b feature/name
git push origin feature/name

# Update existing preview
git add .
git commit -m "Update feature"
git push origin feature/name

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Clean up merged branches
git branch -d feature/name
git push origin --delete feature/name
```

### Vercel CLI Commands

```bash
# Link project to Vercel (first time setup)
vercel link

# List all deployments
vercel ls

# View logs for specific deployment
vercel logs [deployment-url]

# Deploy to production
vercel --prod

# Pull environment variables
vercel env pull .env.local
```

---

## Resources

- [Vercel Git Integration Docs](https://vercel.com/docs/deployments/git)
- [Preview Deployments Guide](https://vercel.com/docs/deployments/preview-deployments)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

## Summary

✅ **Preview deployments are automatic** for all feature branches  
✅ **Production deployments are manual** for safety  
✅ **Every push triggers a new preview** with its own URL  
✅ **GitHub integration shows deployment status** on PRs  
✅ **Vercel dashboard provides full visibility** into all deployments  

**Next Steps:**
1. Create a feature branch
2. Push to GitHub
3. Watch Vercel automatically deploy your preview
4. Share preview URL for testing
5. Merge when ready (manual production deploy)

Happy deploying! 🚀
