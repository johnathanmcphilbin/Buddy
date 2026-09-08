// Server-side Airtable access. Centralizes table/field names in one
// place so nothing else in the codebase has to know Airtable's raw
// record shape. AIRTABLE_TOKEN is never imported by client code.

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

const SUBMISSION_TABLE = 'YSWS Project Submission';
const LEDGER_TABLE = 'Buddy Bits Ledger';

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function airtableRequest(path, options = {}) {
  const token = requireEnv('AIRTABLE_TOKEN');
  const baseId = requireEnv('AIRTABLE_BASE_ID');

  const response = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${body}`);
  }

  return response.json();
}

// Writes into Hack Club's shared YSWS submission schema. Only fields we
// actually collect are set — address/birthday/screenshot are left blank
// rather than guessed, and the "Automation - Submit to Unified YSWS"
// checkbox is intentionally never set here (that's a real external
// pipeline trigger, not something to flip automatically on every submit).
export async function createYswsSubmission(submission) {
  const fields = {
    'First Name': submission.firstName,
    'Last Name': submission.lastName,
    Email: submission.email,
    'GitHub Username': submission.githubUsername,
    'Code URL': submission.githubUrl,
    'Playable URL': submission.demoVideoUrl,
    Description: submission.description,
    'Justification - Submitter Hackatime ID': submission.hackatimeUsername,
    'Justification - Hackatime Project Name(s) + Date Range(s)': submission.hackatimeProject
  };

  const data = await airtableRequest(`${encodeURIComponent(SUBMISSION_TABLE)}`, {
    method: 'POST',
    body: JSON.stringify({ fields })
  });

  return data.id;
}

export async function createBitsLedgerEntry(entry) {
  const fields = {
    'Submitter Email': entry.email,
    'Hackatime Username': entry.hackatimeUsername,
    'Hackatime Project': entry.hackatimeProject,
    'Tracked Hours At Submission': entry.trackedHours,
    Status: 'Pending',
    'Submission Record ID': entry.submissionRecordId,
    'Submitted At': new Date().toISOString()
  };

  const data = await airtableRequest(`${encodeURIComponent(LEDGER_TABLE)}`, {
    method: 'POST',
    body: JSON.stringify({ fields })
  });

  return data.id;
}

// Looks up the most recent ledger entry for a participant so the site can
// show their real status/approved Bits instead of a local guess. Matches
// on Hackatime username since that's the one identity we can actually
// verify (email is self-reported on the submission form).
export async function getLatestLedgerEntry(hackatimeUsername) {
  if (!hackatimeUsername) return null;

  const filterFormula = `{Hackatime Username} = "${hackatimeUsername.replace(/"/g, '\\"')}"`;
  const params = new URLSearchParams({
    filterByFormula: filterFormula,
    'sort[0][field]': 'Submitted At',
    'sort[0][direction]': 'desc',
    maxRecords: '1'
  });

  const data = await airtableRequest(`${encodeURIComponent(LEDGER_TABLE)}?${params.toString()}`);
  const record = data.records?.[0];
  if (!record) return null;

  return {
    status: record.fields.Status ?? 'Pending',
    approvedBits: record.fields['Approved Bits'] ?? null,
    trackedHours: record.fields['Tracked Hours At Submission'] ?? 0,
    reviewerNotes: record.fields['Reviewer Notes'] ?? null
  };
}
