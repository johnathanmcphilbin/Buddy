import { getAuthenticatedProjects } from '../_lib/hackatime-server.js';
import { getSession } from '../_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSession(req);
  if (!session.hackatimeAccessToken) {
    res.status(401).json({ error: 'Hackatime is not connected' });
    return;
  }

  try {
    const projects = await getAuthenticatedProjects(session.hackatimeAccessToken);
    res.status(200).json({ projects });
  } catch (error) {
    const status = error.code === 'UNAUTHORIZED' ? 401 : 502;
    res.status(status).json({ error: error.message });
  }
}
