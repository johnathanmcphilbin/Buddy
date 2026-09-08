import { exchangeCodeForToken } from '../../_lib/hackatime-server.js';
import { readOAuthState, clearOAuthState, getSession, setSession } from '../../_lib/session.js';

// Where to send the browser back to after connecting. Same site, no
// server-rendered pages to redirect into — the frontend reads its own
// connection status from /api/hackatime/status on load.
const RETURN_PATH = '/#hackatime';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    res.writeHead(302, { Location: `${RETURN_PATH}?hackatime_error=${encodeURIComponent(oauthError)}` });
    res.end();
    return;
  }

  const expectedState = readOAuthState(req);
  clearOAuthState(res);

  if (!code || !state || !expectedState || state !== expectedState) {
    res.writeHead(302, { Location: `${RETURN_PATH}?hackatime_error=invalid_state` });
    res.end();
    return;
  }

  try {
    const accessToken = await exchangeCodeForToken(code);

    const session = getSession(req);
    setSession(res, { ...session, hackatimeAccessToken: accessToken, hackatimeProject: null });

    res.writeHead(302, { Location: RETURN_PATH });
    res.end();
  } catch (error) {
    res.writeHead(302, { Location: `${RETURN_PATH}?hackatime_error=${encodeURIComponent(error.message)}` });
    res.end();
  }
}
