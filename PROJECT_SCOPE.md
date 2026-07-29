# Project Scope: Localized Job Board (Udupi & Mangalore) — Production Plan

Version 2.0 — supersedes the original MVP scope. Adds monetization (multi-network ads),
social traffic acquisition (Instagram / Telegram / WhatsApp), and Brevo as the transactional
email provider.

---

## 1. Product Summary

A fast, ad-supported, hyper-local job board for the Udupi & Mangalore region.

- **Job Seekers** browse and apply without logging in. Optional Google sign-in unlocks
  email job alerts.
- **Job Providers** sign in with Google, post jobs from an admin dashboard, and renew
  listings every 30 days.
- **Revenue** comes from display/native ad networks (Adsterra + others) layered
  non-intrusively across public pages, plus (later) a "Featured Listing" paid upsell.
- **Growth** comes primarily from free/organic channels: an Instagram page, a Telegram
  broadcast channel, and WhatsApp channel/groups — each auto-fed by a bot whenever a new
  job is posted.

This is still a $0-infra-cost architecture (Firebase free tier + Vercel free tier +
Brevo free tier + ad network SDKs), monetized entirely through traffic, not subscriptions.

---

## 2. System Architecture (High Level)

```
                         ┌───────────────────────────────────────────┐
                         │              NEXT.JS FRONTEND              │
                         │  Tailwind CSS · Redux Toolkit · Firebase   │
                         │  Client SDK · Ad Network Script Loader     │
                         └───────┬───────────────────────┬───────────┘
                                 │                        │
                     Auth & Writes                 Realtime Reads (onSnapshot / ISR)
                                 │                        │
                                 ▼                        ▼
                    ┌───────────────────┐      ┌────────────────────┐
                    │   FIREBASE AUTH    │      │      FIRESTORE     │
                    │ (Google Sign-In)   │      │  (jobs, users,     │
                    └────────────────────┘      │  channelsQueue,    │
                                                 │  adImpressions)    │
                                                 └─────────▲──────────┘
                                                            │
                              ┌─────────────────────────────┼─────────────────────────────┐
                              │                             │                             │
                    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────────┐
                    │ CLOUD FUNCTIONS  │          │ CLOUD FUNCTIONS  │          │  CLOUD FUNCTIONS     │
                    │ Daily Expiry Cron│          │ onDocumentCreated│          │ Social Broadcast Job │
                    │ (30-day lifecycle)│          │ (new job trigger)│          │ (Telegram/WA/IG)     │
                    └────────┬─────────┘          └────────┬─────────┘          └──────────┬───────────┘
                             │                              │                               │
                             ▼                              ▼                               ▼
                    ┌─────────────────┐          ┌─────────────────┐          ┌──────────────────────┐
                    │   BREVO API      │          │   BREVO API      │          │ Telegram Bot API      │
                    │ (expiry emails)  │          │ (job alert email)│          │ WhatsApp Cloud API    │
                    └─────────────────┘          └─────────────────┘          │ Instagram Graph API    │
                                                                                └──────────────────────┘

Ad Networks (client-side, loaded on public pages only):
  Adsterra · Media.net · PropellerAds · (Google AdSense once traffic/policy qualifies)
```

### Core stack decisions
| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14+ App Router | SSR/ISR for SEO, fast local search indexing |
| Styling | Tailwind CSS | Speed of build, small bundle |
| Client state | Redux Toolkit | Filters, UI state, ad-consent state |
| Auth | Firebase Auth (Google provider) | Zero-cost, trusted, minimal friction |
| Database | Firestore | Realtime, generous free tier, simple rules-based security |
| Serverless compute | Firebase Cloud Functions | Cron jobs, triggers, webhook receivers |
| Transactional email | **Brevo (Sendinblue) free tier** | 300 emails/day free, good deliverability, EU-hosted |
| Ads | Adsterra (primary) + Media.net / PropellerAds (secondary) + AdSense (once eligible) | Diversify fill-rate & eCPM, no minimum traffic to start with Adsterra |
| Hosting | Vercel (frontend) + Firebase (backend) | Free tier, edge caching, easy CI/CD |
| Social distribution | Telegram Bot API, WhatsApp Cloud API (Meta), Instagram Graph API (Meta) | Free, direct-to-audience, matches how this region actually consumes job listings |

---

