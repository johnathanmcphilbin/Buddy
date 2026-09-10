# Security review — 2026-09-09

Status: fixes are local and tested; production configuration, historical data
migration, key rotation and deployment remain outstanding. This is a targeted
source review, not certification that the deployed service is secure.

## Findings and fixes

- **Exposed Roboflow private API key:** found in frontend source and reachable Git
  history. Removed from active source. The inference handler now injects
  `ROBOFLOW_API` on the server, accepts bounded base64 images only, and returns
  only detection fields rather than upstream configuration/errors. Local Vite
  uses the same handler. Added a shared daily upstream-call cap (default 10,000)
  to bound paid inference abuse. Anonymous visitors can exhaust the daily quota;
  stronger bot protection may be desirable for a public launch.
- **Account impersonation via email:** `/api/hackatime/set-email` and
  `/api/submit` used to accept any contact email and trust it for balance
  lookups, so a different Hackatime account could type someone else's email
  and read or add to their balance. Two earlier attempted fixes on
  2026-09-09/10 were rolled back: adding a `Hackatime User ID` Airtable field
  (the field was never actually added, breaking all submissions/claims), then
  a Redis-based first-write-wins binding (production's Redis wasn't actually
  configured, breaking `set-email` immediately since the old
  `BITS_ACCOUNT_IDS_MIGRATED` gate had silently masked every Redis-dependent
  code path being broken until then). Final fix, `api/_lib/identity.js`'s
  `emailOwnedByOther`, needs neither: it reads the `Hackatime Username` field
  Buddy already writes into every Buddy Bits Ledger row, and rejects an email
  whose prior rows belong to a different username. `set-email` and `submit`
  both check this before trusting the email — a brand-new email is open to
  whoever submits with it first; reuse by a different account gets a 409. No
  schema change, no new infrastructure, no dependency on Redis being
  configured correctly. Gap: an attacker who front-runs a legitimate
  participant's first *submission* (not just a saved email — a submission is
  what actually creates a ledger row) still occupies that email first; this
  closes reuse, not first-use squatting, and squatting now requires a visible
  fabricated submission a reviewer would see in Airtable, not just a bare
  API call.
- **Concurrent overspending:** claims use a separate balance read and Airtable
  write, so two claims landing in the same instant could theoretically both
  pass the balance check before either write lands. A Redis-backed per-account
  lock was added on 2026-09-09 to close this, then removed on 2026-09-10 by
  explicit decision: it depended on Redis being correctly configured in
  production, which it wasn't (see the impersonation-fix history above for
  the same discovery), and was blocking the shop entirely. Accepted as a
  narrow, low-severity race for a small-scale hackathon shop instead — Bits
  are only ever granted by the organizer approving a ledger entry, so the
  worst case is a slight over-claim caught on manual review, not a
  participant minting their own balance. Revisit if claim volume/stakes grow
  enough to justify depending on Redis again (verify it works this time).
- **Editable browser balance:** removed localStorage balance loading/saving and
  the unused local purchase function. The backend remains authoritative; anyone
  can still edit their own displayed DOM, but that cannot authorize a claim.
  Upgrade badges remain a cosmetic local preference, not proof of ownership.
- **Session hardening:** authenticated encryption, seven-day server-enforced
  expiry, rejection of weak placeholder secrets, malformed cookies, tampered
  sessions and old session format. All participants must reconnect after release.
- **Additional protections:** server-side banned-account checks, invalid ledger
  values rejected, review-email HTML escaped, HTTP(S)-only submission links,
  account data marked no-store, and failed claim emails no longer cause a
  successful debit to be reported as a failed purchase.

## Required before production activation

1. **Revoke the old Roboflow key and create a new scoped key.** Save it only as
   `ROBOFLOW_API` in Vercel and, if needed, an ignored local `.env` file. Do not
   paste it into source or chat. Rotation is required even after deleting source:
   the old value remains in Git history, old deployments and the separate nested
   `Buddy/` checkout. That untracked checkout was left unchanged. Do not deploy it.
2. The `Hackatime User ID` Airtable field migration was abandoned (see above) —
   no Airtable schema change is required. If any legacy ledger/claim rows
   already have emails that don't match their true Hackatime account, that's
   a pre-existing data-quality issue independent of this fix; reconcile
   manually if suspected.
3. Redis (`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) is now only used
   by the Roboflow daily-inference counter (`api/roboflow.js`) — not by claims
   or identity checks anymore, both of which were switched off Redis on
   2026-09-10 after discovering it wasn't actually working in production.
   Confirm it's configured if the demo's daily quota cap matters; if not, the
   demo just 502s on the next call rather than any balance/identity risk.
4. Set a strong random `SESSION_SECRET` of at least 32 characters. Configure
   `ROBOFLOW_DAILY_LIMIT` to the acceptable global daily request allowance.
5. Deploy these fixes, reconnect, and verify a real approved account and a real
   debit using non-production data first. Production environment settings,
   Airtable schema, live provider responses and Redis consistency were not
   exercised by the local mocked tests.

## Validation and limits

- `node --test tests/security.test.js`: 23 tests, all passing. Covers the
  email/account identity check (ledger-history-based, cross-account rejection
  at both `set-email` and `submit`), server-priced claims, sequential repeat
  claims, failed-write handling, invalid ledger values, forged/expired
  sessions, banned accounts, secret stripping, inference quota, unsafe
  images, email markup, and the 2-hour minimum project-hours gate on
  submission.
- `npm run build`: passes; existing Svelte accessibility/unused-property warnings.
- Pattern-based scan of reachable local Git history found one distinct credential
  candidate: the Roboflow key. No additional obvious credential literals found.
  This is not an exhaustive secret detector and does not inspect Vercel secrets,
  remote branches absent locally, hosted files or provider logs.
- `npm audit --omit=dev`: one moderate vulnerable package, Svelte, with multiple
  advisories. The suggested fix is a major upgrade to Svelte 5.57.0; not applied
  during this targeted fix. Most reported issues involve SSR (this site is
  client-rendered); DOM-clobbering also merits review. No high/critical production
  dependency advisories were returned. Development dependencies were not audited.
- Submission spam/rate limiting, end-to-end retry idempotency, and broader
  penetration testing remain separate work. A repeated click after a successful
  affordable purchase can intentionally buy another item. Concurrent requests
  *can* both pass the balance check before either write lands (no lock — see
  "Concurrent overspending" above); accepted as low-severity given Bits are
  organizer-approved regardless. Airtable admin edits remain trusted.

## References

- [Hackatime OAuth profile fields](https://hackatime.hackclub.com/docs/oauth/oauth-apps)
- [Roboflow key management](https://docs.roboflow.com/developer/authentication/find-your-roboflow-api-key)
- [Upstash REST API](https://upstash.com/docs/redis/features/restapi)
- [Svelte DOM-clobbering advisory](https://github.com/advisories/GHSA-rcqx-6q8c-2c42)
