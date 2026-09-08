import { exchangeCodeForToken } from '../../_lib/hackatime-server.js';
import { readOAuthState, clearOAuthState, getSession, setSession } from '../../_lib/session.js';

// Where to send the browser back to after connecting. Same site, no
// server-rendered pages to redirect into — the frontend reads its own
// connection status from /api/hackatime/status on load.
//
// The query string must come before the #hash, not after — anything
// after # is a URL fragment, not a real query param, so a browser never
// sees `?hackatime_error=...` if it's tacked on after the hash.
const RETURN_HASH = '#hackatime';

function redirectTo(res, errorMessage) {
  const query = errorMessage ? `?hackatime_error=${encodeURIComponent(errorMessage)}` : '';
  res.writeHead(302, { Location: `/${query}${RETURN_HASH}` });
  res.end();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    redirectTo(res, String(oauthError));
    return;
  }

  const expectedState = readOAuthState(req);
  clearOAuthState(res);

  if (!code || !state || !expectedState || state !== expectedState) {
    redirectTo(res, 'invalid_state');
    return;
  }

  try {
    const accessToken = await exchangeCodeForToken(code);

    const session = getSession(req);
    setSession(res, { ...session, hackatimeAccessToken: accessToken, hackatimeProject: null });

    redirectTo(res, null);
  } catch (error) {
    redirectTo(res, error.message);
  }
}
