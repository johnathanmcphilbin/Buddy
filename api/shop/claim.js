import { getSession } from '../_lib/session.js';
import { getAuthenticatedProfile } from '../_lib/hackatime-server.js';
import { getAllLedgerEntries, getTotalSpentBits, createShopClaim } from '../_lib/airtable.js';
import { getShopItem } from '../_lib/shop-inventory.js';
import { sendReviewEmail } from '../_lib/email.js';
import { availableBits } from '../_lib/balance.js';
import { escapeHtml } from '../_lib/html.js';

const REVIEWER_EMAIL = process.env.REVIEWER_EMAIL?.trim() || 'johnathanmcphilbin2@gmail.com';

// No distributed lock: two claims landing in the same instant could both
// pass the balance check before either write lands (a real but narrow race,
// accepted for simplicity over depending on external lock storage). Bits
// are only ever granted by the organizer approving a ledger entry in
// Airtable, so the worst case is a slight over-claim caught on review, not
// a participant minting their own balance.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = getSession(req);
  if (!session.hackatimeAccessToken) return res.status(401).json({ error: 'Connect Hackatime first.' });
  if (!session.hackatimeEmail) return res.status(401).json({ error: 'Add your email on the Hackatime connect step first.' });
  const item = getShopItem(req.body?.itemId);
  if (!item) return res.status(400).json({ error: 'Unknown item.' });

  try {
    const profile = await getAuthenticatedProfile(session.hackatimeAccessToken);
    if (profile.trustLevel === 'red') return res.status(403).json({ error: 'This account cannot earn or spend Bits.' });

    const [entries, spent] = await Promise.all([
      getAllLedgerEntries(session.hackatimeEmail),
      getTotalSpentBits(session.hackatimeEmail)
    ]);
    const balance = availableBits(entries, spent);
    if (balance < item.price) return res.status(200).json({ claimed: false, error: 'You need more Bits for this upgrade.', balance });

    await createShopClaim({
      hackatimeUsername: profile.username,
      email: session.hackatimeEmail,
      itemTitle: item.title,
      itemName: item.item,
      price: item.price
    });

    // Notification failure must not turn a completed debit into a failed claim.
    try {
      await sendReviewEmail({
        to: REVIEWER_EMAIL,
        subject: `Buddy shop claim: ${item.title}`,
        html: `<p><strong>${escapeHtml(session.hackatimeEmail)}</strong> (Hackatime: ${escapeHtml(profile.username)}) claimed <strong>${escapeHtml(item.title)}</strong> for ${item.price} Bits.</p>
          <p>You need to send them: <strong>${escapeHtml(item.item)}</strong></p>
          <p>New balance: ${balance - item.price} Bits.</p>
          <p>Mark it Fulfilled in the Buddy Shop Claims table once it's sent.</p>`
      });
    } catch {
      console.error('Shop claim recorded; review email failed. Check Airtable for unfulfilled claims.');
    }
    return res.status(200).json({ claimed: true, balance: balance - item.price, group: item.group });
  } catch {
    return res.status(503).json({ error: 'Claims are temporarily unavailable. Please try again later.' });
  }
}
