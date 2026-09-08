import { getSession } from './_lib/session.js';
import { getAuthenticatedProfile, getAuthenticatedProjects } from './_lib/hackatime-server.js';
import { createYswsSubmission, createBitsLedgerEntry } from './_lib/airtable.js';
import { sendReviewEmail } from './_lib/email.js';

// Until a verified sending domain is set up in Resend, review emails can
// only go to the Resend account's own email — override with
// REVIEWER_EMAIL once that's sorted (e.g. johnny@hackclub.com).
const REVIEWER_EMAIL = process.env.REVIEWER_EMAIL?.trim() || 'johnathanmcphilbin2@gmail.com';

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getSession(req);
  if (!session.hackatimeAccessToken || !session.hackatimeProject) {
    res.status(401).json({ error: 'Connect Hackatime and pick your Buddy project before submitting.' });
    return;
  }

  const { firstName, lastName, email, githubUsername, githubUrl, demoVideoUrl, roboflowUrl, description } = req.body ?? {};

  if (!firstName || !lastName || !email || !githubUsername || !githubUrl || !demoVideoUrl || !description) {
    res.status(400).json({ error: 'All fields are required.' });
    return;
  }

  if (!isValidUrl(githubUrl) || !isValidUrl(demoVideoUrl)) {
    res.status(400).json({ error: 'GitHub URL and demo video URL must be valid URLs.' });
    return;
  }

  if (roboflowUrl && !isValidUrl(roboflowUrl)) {
    res.status(400).json({ error: 'Roboflow URL must be a valid URL.' });
    return;
  }

  const fullDescription = roboflowUrl ? `${description}\n\nRoboflow project: ${roboflowUrl}` : description;

  try {
    // Fetch live from Hackatime rather than trusting anything cached in
    // the session, so the hours recorded at submission time are current.
    const [profile, projects] = await Promise.all([
      getAuthenticatedProfile(session.hackatimeAccessToken),
      getAuthenticatedProjects(session.hackatimeAccessToken)
    ]);

    const selectedProject = projects.find((project) => project.name === session.hackatimeProject);
    const trackedHours = selectedProject ? selectedProject.hours : 0;
    const hackatimeUsername = profile.username ?? '';

    const submissionRecordId = await createYswsSubmission({
      firstName,
      lastName,
      email,
      githubUsername,
      githubUrl,
      demoVideoUrl,
      description: fullDescription,
      hackatimeUsername,
      hackatimeProject: session.hackatimeProject
    });

    await createBitsLedgerEntry({
      email,
      hackatimeUsername,
      hackatimeProject: session.hackatimeProject,
      trackedHours,
      submissionRecordId
    });

    await sendReviewEmail({
      to: REVIEWER_EMAIL,
      subject: `Buddy submission: ${firstName} ${lastName}`,
      html: `
        <p><strong>${firstName} ${lastName}</strong> (${email}) submitted a Buddy for review.</p>
        <ul>
          <li>Hackatime project: ${session.hackatimeProject}</li>
          <li>Tracked hours at submission: ${trackedHours.toFixed(1)}</li>
          <li>GitHub: <a href="${githubUrl}">${githubUrl}</a></li>
          <li>Demo video: <a href="${demoVideoUrl}">${demoVideoUrl}</a></li>
          ${roboflowUrl ? `<li>Roboflow: <a href="${roboflowUrl}">${roboflowUrl}</a></li>` : ''}
        </ul>
        <p>${fullDescription.replace(/\n/g, '<br />')}</p>
        <p>Open the Buddy Bits Ledger table in Airtable to set Approved Bits and Status for this submission.</p>
      `
    });

    res.status(200).json({ submitted: true });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
