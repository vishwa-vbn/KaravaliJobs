# AGENT.md — Operating Instructions for the Build Agent

This file tells the coding agent (Antigravity) **how to work** on this repository.
Read this first, then `ARCHITECTURE.md`, then `SETUP.md`, then `SKILLS.md`, then
`PROJECT_SCOPE.md` for full product context. Treat these four files as the source of
truth — if code and docs disagree, flag it instead of silently picking one.

## 1. Project Identity
- **Name:** Udupi-Mangalore Job Board
- **Type:** Production web app (Next.js + Firebase), ad-monetized, social-traffic-driven.
- **Non-negotiables:** $0 base infra cost (stay within free tiers), fast (SSR/ISR, no
  layout shift from ads), mobile-first (most local traffic will be mobile), no login
  required to browse/apply as a seeker.

## 2. Build Order (do not reorder without asking)
1. Firebase project + Auth + Firestore rules/indexes (Phase 0 in PROJECT_SCOPE.md).
2. Core job board (public feed, job detail, provider dashboard, 30-day expiry logic).
3. Cloud Functions for expiry + Brevo email.
4. Ad monetization layer (`config/ads` + `<AdSlot>` component + Adsterra first).
5. Social broadcast layer (Telegram → WhatsApp Channel → Instagram, in that order — this
   is the order of implementation ease, not importance).
6. SEO (JSON-LD, sitemap, robots.txt).
7. Hardening (security rules, App Check, analytics).

Do not build ad monetization or social broadcast before the core job board works
end-to-end. Do not skip the Privacy Policy / Terms pages before wiring ad scripts — every
ad network requires them, and this blocks nothing else so it can be done in parallel.

## 3. Definition of Done (per feature)
A feature is not done until:
- It works with real Firestore data (not mocked) in the local emulator or a dev project.
- Firestore security rules explicitly cover the new collection/fields (default-deny, then
  allow specific operations — never leave a collection open).
- Mobile viewport (375px) is checked, not just desktop.
- No console errors/warnings in the browser.
- If it touches Cloud Functions: it has a `try/catch`, logs errors via
  `functions.logger`, and failures don't throw unhandled — especially for the ad
  broadcast queue, where one channel failing must not block the others (see
  `channelsQueue` design in ARCHITECTURE.md).
- If it touches ads: the slot respects `maxSlotsPerViewport`, loads lazily, and is absent
  from `/dashboard/*`, `/alerts-signup`, and any authenticated flow.
- If it touches email: unsubscribe path works and the Brevo API key is read from an env
  var, never hardcoded or client-exposed.

## 4. Coding Conventions
- **Language:** TypeScript everywhere (frontend + Cloud Functions).
- **Structure:** Next.js App Router conventions (`app/`, route groups for
  `(public)` vs `(provider)` vs `(admin)`).
- **State:** Redux Toolkit slices only for cross-component UI state (filters, ad-consent,
  auth session mirror). Server data (jobs list, job detail) is fetched via Server
  Components / RTK Query where realtime isn't needed; use Firestore `onSnapshot` only
  where live updates genuinely matter (e.g., provider dashboard listing status).
- **Styling:** Tailwind CSS utility classes; no inline styles except for
  dynamically-computed values.
- **Secrets:** All API keys (Brevo, Adsterra zone IDs if sensitive, Meta tokens) go in
  environment variables per `SETUP.md`. Never commit `.env*` files.
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`), one logical
  change per commit.
- **Naming:** Firestore collections are lowerCamelCase plural nouns (`jobs`, `users`,
  `channelsQueue`) — match `ARCHITECTURE.md` exactly, don't invent alternate names.

## 5. When the Agent Should Stop and Ask
- Before enabling a new ad network beyond what's in `PROJECT_SCOPE.md` §3.
- Before adding any collection of user PII beyond what's in the schema (phone numbers,
  precise location, etc.) — India's DPDP Act implications should be flagged.
- Before implementing the WhatsApp Cloud API or Instagram Graph API publish flow (both
  require Meta Business verification / app review — confirm credentials exist first;
  fall back to the manual-post-notification path described in `PROJECT_SCOPE.md` §4.3
  if they don't).
- Before changing Firestore security rules in a way that widens public write access.
- Before introducing a paid/non-free-tier dependency.

## 6. Testing Expectations
- Unit tests for: expiry-date calculation logic, ad-slot network-selection logic
  (priority/fallback), channelsQueue retry/backoff logic.
- Manual test checklist (documented in `SETUP.md` §Testing) run before each deploy:
  post a job → confirm it appears in feed → confirm Telegram message sent → confirm
  Brevo alert email sent → let it expire (or force via emulator clock) → confirm status
  flips and expiry email sends → renew → confirm status flips back.

## 7. Deployment
- Frontend: Vercel, auto-deploy from `main` branch, preview deploys on PRs.
- Backend: `firebase deploy --only functions,firestore:rules,firestore:indexes` — never
  deploy functions without also reviewing rules changes in the same PR if data shape changed.
- Environment variables mirrored in Vercel dashboard and `firebase functions:config` /
  `.env` for functions (see `SETUP.md`).

## 8. Reference Priority
When in doubt about *what* to build: `PROJECT_SCOPE.md`.
When in doubt about *how the system fits together*: `ARCHITECTURE.md`.
When in doubt about *environment/credentials/local run*: `SETUP.md`.
When in doubt about *how to approach a specific capability* (ads, email, social, SEO):
`SKILLS.md`.
