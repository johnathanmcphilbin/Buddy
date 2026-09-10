# Security review — 2026-09-09

Status: fixes are local and tested; production configuration, historical data
migration, key rotation and deployment remain outstanding. This is a targeted
source review, not certification that the deployed service is secure.

## Findings and fixes

- **Exposed Roboflow private API key:** found in frontend source and reachable Git
  history. Removed from active source. The inference handler now injects
  `ROBOFLOW_API_KEY` on the server, accepts bounded base64 images only, and returns
  only detection fields rather than upstream configuration/errors. Local Vite
  uses the same handler. Added a shared daily upstream-call cap (default 10,000)
  to bound paid inference abuse. Anonymous visitors can exhaust the daily quota;
  stronger bot protection may be desirable for a public launch.
- **Account impersonation via email:** `/api/hackatime/set-email` accepts any
  contact email, while balances and spending are looked up by that email. A fix
  switching lookups to the immutable Hackatime account ID was deployed 2026-09-09
  but rolled back the same day: it requires a `Hackatime User ID` field on both
  Airtable tables that was never added, which broke all submissions and claims.
  Reverted to email-based lookup by explicit decision — the impersonation risk
  documented here is accepted for now, not fixed.
- **Concurrent overspending:** claims used a separate balance read and Airtable
  write. Added a shared per-account Redis lock around the balance check, write
  and debit visibility check. It has no expiry: an ambiguous write or crashed
  worker leaves the account blocked for manual reconciliation, rather than
  risking another debit. Missing storage blocks all claims.
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
   `ROBOFLOW_API_KEY` in Vercel and, if needed, an ignored local `.env` file. Do not
   paste it into source or chat. Rotation is required even after deleting source:
   the old value remains in Git history, old deployments and the separate nested
   `Buddy/` checkout. That untracked checkout was left unchanged. Do not deploy it.
2. Add a **single-line text** field named `Hackatime User ID` to both Airtable
   tables: `Buddy Bits Ledger` and `Buddy Shop Claims`. Backfill **every existing
   earned AND spent record** with its verified numeric Hackatime account ID as
   text. Verify ownership from provider/admin records; never trust an arbitrary
   email supplied by a visitor. Reconcile suspicious legacy claims and blank
   identities manually. Missing old spending would otherwise inflate balances.
3. Configure a persistent, non-evicting Redis database shared by all production
   workers, with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Avoid
   replica reads, expiring trial databases and automatic clearing of claim locks.
   Keep preview deployments isolated from production storage and Airtable data.
4. Set a strong random `SESSION_SECRET` of at least 32 characters. Set
   `BITS_ACCOUNT_IDS_MIGRATED=true` **only after the data reconciliation above**.
   Until then, balance reads and claims return a maintenance error. Configure
   `ROBOFLOW_DAILY_LIMIT` to the acceptable global daily request allowance.
5. Deploy these fixes, reconnect, and verify a real approved account and a real
   debit using non-production data first. Production environment settings,
   Airtable schema, live provider responses and Redis consistency were not
   exercised by the local mocked tests.

## If a claim lock remains held

The key is `buddy:claim:` followed by the SHA-256 hex digest of the numeric
Hackatime user ID string. Stop/quiesce claims for that account, confirm the old
worker cannot still write, inspect Airtable for the possibly completed debit,
reconcile duplicates or missing records, then remove that exact lock. Never
clear locks automatically or while the old write could still finish. Notify the
participant about the outcome before they retry. Unfulfilled claims in Airtable
are the source of truth if an email notification fails.

## Validation and limits

- `node --test tests/security.test.js`: 20 tests covering account substitution,
  server pricing, concurrent/sequential claims, ambiguous writes, missing storage,
  migration gate, invalid ledger values, forged/expired sessions, banned accounts,
  secret stripping, inference quota, unsafe images and email markup.
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
  affordable purchase can intentionally buy another item; concurrent requests
  cannot spend beyond the tested balance. Airtable admin edits remain trusted.

## References

- [Hackatime OAuth profile fields](https://hackatime.hackclub.com/docs/oauth/oauth-apps)
- [Roboflow key management](https://docs.roboflow.com/developer/authentication/find-your-roboflow-api-key)
- [Redis SET NX](https://redis.io/docs/latest/commands/set/)
- [Upstash REST API](https://upstash.com/docs/redis/features/restapi)
- [Svelte DOM-clobbering advisory](https://github.com/advisories/GHSA-rcqx-6q8c-2c42)
