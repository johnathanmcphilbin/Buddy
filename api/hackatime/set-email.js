import { getSession, setSession } from '../_lib/session.js';
import { getAuthenticatedProfile } from '../_lib/hackatime-server.js';
import { verifyOrBindEmail } from '../_lib/identity.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) {
    res.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }

  try {
    const profile = await getAuthenticatedProfile(session.hackatimeAccessToken);
    const allowed = await verifyOrBindEmail(profile.accountId, email);
    if (!allowed) {
      res.status(409).json({ error: 'That email is already registered to a different Hackatime account.' });
      return;
    }
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'Your Hackatime session expired. Reconnect Hackatime and try again.' });
      return;
    }
    console.error('set-email verification failed:', error);
    // TEMPORARY: surfacing the real error to diagnose a live issue.
    // Revert to the generic message once the cause is fixed.
    res.status(502).json({ error: `Could not verify your account right now: ${error.message}` });
    return;
  }

  setSession(res, { ...session, hackatimeEmail: email });
  res.status(200).json({ email });
}
