import { getSession, setSession } from '../_lib/session.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSession(req);
  if (!session.hackatimeAccessToken) {
    res.status(401).json({ error: 'Connect Hackatime first.' });
    return;
  }

  const email = req.body?.email?.trim();
  if (!email || !EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }

  setSession(res, { ...session, hackatimeEmail: email });
  res.status(200).json({ email });
}
