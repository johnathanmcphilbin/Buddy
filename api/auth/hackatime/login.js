import { randomBytes } from 'node:crypto';
import { getAuthorizationUrl } from '../../_lib/hackatime-server.js';
import { setOAuthState } from '../../_lib/session.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const state = randomBytes(16).toString('hex');
    setOAuthState(res, state);

    const authorizeUrl = getAuthorizationUrl(state);
    res.writeHead(302, { Location: authorizeUrl });
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
