import { getAuthenticatedProjects } from '../_lib/hackatime-server.js';
import { getSession, setSession } from '../_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSession(req);
  if (!session.hackatimeAccessToken) {
    res.status(401).json({ error: 'Hackatime is not connected' });
    return;
  }

  const projectName = req.body?.project;
  if (!projectName || typeof projectName !== 'string') {
    res.status(400).json({ error: 'project is required' });
    return;
  }

  try {
    // Verify the project actually belongs to this user rather than
    // trusting whatever name the browser sends.
    const projects = await getAuthenticatedProjects(session.hackatimeAccessToken);
    const match = projects.find((project) => project.name === projectName);

    if (!match) {
      res.status(404).json({ error: 'That project was not found on your Hackatime account' });
      return;
    }

    setSession(res, { ...session, hackatimeProject: match.name });
    res.status(200).json({ project: match.name, hours: match.hours });
  } catch (error) {
    const status = error.code === 'UNAUTHORIZED' ? 401 : 502;
    res.status(status).json({ error: error.message });
  }
}
