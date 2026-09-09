import { getAuthenticatedProfile } from '../_lib/hackatime-server.js';
import { availableBits } from '../_lib/balance.js';
import { getSession } from '../_lib/session.js';
import { getLatestLedgerEntry, getTotalSpentBits } from '../_lib/airtable.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  const session = getSession(req);
  if (!session.hackatimeAccessToken) {
    res.status(200).json({ status: 'Not connected', approvedBits: 0, balance: 0 });
    return;
  }

  try {
    if (process.env.BITS_ACCOUNT_IDS_MIGRATED !== 'true') {
      return res.status(503).json({ error: 'Balances are temporarily unavailable during account verification.', balance: 0 });
    }
    const profile = await getAuthenticatedProfile(session.hackatimeAccessToken);
    if (profile.trustLevel === 'red') {
      res.status(403).json({ error: 'This account cannot earn or spend Bits.', balance: 0 });
      return;
    }
    const [entry, spent] = await Promise.all([
      getLatestLedgerEntry(profile.accountId),
      getTotalSpentBits(profile.accountId)
    ]);

    if (!entry) {
      res.status(200).json({ status: 'Not submitted', approvedBits: 0, balance: 0 });
      return;
    }

    // Approving just means flipping Status to "Approved" in Airtable — Bits
    // default to the tracked hours at submission time (1 hour = 1 Bit,
    // rounded), with no extra step needed. Filling in "Approved Bits"
    // manually overrides that default for cases where fewer hours should count.
    const approvedBits = availableBits(entry, 0);

    res.status(200).json({
      status: entry.status,
      approvedBits,
      spentBits: spent,
      balance: availableBits(entry, spent),
      trackedHours: entry.trackedHours,
      reviewerNotes: entry.reviewerNotes
    });
  } catch (error) {
    res.status(502).json({ error: 'Could not load your balance.', balance: 0 });
  }
}
