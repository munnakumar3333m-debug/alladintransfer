# Free Deployment Guide — AlphaTrade Pro

Deploy everything for free so the app runs 24/7 without Replit being open.

---

## Step 1 — Push Code to GitHub (required by all platforms)

1. Go to [github.com](https://github.com) → Sign up or log in (free)
2. Click **New repository** → name it `alphatrade-pro` → **Create repository**
3. In Replit, open the **Shell** tab and run:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/alphatrade-pro.git
   git push -u origin main
   ```

---

## Step 2 — Free Database on Neon

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Click **New Project** → choose a region close to you (Singapore recommended)
3. Copy the **Connection String** — looks like:
   `postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require`
4. Save this — you'll need it in Step 3

---

## Step 3 — Deploy API Server on Render (free)

1. Go to [render.com](https://render.com) → Sign up with GitHub (free)
2. Click **New** → **Web Service** → Connect your GitHub repo `alphatrade-pro`
3. Render will auto-detect `render.yaml` — click **Apply**
4. Set these environment variables in Render dashboard:
   - `DATABASE_URL` → paste your Neon connection string
   - `ANGEL_API_KEY` → your Angel One API key
   - `ANGEL_CLIENT_CODE` → your Angel One client code
   - `ANGEL_MPIN` → your Angel One MPIN
   - `ANGEL_TOTP_SECRET` → your Angel One TOTP secret
5. Click **Deploy** — wait ~3 minutes
6. Your API URL will be: `https://alphatrade-api.onrender.com`
7. **Run database migration once** (in Render Shell):
   ```
   pnpm --filter @workspace/db run push
   ```

> ⚠️ Render free tier sleeps after 15 min of inactivity. Use [cron-job.org](https://cron-job.org) to ping `/api/health` every 10 min to keep it awake — it's free.

---

## Step 4 — Deploy Admin Dashboard on Vercel (free)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub (free)
2. Click **Add New Project** → Import `alphatrade-pro` repo
3. Vercel auto-detects `vercel.json` settings
4. Add this environment variable:
   - `VITE_API_URL` → `https://alphatrade-api.onrender.com`
5. Click **Deploy** — takes ~2 minutes
6. Your admin dashboard URL will be: `https://alphatrade-pro.vercel.app/`

---

## Step 5 — Mobile App (Expo EAS Build — free)

1. Install EAS CLI on your computer:
   ```
   npm install -g eas-cli
   ```
2. Log in to Expo (free account at expo.dev):
   ```
   eas login
   ```
3. Update `artifacts/mobile-app/eas.json` — replace `alphatrade-api.onrender.com` with your actual Render URL
4. Build the APK (Android):
   ```
   cd artifacts/mobile-app
   eas build --profile preview --platform android
   ```
5. Download the APK and install it on your phone

---

## Summary of Free URLs

| Service | URL |
|---------|-----|
| Admin Dashboard | `https://alphatrade-pro.vercel.app` |
| API Server | `https://alphatrade-api.onrender.com` |
| Mobile App | Install APK from EAS build |

---

## Keep Render API Awake for Free

Render's free tier pauses after 15 min of no traffic. To prevent this:
1. Go to [cron-job.org](https://cron-job.org) → Sign up (free)
2. Create a cron job → URL: `https://alphatrade-api.onrender.com/api/health`
3. Schedule: every 10 minutes
4. Done — your API stays awake 24/7 for free
