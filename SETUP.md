# SETUP.md — Environment & Setup Guide

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20.x LTS | Required for Next.js 14+ and Firebase Functions v2 |
| npm / pnpm | latest | pnpm preferred for speed, npm fine |
| Firebase CLI | latest | `npm i -g firebase-tools` |
| Vercel CLI | latest (optional) | for local preview of prod env |
| Git | latest | |

## 2. Accounts to Create Before Starting

1. **Firebase / Google Cloud** — free Blaze plan (still free at this scale, Blaze is
   required for Cloud Functions outbound network calls like Brevo/Telegram, but stays
   within free-tier quotas for this traffic level).
2. **Vercel** — free Hobby plan, connect to the GitHub repo.
3. **Brevo** (brevo.com) — free plan (300 emails/day). Generate a **Transactional API
   Key** under SMTP & API settings.
4. **Adsterra** (adsterra.com) — publisher account, add the domain, get zone IDs per ad
   unit (header banner, native banner, social bar).
5. **Media.net** and **PropellerAds** — publisher accounts (optional, can be added after
   Adsterra is live and working).
6. **Telegram** — create a bot via **@BotFather**, get the bot token; create a public
   channel and add the bot as an admin (with post permission).
7. **Meta for Developers** (developers.facebook.com) — create an app for:
   - WhatsApp Channel (can start as a simple broadcast channel via the WhatsApp app
     itself, no API needed for the basic version).
   - WhatsApp Cloud API (Phase 2) — requires Meta Business verification.
   - Instagram Graph API (Phase 2/3) — requires an Instagram Business account linked to
     a Facebook Page, plus app review for `instagram_content_publish` permission.
8. **Domain name** — for `ads.txt`, SEO, and Meta/Google verification steps.
9. **Google Search Console** — verify the domain, submit sitemap once live.

## 3. Local Project Setup

```bash
# 1. Clone / init repo
git clone <repo-url> udupi-mangalore-jobs
cd udupi-mangalore-jobs

# 2. Install frontend deps
npm install

# 3. Install functions deps
cd functions
npm install
cd ..

# 4. Login to Firebase & link project
firebase login
firebase use --add   # select or create the Firebase project

# 5. Copy env template
cp .env.example .env.local
```

## 4. Environment Variables

### `.env.local` (Next.js, client + server)
```bash
# Firebase client config (safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Ad networks (public IDs only)
NEXT_PUBLIC_ADSTERRA_ZONE_HEADER=
NEXT_PUBLIC_ADSTERRA_ZONE_NATIVE=
NEXT_PUBLIC_MEDIANET_SITE_ID=

# Public social links (for widgets)
NEXT_PUBLIC_TELEGRAM_CHANNEL_URL=https://t.me/UdupiMangaloreJobs
NEXT_PUBLIC_WHATSAPP_CHANNEL_URL=

# Server-only (do NOT prefix with NEXT_PUBLIC_)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

### Cloud Functions env (set via `firebase functions:config:set` or `.env` in `functions/`
for v2 functions)
```bash
BREVO_API_KEY=
BREVO_SENDER_EMAIL=jobs@yourdomain.com
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=@UdupiMangaloreJobs
WHATSAPP_CLOUD_API_TOKEN=      # Phase 2, leave blank until ready
WHATSAPP_PHONE_NUMBER_ID=      # Phase 2
INSTAGRAM_ACCESS_TOKEN=        # Phase 2/3, leave blank until ready
INSTAGRAM_BUSINESS_ACCOUNT_ID= # Phase 2/3
ADMIN_NOTIFY_TELEGRAM_CHAT_ID= # for manual-post fallback (Instagram before automation ready)
```

Never commit `.env*` files. Confirm `.gitignore` includes `.env*`, `functions/.env*`,
and any Firebase service account JSON.

## 5. Firebase Project Setup Steps

```bash
firebase init firestore   # accept default rules/index file locations
firebase init functions   # choose TypeScript
firebase init hosting     # optional if not using Vercel for frontend; skip if Vercel-only

# Deploy security rules & indexes once written (see ARCHITECTURE.md §4)
firebase deploy --only firestore:rules,firestore:indexes

# Deploy functions once written
cd functions && npm run build && cd ..
firebase deploy --only functions
```

Enable Google as a sign-in provider in Firebase Console → Authentication → Sign-in
method.

## 6. Local Development

```bash
# Terminal 1: Firebase emulators (Auth, Firestore, Functions)
firebase emulators:start

# Terminal 2: Next.js dev server
npm run dev
```
Point the frontend Firebase client SDK at the emulator when `NODE_ENV=development`
(standard `connectFirestoreEmulator` / `connectAuthEmulator` guard in
`lib/firebase/client.ts`).

## 7. Deployment

### Frontend (Vercel)
- Connect GitHub repo in Vercel dashboard.
- Add all `NEXT_PUBLIC_*` and server-only env vars in Vercel Project Settings →
  Environment Variables (mark server-only ones as such, not exposed to browser).
- Every push to `main` auto-deploys to production; PRs get preview URLs.

### Backend (Firebase)
```bash
firebase deploy --only functions,firestore:rules,firestore:indexes
```
Do this from CI (GitHub Actions) once stable, using a Firebase CI token
(`firebase login:ci`) stored as a repo secret — not required for the first manual launch.

## 8. Pre-Launch Compliance Checklist
- [ ] Privacy Policy, Terms, About, Contact pages live.
- [ ] Cookie consent banner gates all ad script loading.
- [ ] `ads.txt` published at domain root listing all active ad network entries (each
      network's dashboard provides the exact line to add).
- [ ] robots.txt / sitemap.xml live and submitted to Google Search Console.
- [ ] Brevo sender domain verified (SPF/DKIM) for deliverability.
- [ ] Telegram bot has post permission confirmed in the channel.

## 9. Manual Testing Checklist (run before every production deploy)
1. Sign in as provider (Google) → post a job → confirm it appears on `/` within the
   expected refresh window.
2. Confirm Telegram channel receives the new-job message with a working deep link.
3. Confirm WhatsApp Channel receives the post (manual check until API-automated).
4. Confirm a test alert-subscribed seeker account receives the Brevo email.
5. On job detail page, confirm ad slots render (or gracefully render nothing if a network
   has no fill) and don't shift layout after load (CLS check).
6. Force-expire a test job (adjust `expiresAt` in emulator or a disposable dev doc) →
   run `expireJobsDaily` manually (`firebase functions:shell`) → confirm status flips and
   expiry email sends.
7. Renew the same job from `/dashboard` → confirm `expiresAt` resets and status returns
   to `active`.
8. Check `/dashboard`, `/alerts-signup`, `/admin/*` render **zero** ad scripts (inspect
   network tab).
9. Run Lighthouse on `/` and a job detail page — confirm ads aren't tanking performance
   score below acceptable thresholds (target: Performance ≥ 80 mobile).
