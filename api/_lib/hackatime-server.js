// Server-side Hackatime OAuth + authenticated API calls. Confirmed
// against Hackatime's published OpenAPI spec
// (https://hackatime.hackclub.com/api-docs/v1/swagger.yaml) and a known
// working integration. Client secret and access tokens never leave this
// module's callers on the server — nothing here is imported by client code.

const HACKATIME_BASE_URL = (process.env.HACKATIME_BASE_URL || 'https://hackatime.hackclub.com').trim();

// Vercel's env var UI makes it very easy to end up with a trailing
// newline/space in a pasted value (this bit us: the exact-match
// redirect_uri check kept failing because of an invisible \n). Trim
// defensively so that can never break the OAuth exact-match again.
function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getAuthorizationUrl(state) {
  const clientId = requireEnv('HACKATIME_CLIENT_ID');
  const redirectUri = requireEnv('HACKATIME_REDIRECT_URI');

  const url = new URL(`${HACKATIME_BASE_URL}/oauth/authorize`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'profile read');
  url.searchParams.set('state', state);

  return url.toString();
}

export async function exchangeCodeForToken(code) {
  const clientId = requireEnv('HACKATIME_CLIENT_ID');
  const clientSecret = requireEnv('HACKATIME_CLIENT_SECRET');
  const redirectUri = requireEnv('HACKATIME_REDIRECT_URI');

  const response = await fetch(`${HACKATIME_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    throw new Error(`Hackatime token exchange failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Hackatime token exchange did not return an access token');
  }

  return data.access_token;
}

async function authenticatedGet(path, accessToken) {
  const response = await fetch(`${HACKATIME_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (response.status === 401) {
    const error = new Error('Hackatime session expired or invalid');
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Hackatime API request failed (${response.status})`);
  }

  return response.json();
}

// Normalized project shape: { name, totalSeconds, hours, mostRecentHeartbeat }
export async function getAuthenticatedProjects(accessToken) {
  const data = await authenticatedGet('/api/v1/authenticated/projects', accessToken);
  const projects = Array.isArray(data.projects) ? data.projects : [];

  return projects
    .map((project) => ({
      name: project.name,
      totalSeconds: project.total_seconds ?? 0,
      hours: (project.total_seconds ?? 0) / 3600,
      mostRecentHeartbeat: project.most_recent_heartbeat ?? null,
      archived: Boolean(project.archived)
    }))
    .sort((a, b) => {
      if (!a.mostRecentHeartbeat) return 1;
      if (!b.mostRecentHeartbeat) return -1;
      return new Date(b.mostRecentHeartbeat) - new Date(a.mostRecentHeartbeat);
    });
}

// Normalized profile shape: { username, trustLevel, isAdmin }
export async function getAuthenticatedProfile(accessToken) {
  const data = await authenticatedGet('/api/v1/authenticated/me', accessToken);

  return {
    username: data.username ?? null,
    displayName: data.display_name ?? null,
    trustLevel: data.trust_factor?.trust_level ?? null,
    isAdmin: Boolean(data.is_admin)
  };
}
