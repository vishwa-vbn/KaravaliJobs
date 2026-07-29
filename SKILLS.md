# SKILLS.md — Capability Playbooks

This file breaks the build into discrete "skills" the agent should treat as separate
areas of expertise. Each skill lists: when it applies, the approach to take, the files it
touches, and pitfalls specific to this project. Read `ARCHITECTURE.md` for exact data
shapes referenced below.

---

## Skill: Core Job CRUD
**When:** Building job posting, listing, filtering, renewal, deletion.
**Approach:**
- Writes go through a thin `lib/jobs/` service layer (not raw Firestore calls scattered
  across components) so expiry-date logic and validation live in one place.
- `expiresAt` is always computed server-side-equivalent (in the client service layer at
  write time, or better, via a Cloud Function `beforeWrite`-style check) — never trust a
  client-sent `expiresAt`.
- Filtering (`location`, `jobType`) is a Firestore compound query, not client-side
  filtering of the full dataset — keep the free-tier read quota healthy as job count grows.
**Files:** `lib/jobs/*`, `components/jobs/*`, `app/(public)/page.tsx`,
`app/(provider)/dashboard/*`.
**Pitfalls:** Forgetting to also update `channelsQueue`/alert logic when a job is
*renewed* vs *created* — renewal should NOT re-trigger a social broadcast or alert email
(that would spam subscribers every 30 days on the same job). Only `create` triggers
broadcast/alert.

---

## Skill: Authentication & Roles
**When:** Any auth-gated route or role-based UI.
**Approach:** Firebase Auth Google provider only (no email/password — reduces attack
surface and matches the "fast sign-in" product goal). Role defaults to `"seeker"` on
first login; promotion to `"provider"` happens implicitly the first time a signed-in user
posts a job (or explicitly via a "Become a Provider" action) — decide and document which,
don't leave it ambiguous. `super_admin` role is set manually in Firestore console, never
self-assignable.
**Files:** `lib/firebase/client.ts`, `lib/redux/slices/authSlice.ts`,
`app/(provider)/layout.tsx` (route guard), `firestore.rules`.
**Pitfalls:** Client-side route guards are UX only — the real enforcement is in
`firestore.rules`. Never rely on a hidden UI element as the security boundary.

---

## Skill: Ad Monetization
**When:** Implementing or modifying any ad network integration.
**Approach:**
1. Build `<AdSlot>` and the `lib/ads/{network}.ts` interface first, wired to a **mock**
   config, before touching real network scripts — validates the abstraction.
2. Integrate Adsterra first (fastest approval, no traffic minimum).
3. Respect placement rules from `PROJECT_SCOPE.md` §3.2 exactly — especially the "no ads
   on authenticated routes" rule and the `maxSlotsPerViewport` cap.
4. Gate every network script behind the cookie-consent state; if the user hasn't
   consented, render a static placeholder or nothing — never load tracking scripts pre-consent.
5. Add `ads.txt` as soon as the first network is live, update it every time a network is
   added/removed.
**Files:** `components/ads/AdSlot.tsx`, `components/ads/AdConsentBanner.tsx`,
`lib/ads/*`, `config/ads` Firestore doc, `public/ads.txt`.
**Pitfalls:** Ad scripts injected via `dangerouslySetInnerHTML` or `next/script` without
`strategy="lazyOnload"` will hurt LCP/CLS and can tank both SEO and (later) AdSense
approval odds — always lazy-load. Popunder-style formats (Adsterra offers these) should
be used sparingly if at all — they're high-revenue but high-bounce; if enabled, cap
frequency (e.g., once per session) via the network's own frequency-capping settings.

---

## Skill: Transactional & Alert Email (Brevo)
**When:** Expiry notices, new-job alerts, any outbound email.
**Approach:**
- All email sends happen server-side (Cloud Functions), using the Brevo REST API with
  the API key from function config — never from the client.
- Prefer Brevo **contact lists** for the alert-subscriber audience over looping
  individual `sendTransacEmail` calls when the list is large, to respect the 300/day free
  cap and get proper unsubscribe/list-management for free.
- Every email template includes an unsubscribe mechanism (Brevo handles this
  automatically for list-based campaign sends; for transactional sends, include a manual
  unsubscribe link that flips `subscribedToAlerts` to false).
**Files:** `functions/src/lib/brevoClient.ts`, `functions/src/expireJobsDaily.ts`,
`functions/src/onNewJobCreated.ts`.
**Pitfalls:** Hitting the 300/day free cap silently — log send counts and alert (even
just a console/log line reviewed manually at this stage) if approaching the daily limit,
since silent failures here mean providers don't get expiry notices and jobs quietly go stale.

---

