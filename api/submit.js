import { escapeHtml } from './_lib/html.js';
import { getSession, setSession } from './_lib/session.js';
import { getAuthenticatedProfile, getAuthenticatedProjects } from './_lib/hackatime-server.js';
import { createYswsSubmission, createBitsLedgerEntry, getAllLedgerEntries } from './_lib/airtable.js';
import { sendReviewEmail } from './_lib/email.js';

// Until a verified sending domain is set up in Resend, review emails can
// only go to the Resend account's own email — override with
// REVIEWER_EMAIL once that's sorted (e.g. johnny@hackclub.com).
const REVIEWER_EMAIL = process.env.REVIEWER_EMAIL?.trim() || 'johnathanmcphilbin2@gmail.com';

const MINIMUM_PROJECT_HOURS = 2;

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
    return ['https:', 'http:'].includes(new URL(value).protocol);
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
  const missing = REQUIRED_FIELDS.filter((field) => typeof body[field] !== 'string' || !body[field].trim() || body[field].length > 10000);
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

    if (profile.trustLevel === 'red') {
      res.status(403).json({ error: 'This account cannot earn or spend Bits.' });
      return;
    }
    const selectedProject = projects.find((project) => project.name === session.hackatimeProject);
    if (!selectedProject || !Number.isFinite(selectedProject.hours) || selectedProject.hours < 0) {
      res.status(400).json({ error: 'Select a valid Hackatime project before submitting.' });
      return;
    }
    if (selectedProject.hours < MINIMUM_PROJECT_HOURS) {
      res.status(400).json({ error: `Log at least ${MINIMUM_PROJECT_HOURS} hours on this project before submitting (you have ${selectedProject.hours.toFixed(1)}).` });
      return;
    }
    const hackatimeUsername = profile.username ?? '';

    // Someone can resubmit as they log more hours on the same project.
    // The YSWS Project Submission table gets exactly one row per project;
    // every resubmit instead adds a Buddy Bits Ledger line for just the
    // hours worked since their last submission.
    const priorEntries = await getAllLedgerEntries(body.email);
    const priorProjectEntries = priorEntries.filter((entry) => entry.hackatimeProject === session.hackatimeProject);
    const priorHours = priorProjectEntries.reduce((sum, entry) => sum + entry.trackedHours, 0);
    const trackedHours = Math.max(0, selectedProject.hours - priorHours);

    if (priorProjectEntries.length > 0 && trackedHours < 0.01) {
      res.status(400).json({ error: "You haven't logged any new hours on this project since your last submission." });
      return;
    }

    const existingSubmissionRecordId = priorProjectEntries.find((entry) => entry.submissionRecordId)?.submissionRecordId ?? null;

    const submissionRecordId = existingSubmissionRecordId
      ?? (await createYswsSubmission({
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
      }));

    await createBitsLedgerEntry({
      email: body.email,
      hackatimeUsername,
      hackatimeProject: session.hackatimeProject,
      trackedHours,
      submissionRecordId
    });

    // Best-effort: a failed notification email should never make a
    // successful Airtable submission look like it failed to the user.
    try {
      await sendReviewEmail({
        to: REVIEWER_EMAIL,
        subject: `Buddy submission: ${body.firstName} ${body.lastName}`,
        html: `
          <p><strong>${escapeHtml(body.firstName)} ${escapeHtml(body.lastName)}</strong> (${escapeHtml(body.email)}) submitted a Buddy for review.</p>
          <ul>
            <li>Hackatime project: ${escapeHtml(session.hackatimeProject)}</li>
            <li>New tracked hours since last submission: ${trackedHours.toFixed(1)}</li>
            <li>Code URL: <a href="${escapeHtml(body.codeUrl)}">${escapeHtml(body.codeUrl)}</a></li>
            <li>Playable URL: <a href="${escapeHtml(body.playableUrl)}">${escapeHtml(body.playableUrl)}</a></li>
            ${body.roboflowUrl ? `<li>Roboflow: <a href="${escapeHtml(body.roboflowUrl)}">${escapeHtml(body.roboflowUrl)}</a></li>` : ''}
          </ul>
          <p>${escapeHtml(fullDescription).replace(/\n/g, '<br />')}</p>
          <p>Open the Buddy Bits Ledger table in Airtable and set this entry's Status to Approved to award Bits for these new hours (defaults to the tracked hours above — fill in Approved Bits there to award a different amount).</p>
        `
      });
    } catch (error) {
      console.error('Review notification email failed:', error.message);
    }

    // Email is only a contact address; authenticated account owns the balance.
    if (session.hackatimeEmail !== body.email) {
      setSession(res, { ...session, hackatimeEmail: body.email });
    }

    res.status(200).json({ submitted: true });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'Your Hackatime session expired. Reconnect Hackatime and try again.' });
      return;
    }
    console.error('Submission failed:', error);
    res.status(502).json({ error: 'Submission could not be completed. Please contact the organizer before retrying.' });
  }
}
