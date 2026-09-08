import { getSession } from '../_lib/session.js';
import { getAuthenticatedProfile } from '../_lib/hackatime-server.js';
import { getLatestLedgerEntry } from '../_lib/airtable.js';

// Real Bit balance, read from the review ledger — never calculated from
// raw Hackatime hours on the fly. Until a submission has been reviewed,
// this reports 0 approved Bits with status "Not submitted".
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSession(req);
  if (!session.hackatimeAccessToken) {
    res.status(200).json({ status: 'Not connected', approvedBits: 0 });
    return;
  }

  try {
    const profile = await getAuthenticatedProfile(session.hackatimeAccessToken);
    const entry = await getLatestLedgerEntry(profile.username);

    if (!entry) {
      res.status(200).json({ status: 'Not submitted', approvedBits: 0 });
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
      trackedHours: entry.trackedHours,
      reviewerNotes: entry.reviewerNotes
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
