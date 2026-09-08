import { getSession } from './_lib/session.js';
import { getAuthenticatedProfile, getAuthenticatedProjects } from './_lib/hackatime-server.js';
import { createYswsSubmission, createBitsLedgerEntry } from './_lib/airtable.js';
import { sendReviewEmail } from './_lib/email.js';

// Until a verified sending domain is set up in Resend, review emails can
// only go to the Resend account's own email — override with
// REVIEWER_EMAIL once that's sorted (e.g. johnny@hackclub.com).
const REVIEWER_EMAIL = process.env.REVIEWER_EMAIL?.trim() || 'johnathanmcphilbin2@gmail.com';

const REQUIRED_FIELDS = [
  'codeUrl',
  'playableUrl',
  'firstName',
  'lastName',
  'email',
  'description',
  'githubUsername',
  'addressLine1',
  'city',
  'stateProvince',
  'country',
  'zip',
  'birthday'
];

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

  const body = req.body ?? {};
  const missing = REQUIRED_FIELDS.filter((field) => !body[field]);
  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    return;
  }

  if (!isValidUrl(body.codeUrl) || !isValidUrl(body.playableUrl)) {
    res.status(400).json({ error: 'Code URL and Playable URL must be valid URLs.' });
    return;
  }

  if (body.roboflowUrl && !isValidUrl(body.roboflowUrl)) {
    res.status(400).json({ error: 'Roboflow URL must be a valid URL.' });
    return;
  }

  const fullDescription = body.roboflowUrl ? `${body.description}\n\nRoboflow project: ${body.roboflowUrl}` : body.description;

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
      codeUrl: body.codeUrl,
      playableUrl: body.playableUrl,
      howHeard: body.howHeard,
      doingWell: body.doingWell,
      howImprove: body.howImprove,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      description: fullDescription,
      githubUsername: body.githubUsername,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      stateProvince: body.stateProvince,
      country: body.country,
      zip: body.zip,
      birthday: body.birthday,
      hackatimeUsername,
      hackatimeProject: session.hackatimeProject,
      screenshot: body.screenshot
    });

    await createBitsLedgerEntry({
      email: body.email,
      hackatimeUsername,
      hackatimeProject: session.hackatimeProject,
      trackedHours,
      submissionRecordId
    });

    await sendReviewEmail({
      to: REVIEWER_EMAIL,
      subject: `Buddy submission: ${body.firstName} ${body.lastName}`,
      html: `
        <p><strong>${body.firstName} ${body.lastName}</strong> (${body.email}) submitted a Buddy for review.</p>
        <ul>
          <li>Hackatime project: ${session.hackatimeProject}</li>
          <li>Tracked hours at submission: ${trackedHours.toFixed(1)}</li>
          <li>Code URL: <a href="${body.codeUrl}">${body.codeUrl}</a></li>
          <li>Playable URL: <a href="${body.playableUrl}">${body.playableUrl}</a></li>
          ${body.roboflowUrl ? `<li>Roboflow: <a href="${body.roboflowUrl}">${body.roboflowUrl}</a></li>` : ''}
        </ul>
        <p>${fullDescription.replace(/\n/g, '<br />')}</p>
        <p>Open the Buddy Bits Ledger table in Airtable and set Status to Approved to award Bits (defaults to tracked hours — fill in Approved Bits there to award a different amount).</p>
      `
    });

    res.status(200).json({ submitted: true });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
