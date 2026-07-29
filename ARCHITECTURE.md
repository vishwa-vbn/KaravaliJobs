# ARCHITECTURE.md — System Design Reference

## 1. High-Level Diagram

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
                │ (Google Sign-In)   │      │  jobs / users /    │
                └────────────────────┘      │  channelsQueue /   │
                                             │  config             │
                                             └─────────▲──────────┘
                                                        │
                         ┌──────────────────────────────┼──────────────────────────────┐
                         │                              │                              │
               ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────────┐
               │ CLOUD FUNCTIONS  │          │ CLOUD FUNCTIONS  │          │  CLOUD FUNCTIONS     │
               │ expireJobsDaily  │          │ onNewJobCreated  │          │ broadcastNewJob      │
               │ (scheduled)      │          │ (firestore trig) │          │ (firestore trig)     │
               └────────┬─────────┘          └────────┬─────────┘          └──────────┬───────────┘
                        │                              │                              │
                        ▼                              ▼                              ▼
               ┌─────────────────┐          ┌─────────────────┐          ┌──────────────────────┐
               │   BREVO API      │          │   BREVO API      │          │ Telegram Bot API      │
               └─────────────────┘          └─────────────────┘          │ WhatsApp Cloud API     │
                                                                          │ Instagram Graph API     │
                                                                          └──────────────────────┘
```

## 2. Frontend Structure (Next.js App Router)

```
app/
  (public)/
    page.tsx                  → homepage / job feed
    jobs/[jobId]/page.tsx     → job detail (SSR/ISR, SEO metadata, JSON-LD)
    alerts-signup/page.tsx    → Google sign-in + alert opt-in
    privacy-policy/page.tsx
    terms/page.tsx
    about/page.tsx
    contact/page.tsx
  (provider)/
    dashboard/page.tsx        → auth-gated, provider's own jobs
    dashboard/new-job/page.tsx
    layout.tsx                → auth guard wrapper, redirects if not signed in / not provider role
  (admin)/
    admin/ads/page.tsx        → super_admin only, edits config/ads doc
    admin/broadcast-log/page.tsx
  api/                        → route handlers only where a server-side secret is needed
                                 (e.g., webhook receivers if any)
  layout.tsx                  → root layout, loads cookie-consent gate, global providers
components/
  jobs/                       → JobCard, JobFilterBar, JobDetailView
  ads/                        → AdSlot.tsx, AdConsentBanner.tsx
  social/                     → TelegramWidget.tsx, WhatsAppChannelWidget.tsx
  layout/                     → Header, Footer, Nav
lib/
  firebase/                   → client + admin SDK init (separate files, admin only used server-side)
  redux/                      → store.ts, slices/ (filtersSlice, adConsentSlice, authSlice)
  brevo/                      → email-sending helpers (server-only, used inside Cloud Functions or route handlers)
  ads/                        → network-selection logic (priority/fallback based on config/ads)
functions/                    → Firebase Cloud Functions (separate package.json, deployed independently)
  src/
    expireJobsDaily.ts
    onNewJobCreated.ts
    broadcastNewJob.ts
    retryFailedBroadcasts.ts
    lib/brevoClient.ts
    lib/telegramClient.ts
    lib/whatsappClient.ts
    lib/instagramClient.ts