## 3. Monetization: Multi-Network Ad Strategy

### 3.1 Why multiple networks
Adsterra has no minimum traffic requirement and approves fast — good for day one.
Google AdSense has stricter content/traffic/policy requirements (and is picky about thin,
templated job-listing pages), so it's added later once there's real traffic + a privacy
policy + enough original content. Running 2–3 networks lets an ad-mediation-lite setup
maximize fill rate: if one network has no ad to serve a slot, fall back to the next.

**Recommended lineup, in priority order:**
1. **Adsterra** — Social Bar, Native Banner, Popunder (used sparingly — see UX rules), Banner 300x250 / 728x90.
2. **Media.net** — contextual ads, good for job/content pages, higher quality creative.
3. **PropellerAds** — push notifications + interstitials, backup fill.
4. **Google AdSense** — apply once the site has ~30+ days of history, real traffic, and
   full policy pages (Privacy Policy, About, Contact, cookie consent). Highest eCPM once approved.

### 3.2 Ad slot placement (non-intrusive, UX-first)

| Placement | Page | Format | Notes |
|---|---|---|---|
| Header banner | All public pages | 728x90 / responsive | Below nav, above fold |
| In-feed native | Homepage job feed | Native ad card every 6–8 job cards | Styled to look distinct from job cards (labelled "Sponsored") |
| Sidebar (desktop only) | Job detail page | 300x250 | Sticky on scroll |
| Footer / sticky mobile banner | All public pages, mobile | 320x50 sticky | Dismissible, capped impressions/session |
| Social Bar (Adsterra) | Global, low frequency | Adsterra Social Bar unit | Throttled — max 1 interaction prompt per session |
| **Never** | Provider dashboard, login, apply-confirmation | — | No ads on authenticated/transactional flows — protects conversion & avoids accidental clicks skewing metrics |

Rules the agent must enforce:
- No popunders/interstitials on the `/dashboard/*` or `/alerts-signup` flow.
- No more than 3 ad slots visible in a single viewport at once.
- All ad scripts lazy-loaded (`next/script strategy="lazyOnload"`) so Core Web Vitals / SEO
  aren't hurt.
- A lightweight **AdSlot** React component abstracts network selection, so networks can be
  swapped/reordered from a Firestore-backed config doc (`config/ads`) without a redeploy.
- Respect `prefers-reduced-motion` / no auto-playing video ads.

### 3.3 Ad config data model
```json
// config/ads (single Firestore doc)
{
  "networks": {
    "adsterra": { "enabled": true, "priority": 1, "zoneIds": { "header": "xxxx", "native": "xxxx" } },
    "medianet": { "enabled": true, "priority": 2, "siteId": "xxxx" },
    "propellerads": { "enabled": true, "priority": 3, "zoneId": "xxxx" },
    "adsense": { "enabled": false, "priority": 4, "publisherId": "" }
  },
  "maxSlotsPerViewport": 3,
  "mobileStickyEnabled": true
}
```