## Skill: Social Broadcast (Telegram / WhatsApp / Instagram)
**When:** New job created, needs to be posted to social channels.
**Approach:**
- Telegram is the reference implementation — simplest API, no approval gate. Build and
  verify this first.
- WhatsApp Channel: if using the simple broadcast-channel approach (no Cloud API), this
  may not have a public "post via API" option depending on Meta's current channel-API
  availability — verify current Meta documentation before assuming full automation is
  possible; if it isn't, the manual-post-notification fallback pattern (see below)
  applies here too.
- Instagram: assume manual-post-notification fallback until Graph API publish permission
  is actually granted (this requires Meta App Review — a real approval process, not
  instant). Don't build the full automated Instagram publish flow speculatively; build
  the fallback first, swap it out once credentials exist.
- **Manual-post-notification fallback pattern:** the Cloud Function composes the
  caption/content and sends it to an admin-controlled Telegram chat
  (`ADMIN_NOTIFY_TELEGRAM_CHAT_ID`) so a human can copy-paste/post within a minute. This
  is not a hack — it's the correct Phase 1 design given Meta's API approval timelines.
- Each channel's send status is tracked independently per `channelsQueue` doc (see
  `ARCHITECTURE.md` §3) — one channel failing must never block or fail the others.
**Files:** `functions/src/broadcastNewJob.ts`, `functions/src/lib/telegramClient.ts`,
`functions/src/lib/whatsappClient.ts`, `functions/src/lib/instagramClient.ts`,
`functions/src/retryFailedBroadcasts.ts`.
**Pitfalls:** Rate limits — Telegram Bot API allows ~30 messages/second to different
chats but far less to a single channel in a burst; this app posts to one channel at low
frequency (a few jobs/day at local scale) so this shouldn't be an issue, but don't build
a batch-import feature that dumps 50 jobs at once without throttling broadcasts.

---

## Skill: SEO
**When:** Any public-facing page, especially job detail pages.
**Approach:**
- `generateMetadata` per job for title/description/OG tags using the job's actual
  title/location — this is the single highest-leverage SEO investment for a hyper-local
  site (long-tail queries like "part time jobs Udupi Hampankatta").
- JSON-LD `JobPosting` schema on every job detail page — required for Google for Jobs
  eligibility, which is free, high-intent, non-ad traffic.
- Dynamic `sitemap.ts` including only `active` jobs (don't index expired job URLs, though
  they should still 200 if bookmarked — use `noindex` meta on expired job pages instead
  of removing them from the sitemap issue).
**Files:** `app/jobs/[jobId]/page.tsx`, `app/sitemap.ts`, `app/robots.ts`.
**Pitfalls:** Ads and SEO can conflict (ad scripts hurting Core Web Vitals, which is a
ranking factor) — always check Lighthouse after adding a new ad network.

---

## Skill: Compliance & Privacy
**When:** Before enabling any ad network; before collecting any new user field.
**Approach:**
- Cookie consent banner is a hard prerequisite for ad script loading, not an
  afterthought — build it in Phase 3 before the first network goes live, not after.
- Privacy Policy must disclose: Firebase Auth data collected, Firestore data stored, ad
  network cookies/tracking, email data shared with Brevo. Keep it accurate — don't
  template a generic policy that doesn't match what's actually collected.
- India's DPDP Act (Digital Personal Data Protection Act) implications apply given the
  target audience — minimize PII collected (the schema in `ARCHITECTURE.md` already
  keeps `phone` optional/null unless the user explicitly opts into WhatsApp alerts).
**Files:** `app/(public)/privacy-policy/page.tsx`, `app/(public)/terms/page.tsx`,
`components/ads/AdConsentBanner.tsx`.
**Pitfalls:** Retrofitting compliance pages after ads are already live and driving
traffic — do this early, it blocks nothing else and unblocks AdSense eligibility later.

---

## Skill: Security & Hardening
**When:** Before production launch, and any time a new collection/field is added.
**Approach:**
- Every new Firestore collection gets an explicit rules block — no implicit access.
- Add Firebase App Check once the app is functionally complete, to prevent abuse of
  public write paths (job posting, alert signup) by bots — relevant given the app is
  ad-monetized and traffic quality matters for ad network trust scores too.
- Rate-limit-sensitive server actions (job creation) can lean on Firestore rules'
  built-in constraints (e.g., requiring `request.auth != null`) plus App Check; a full
  custom rate limiter is not needed at this scale.
**Files:** `firestore.rules`, App Check setup in `lib/firebase/client.ts`.
**Pitfalls:** Ad network bot traffic / invalid clicks can get a publisher account
suspended — App Check and reasonable rate limiting also indirectly protect ad revenue,
not just data integrity.
