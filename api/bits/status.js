import { getAuthenticatedProfile } from '../_lib/hackatime-server.js';
import { availableBits, totalApprovedBits } from '../_lib/balance.js';
import { getSession } from '../_lib/session.js';
import { getAllLedgerEntries, getTotalSpentBits } from '../_lib/airtable.js';

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
    if (!session.hackatimeEmail) {
      res.status(200).json({ status: 'Not submitted', approvedBits: 0, balance: 0 });
      return;
    }
    const profile = await getAuthenticatedProfile(session.hackatimeAccessToken);
    if (profile.trustLevel === 'red') {
      res.status(403).json({ error: 'This account cannot earn or spend Bits.', balance: 0 });
      return;
    }
    const [entries, spent] = await Promise.all([
      getAllLedgerEntries(session.hackatimeEmail),
      getTotalSpentBits(session.hackatimeEmail)
    ]);

    if (entries.length === 0) {
      res.status(200).json({ status: 'Not submitted', approvedBits: 0, balance: 0 });
      return;
    }

    // Every submission adds its own ledger line for the new hours logged
    // since last time, so Bits earned is the sum of every Approved line
    // (Bits default to that line's tracked hours, rounded, unless a
    // reviewer fills in "Approved Bits" to override it) rather than just
    // the most recent submission.
    const approvedBits = totalApprovedBits(entries);
    const latest = entries[entries.length - 1];

    res.status(200).json({
      status: latest.status,
      approvedBits,
      spentBits: spent,
      balance: availableBits(entries, spent),
      trackedHours: latest.trackedHours,
      reviewerNotes: latest.reviewerNotes
    });
  } catch (error) {
    res.status(502).json({ error: 'Could not load your balance.', balance: 0 });
  }
}
