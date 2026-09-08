import { getSession } from '../_lib/session.js';
import { getAuthenticatedProfile } from '../_lib/hackatime-server.js';
import { getLatestLedgerEntry, getTotalSpentBits, createShopClaim } from '../_lib/airtable.js';
import { getShopItem } from '../_lib/shop-inventory.js';
import { sendReviewEmail } from '../_lib/email.js';

const REVIEWER_EMAIL = process.env.REVIEWER_EMAIL?.trim() || 'johnathanmcphilbin2@gmail.com';

// Claims are handled here rather than in the browser: the item id is
// looked up server-side for its real price (never trusting a price sent
// by the client), the current balance is recomputed from Airtable (matched
// by email — see /api/hackatime/set-email), and only if that balance
// covers the price does the claim get written and an email go out. Two
// claims landing at the exact same moment could still both read the same
// starting balance before either write lands — Airtable has no
// transaction primitive to prevent that — but that's a narrow window for
// a single-reviewer flow, not a first-come-first-served storefront under
// real concurrent load.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSession(req);
  if (!session.hackatimeAccessToken) {
    res.status(401).json({ error: 'Connect Hackatime first.' });
    return;
  }

  if (!session.hackatimeEmail) {
    res.status(401).json({ error: 'Add your email on the Hackatime connect step first.' });
    return;
  }

  const itemId = req.body?.itemId;
  const item = getShopItem(itemId);
  if (!item) {
    res.status(400).json({ error: 'Unknown item.' });
    return;
  }

  try {
    const [profile, entry, spent] = await Promise.all([
      getAuthenticatedProfile(session.hackatimeAccessToken),
      getLatestLedgerEntry(session.hackatimeEmail),
      getTotalSpentBits(session.hackatimeEmail)
    ]);

    const approvedBits =
      entry?.status === 'Approved'
        ? typeof entry.approvedBits === 'number'
          ? entry.approvedBits
          : Math.round(entry.trackedHours)
        : 0;

    const balance = Math.max(0, approvedBits - spent);

    if (balance < item.price) {
      res.status(200).json({ claimed: false, error: 'You need more Bits for this upgrade.', balance });
      return;
    }

    await createShopClaim({
      hackatimeUsername: profile.username,
      email: session.hackatimeEmail,
      itemTitle: item.title,
      itemName: item.item,
      price: item.price
    });

    await sendReviewEmail({
      to: REVIEWER_EMAIL,
      subject: `Buddy shop claim: ${item.title}`,
      html: `
        <p><strong>${session.hackatimeEmail}</strong> (Hackatime: ${profile.username}) claimed <strong>${item.title}</strong> for ${item.price} Bits.</p>
        <p>You need to send them: <strong>${item.item}</strong></p>
        <p>New balance: ${balance - item.price} Bits.</p>
        <p>Mark it Fulfilled in the Buddy Shop Claims table once it's sent.</p>
      `
    });

    res.status(200).json({ claimed: true, balance: balance - item.price, group: item.group });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
