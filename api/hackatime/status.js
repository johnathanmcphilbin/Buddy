import { getAuthenticatedProjects, getAuthenticatedProfile } from '../_lib/hackatime-server.js';
import { getSession } from '../_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSession(req);

  if (!session.hackatimeAccessToken) {
    res.status(200).json({ connected: false, project: null, hours: 0, trustLevel: null, banned: false });
    return;
  }

  try {
    const [profile, projects] = await Promise.all([
      getAuthenticatedProfile(session.hackatimeAccessToken),
      getAuthenticatedProjects(session.hackatimeAccessToken)
    ]);

    const selected = session.hackatimeProject ? projects.find((project) => project.name === session.hackatimeProject) : null;

    res.status(200).json({
      connected: true,
      username: profile.username,
      email: session.hackatimeEmail ?? null,
      trustLevel: profile.trustLevel,
      // Hackatime's own anti-cheat system flags accounts red; treat that
      // as a hard block rather than inventing our own appeal process.
      banned: profile.trustLevel === 'red',
      project: session.hackatimeProject ?? null,
      hours: selected ? selected.hours : 0,
      projects: projects.map((project) => ({ name: project.name, hours: project.hours }))
    });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      res.status(200).json({ connected: false, project: null, hours: 0, trustLevel: null, banned: false });
      return;
    }
    res.status(502).json({ error: error.message });
  }
}
