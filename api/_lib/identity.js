// First-write-wins binding between a verified Hackatime account and the
// contact email used for Bits. Balances/claims are still looked up in
// Airtable by email (no schema change needed there), but this stops a
// different Hackatime account from later claiming someone else's email —
// and therefore their balance — since the pairing is checked here before
// any email is ever trusted. Lives in the same Redis already required for
// claim locking, so no new infrastructure is needed either.
import { redis } from './claim-lock.js';

function emailKey(email) {
  return `buddy:identity:email:${email.trim().toLowerCase()}`;
}

// Returns true if `accountId` may use `email` (either it already owns that
// binding, or it just claimed it because nobody had yet). Returns false if
// the email is already bound to a different Hackatime account.
export async function verifyOrBindEmail(accountId, email) {
  const key = emailKey(email);
  const owner = await redis([
    'EVAL',
    "local existing = redis.call('GET', KEYS[1]); if existing == false then redis.call('SET', KEYS[1], ARGV[1]); return ARGV[1] else return existing end",
    '1',
    key,
    accountId
  ]);
  return owner === accountId;
}
