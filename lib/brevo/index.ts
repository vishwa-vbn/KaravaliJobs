// lib/brevo/ — Server-only email sending helpers
// Used inside Cloud Functions (functions/src/lib/brevoClient.ts) and Next.js route handlers
// NEVER import Brevo helpers from client components — the API key is server-only
// See SKILLS.md §Transactional & Alert Email (Brevo) and ARCHITECTURE.md §8
//
// TODO Phase 2: implement sendExpiryNotice(providerEmail, job) and sendNewJobAlert(subscriberEmails, job)

export {};
