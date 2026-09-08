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

    res.status(200).json({
      status: entry.status,
      approvedBits: entry.status === 'Approved' ? entry.approvedBits ?? 0 : 0,
      trackedHours: entry.trackedHours,
      reviewerNotes: entry.reviewerNotes
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