firestore.rules
firestore.indexes.json
```

## 3. Data Model (authoritative — match exactly)

### `users/{uid}`
| Field | Type | Notes |
|---|---|---|
| uid | string | matches Firebase Auth UID |
| email | string | |
| displayName | string | |
| role | `"seeker" \| "provider" \| "super_admin"` | default `"seeker"` on first sign-in |
| subscribedToAlerts | boolean | |
| whatsappOptIn | boolean | Phase 2, default false |
| phone | string \| null | only if whatsappOptIn true, else null |
| createdAt | timestamp | |

### `jobs/{jobId}`
| Field | Type | Notes |
|---|---|---|
| title | string | |
| companyName | string | |
| location | `"Mangalore" \| "Udupi" \| "Remote"` | |
| specificArea | string | free text, e.g. "Hampankatta" |
| jobType | `"Part-time" \| "Permanent" \| "Remote" \| "Contract"` | |
| description | string | |
| salaryRange | string | free text |
| applyMethod | string | phone/email/link, rendered as-is |
| providerId | string | == `users/{uid}` who posted it |
| status | `"active" \| "expired"` | |
| featured | boolean | reserved for future paid upsell, default false |
| createdAt | timestamp | |
| expiresAt | timestamp | `createdAt + 30 days`, reset on renew |

### `channelsQueue/{autoId}`
| Field | Type | Notes |
|---|---|---|
| jobId | string | |
| channels | array of `"telegram" \| "whatsapp" \| "instagram"` | |
| status | `"pending" \| "sent" \| "failed"` | per-document; see note below on per-channel granularity |
| payload | map | denormalized job fields needed for the post (title, companyName, location, link) |
| attempts | number | incremented on each retry |
| lastError | string \| null | |
| createdAt | timestamp | |

> Implementation note: since channels can fail independently, either (a) create one
> `channelsQueue` doc per channel per job, or (b) store a per-channel status map inside a
> single doc (`{ telegram: "sent", whatsapp: "sent", instagram: "pending" }`). Prefer (b)
> to avoid document sprawl — update `SKILLS.md` §Social if you deviate.

### `config/ads` (single doc)
See `PROJECT_SCOPE.md` §3.3 for the exact shape. Read by the frontend at build/runtime to
decide which `<AdSlot>` networks to mount; read by Cloud Functions not at all (client-only
concern).

### `adImpressions/{autoId}` (optional, aggregate-only, no PII)

## 4. Security Rules (Firestore) — Principles

- Default deny on everything.
- `jobs`: public read where `status == 'active'`; write only by authenticated user where
  `request.auth.uid == resource.data.providerId` (update/delete) or
  `request.auth.uid == request.resource.data.providerId` (create). Expired jobs still
  readable directly by ID (bookmarked links) but excluded from the general list query via
  the `status` filter in the query itself, not the rule.
- `users`: a user can read/write only their own doc; role field should not be
  client-writable after creation (enforce via rule: on update, `role` must equal the
  existing `resource.data.role` unless the request is from a Cloud Function using the
  Admin SDK, which bypasses rules by design — role changes happen server-side only).
- `channelsQueue`, `config`, `adImpressions`: no client access at all — Admin SDK
  (Cloud Functions) only. Client reads `config/ads` through a small server-rendered prop
  or a read-only Cloud Function/route handler, not direct client SDK reads, to avoid
  exposing write-path assumptions.
- Use Firestore composite indexes for the two hot queries: `(status ASC, location ASC,
  jobType ASC, createdAt DESC)` and `(providerId ASC, createdAt DESC)`.

## 5. Cloud Functions Detail

### `expireJobsDaily` (scheduled, every 24h)
1. Query `jobs` where `status == 'active' AND expiresAt <= now`.
2. Batch-update `status = 'expired'`.
3. For each, fetch provider email from `users/{providerId}`, send expiry email via Brevo.
4. Log summary (count expired, count emails sent, count failed) via `functions.logger`.

### `onNewJobCreated` (Firestore trigger on `jobs` create)
1. Query `users` where `subscribedToAlerts == true`.
2. Send batched alert email via Brevo (prefer Brevo list-based send over per-user loop if
   the list already exists; otherwise loop with a rate-limit-aware delay to respect the
   free-tier daily send cap).
3. Write a `channelsQueue` doc with the denormalized payload for social broadcast.

### `broadcastNewJob` (Firestore trigger on `channelsQueue` create)
1. For each channel in the doc: call the matching client (`telegramClient`,
   `whatsappClient`, `instagramClient`).
2. Update per-channel status independently; a failure in one must not throw before the
   others are attempted — wrap each in its own try/catch.
3. Instagram: if Graph API credentials aren't configured yet, fall back to writing a
   "ready to post" notification (e.g., send the caption+image to an admin Telegram chat)
   rather than failing silently.

### `retryFailedBroadcasts` (scheduled, hourly)
1. Query `channelsQueue` where any channel status == `"failed"` and `attempts < 5`.
2. Retry with exponential backoff (skip if `attempts >= 5`, mark permanently failed, log
   for manual review in `/admin/broadcast-log`).

## 6. Ad Delivery Architecture

- `<AdSlot slot="header" />` component reads `config/ads` (fetched server-side / cached,
  revalidated periodically — not on every request) and renders the highest-priority
  **enabled** network's script for that slot.
- Each network's loader is isolated in `lib/ads/{network}.ts` implementing a common
  interface (`mount(slotId, containerRef)`), so adding a network later means adding one
  file + a `config/ads` entry, not touching `<AdSlot>` internals.
- Scripts load via `next/script` with `strategy="lazyOnload"` and only after
  `adConsentSlice` state shows the user accepted the cookie-consent banner.
- No ad script loads on any route under `(provider)/` or `(admin)/`.

## 7. SEO Architecture
- `app/jobs/[jobId]/page.tsx` uses `generateMetadata` for per-job title/description +
  Open Graph tags.
- JSON-LD `JobPosting` structured data injected per job detail page (required for Google
  for Jobs surfacing — a free, high-intent traffic source distinct from ads).
- `app/sitemap.ts` dynamically includes all active job URLs.
- `app/robots.ts` allows public routes, disallows `(provider)` and `(admin)` route groups.

## 8. Environment Boundaries
- **Client-exposed** (`NEXT_PUBLIC_*`): Firebase client config, Telegram/WhatsApp channel
  public join links, ad network **public** site/zone IDs where the network requires
  client-side script tags.
- **Server-only** (never `NEXT_PUBLIC_*`): Firebase Admin SDK credentials, Brevo API key,
  Telegram Bot token, Meta (WhatsApp/Instagram) access tokens/app secrets. These live only
  in Cloud Functions config / Vercel server-side env vars — see `SETUP.md`.
