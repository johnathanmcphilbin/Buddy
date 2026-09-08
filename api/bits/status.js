import { getSession } from '../_lib/session.js';
import { getLatestLedgerEntry, getTotalSpentBits } from '../_lib/airtable.js';

// Real Bit balance = earned (from the review ledger) minus spent (from
// shop claims) — never calculated from raw Hackatime hours, and never
// something the browser can adjust on its own. Matched by email, since
// that's set explicitly once (see /api/hackatime/set-email) and is what
// participants actually recognize as their own identity.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSession(req);
  if (!session.hackatimeAccessToken) {
    res.status(200).json({ status: 'Not connected', approvedBits: 0, balance: 0 });
    return;
  }

  if (!session.hackatimeEmail) {
    res.status(200).json({ status: 'No email set', approvedBits: 0, balance: 0 });
    return;
  }

  try {
    const [entry, spent] = await Promise.all([
      getLatestLedgerEntry(session.hackatimeEmail),
      getTotalSpentBits(session.hackatimeEmail)
    ]);

    if (!entry) {
      res.status(200).json({ status: 'Not submitted', approvedBits: 0, balance: 0 });
      return;
    }

    // Approving just means flipping Status to "Approved" in Airtable — Bits
    // default to the tracked hours at submission time (1 hour = 1 Bit,
    // rounded), with no extra step needed. Filling in "Approved Bits"
    // manually overrides that default for cases where fewer hours should count.
    const approvedBits =
      entry.status === 'Approved'
        ? typeof entry.approvedBits === 'number'
          ? entry.approvedBits
          : Math.round(entry.trackedHours)
        : 0;

    res.status(200).json({
      status: entry.status,
      approvedBits,
      spentBits: spent,
      balance: Math.max(0, approvedBits - spent),
      trackedHours: entry.trackedHours,
      reviewerNotes: entry.reviewerNotes
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