### 3.4 Compliance requirements before running ads
- Privacy Policy page disclosing ad cookies/tracking (required by every network).
- Cookie consent banner (India's DPDP Act + good practice for any EU/US visitors) —
  simple accept/reject, gates ad script loading.
- Terms of Service + About/Contact pages (required for AdSense review later).
- `ads.txt` file at domain root once networks are finalized (prevents ad fraud, required
  by most networks including AdSense).

---

## 4. Traffic Acquisition: Instagram / Telegram / WhatsApp

The core growth loop: **every new job post automatically becomes a social post**, so the
job board itself becomes the content engine for all three channels — no manual work.

### 4.1 Telegram (highest priority — easiest, most direct)
- Create a public Telegram Channel (e.g. `@UdupiMangaloreJobs`).
- Cloud Function (`onDocumentCreated` on `jobs`) formats a message and posts via the
  **Telegram Bot API** (`sendMessage`) — free, no approval needed, immediate.
- Message includes: title, company, location, salary range, and a deep link back to
  `/jobs/[jobId]` (this is the actual SEO + ad-revenue payoff — traffic lands on-site).
- Add a **Telegram "Join Channel" widget** on the homepage to convert site visitors into
  channel subscribers (compounding reach).

### 4.2 WhatsApp
Two tracks, because WhatsApp has real constraints:
- **WhatsApp Channel** (Meta's broadcast-only "Channels" feature, free, unlimited followers,
  no messaging-template approval needed) — post the same content as Telegram. This is the
  easiest WhatsApp path and should be primary.
- **WhatsApp Cloud API** (optional, later phase) — for users who opt in via
  `/alerts-signup` and explicitly consent to WhatsApp alerts, using Meta's official Cloud
  API with an approved message template (`new_job_alert`). Requires a Meta Business
  verification — flagged as a Phase 2 item, not blocking launch.

### 4.3 Instagram
- Instagram doesn't allow direct feed-post automation the way Telegram does without a
  connected Facebook Page + Graph API + a content-creation step (captions/graphics), so
  this is semi-automated:
  - Cloud Function generates a caption template + calls a lightweight image-generation
    step (a simple branded template: job title, company, location, "Apply via link in bio /
    website") and stages it.
  - Publishing uses the **Instagram Graph API** `POST /media` + `POST /media_publish`
    against a connected Instagram Business account (requires Meta Business + Instagram
    Business account linkage — Phase 2/3 item).
  - Until that's wired up, Phase 1 ships a **manual/semi-automated fallback**: the Cloud
    Function drops a ready-to-post caption + image into an admin Slack/Telegram notification
    for a human to post in under a minute. This unblocks launch without waiting on Meta's
    app review for Instagram publishing permissions.

### 4.4 Channel-post data model
```json
// channelsQueue/{autoId}
{
  "jobId": "auto_generated_id",
  "channels": ["telegram", "whatsapp", "instagram"],
  "status": "pending", // pending | sent | failed
  "payload": {
    "title": "Part-Time Delivery Partner",
    "companyName": "Mangalore Logistics Co.",
    "location": "Mangalore",
    "link": "https://domain.com/jobs/auto_generated_id"
  },
  "attempts": 0,
  "createdAt": "2026-07-01T10:00:00Z"
}
```
A single `broadcastNewJob` Cloud Function processes this queue per-channel, so a failure
in one channel (e.g. Instagram API hiccup) doesn't block Telegram/WhatsApp delivery, and
failed sends are retried with backoff.

### 4.5 Growth loop summary
```
New Job Posted → Firestore write → onDocumentCreated trigger
   → enqueue to channelsQueue
   → broadcastNewJob Function fans out to Telegram + WhatsApp (instant) + Instagram (queued)
   → each post links back to the site (SEO + ad impressions)
   → site visitors join channels via widgets → compounding subscriber base
```

---

## 5. Updated Database Schema (Firestore)

### `users`
```json
{
  "uid": "google_user_id_123",
  "email": "user@gmail.com",
  "displayName": "John Doe",
  "role": "provider", // seeker | provider | super_admin
  "subscribedToAlerts": true,
  "whatsappOptIn": false,
  "phone": null,
  "createdAt": "2026-07-01T10:00:00Z"
}
```

### `jobs`
```json
{
  "jobId": "auto_generated_id",
  "title": "Part-Time Delivery Partner",
  "companyName": "Mangalore Logistics Co.",
  "location": "Mangalore",
  "specificArea": "Hampankatta",
  "jobType": "Part-time",
  "description": "Looking for evening shift riders...",
  "salaryRange": "₹10,000 - ₹15,000",
  "applyMethod": "Phone: +91 98765XXXXX or Email: jobs@mgl.com",
  "providerId": "google_user_id_123",
  "status": "active", // active | expired
  "featured": false,
  "createdAt": "2026-07-01T10:00:00Z",
  "expiresAt": "2026-07-31T10:00:00Z"
}
```

### `channelsQueue` (new — see 4.4)

### `config/ads` (new — see 3.3)

### `adImpressions` (optional, lightweight self-tracking, new)
```json
{
  "network": "adsterra",
  "slot": "header",
  "page": "/",
  "date": "2026-07-01"
  // aggregate counters incremented server-side or via a nightly rollup, not per-click PII
}
```

---

## 6. Frontend Application Map (updated)

### Public Pages
- `/` — job feed + filters + header/in-feed ad slots + Telegram/WhatsApp channel widgets.
- `/jobs/[jobId]` — job detail, SEO metadata, sidebar ad slot.
- `/alerts-signup` — Google sign-in for email alerts; WhatsApp opt-in checkbox (Phase 2).
- `/privacy-policy`, `/terms`, `/about`, `/contact` — required for ad network compliance.

### Provider Pages (auth-gated, no ads)
- `/dashboard` — listings table, Renew/Delete actions.
- `/dashboard/new-job` — post form.

### Admin (super_admin role, new)
- `/admin/ads` — toggle networks/priorities in `config/ads` without redeploying.
- `/admin/broadcast-log` — view `channelsQueue` send status, retry failed sends.

---

## 7. Cloud Functions Inventory

| Function | Trigger | Responsibility |
|---|---|---|
| `expireJobsDaily` | Scheduled (every 24h) | Mark expired jobs, email provider via Brevo |
| `onNewJobCreated` | Firestore `onDocumentCreated` (jobs) | Email alert subscribers via Brevo + enqueue `channelsQueue` |
| `broadcastNewJob` | Firestore `onDocumentCreated` (channelsQueue) | Post to Telegram + WhatsApp Channel; queue Instagram |
| `retryFailedBroadcasts` | Scheduled (hourly) | Retry `status == 'failed'` queue items with backoff |
| `sendWhatsappCloudAlert` (Phase 2) | Callable / triggered | Sends approved WhatsApp template to opted-in users |

---

## 8. Email Service: Brevo Integration

- Free tier: 300 emails/day, no credit card required — sufficient for local-scale alerts.
- Use **Brevo Transactional Email API** (REST, `api-key` header) from Cloud Functions —
  do not expose the API key client-side.
- Two email types:
  1. **Expiry notice** to providers (30-day lifecycle).
  2. **New job alert** to subscribed seekers (batched — Brevo supports sending to a list
     or looping with rate-limit awareness to stay under free-tier daily caps).
- Use Brevo's **contact lists** feature to manage `subscribedToAlerts` seekers instead of
  looping raw email sends where possible — cleaner unsubscribe handling (required by law/
  ad network policy) and better deliverability reputation.
- Add unsubscribe link footer to every email (Brevo can auto-manage this via list-based sends).

---

## 9. Milestones & Execution Plan

- [ ] **Phase 0: Foundations**
  - Firebase project, Google Auth, Firestore rules & indexes.
  - Vercel project + domain + `ads.txt` placeholder.
  - Privacy Policy / Terms / About / Contact pages (blocks ad approval if skipped).
- [ ] **Phase 1: Core Job Board**
  - Homepage feed + filters (RTK-managed state).
  - Job detail page, apply flow (no login).
  - Provider dashboard: post/renew/delete, 30-day expiry calc.
- [ ] **Phase 2: Automation Backend**
  - `expireJobsDaily`, `onNewJobCreated` Cloud Functions.
  - Brevo integration (expiry + alert emails), unsubscribe handling.
- [ ] **Phase 3: Ad Monetization**
  - `config/ads`-driven `<AdSlot>` component.
  - Integrate Adsterra first, then Media.net + PropellerAds.
  - Cookie consent banner gating ad script load.
  - (Later) Apply for Google AdSense once traffic/history qualifies.
- [ ] **Phase 4: Social Distribution**
  - Telegram Bot + channel; `broadcastNewJob` function.
  - WhatsApp Channel broadcast.
  - Instagram semi-automated caption/image staging (manual post fallback initially).
  - Homepage widgets to grow channel subscriber counts.
- [ ] **Phase 5: SEO & Launch**
  - Local metadata, sitemap.xml, robots.txt, JSON-LD `JobPosting` schema per listing
    (critical for Google for Jobs eligibility — free extra traffic channel).
  - Submit sitemap to Google Search Console.
- [ ] **Phase 6: Hardening**
  - Firestore security rules audit, rate limiting on public write endpoints (job posting
    still requires auth, but add abuse protection e.g. App Check).
  - Analytics (Firebase Analytics or Plausible) to track ad revenue vs. channel-driven traffic.
  - AdSense application once eligible.

---

## 10. Success Metrics
- Channel subscriber growth (Telegram/WhatsApp) week over week.
- % of site sessions originating from social channel links (UTM-tagged deep links).
- Ad fill rate & eCPM by network (rotate/deprioritize underperformers via `config/ads`).
- Job renewal rate (providers renewing at day 30 = product-market signal).
- Email alert open/click rate via Brevo dashboard.
