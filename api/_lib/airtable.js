// Server-side Airtable access. Centralizes table/field names in one
// place so nothing else in the codebase has to know Airtable's raw
// record shape. AIRTABLE_TOKEN is never imported by client code.

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_CONTENT_BASE = 'https://content.airtable.com/v0';

const SUBMISSION_TABLE = 'YSWS Project Submission';
const LEDGER_TABLE = 'Buddy Bits Ledger';
const CLAIMS_TABLE = 'Buddy Shop Claims';

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

// Writes into Hack Club's shared YSWS submission schema, matching every
// field on the real form. The "Automation - Submit to Unified YSWS"
// checkbox is intentionally never set here (that's a real external
// pipeline trigger, not something to flip automatically on every submit).
export async function createYswsSubmission(submission) {
  const fields = {
    'Code URL': submission.codeUrl,
    'Playable URL': submission.playableUrl,
    'How did you hear about this?': submission.howHeard,
    'What are we doing well?': submission.doingWell,
    'How can we improve?': submission.howImprove,
    'First Name': submission.firstName,
    'Last Name': submission.lastName,
    Email: submission.email,
    Description: submission.description,
    'GitHub Username': submission.githubUsername,
    'Address (Line 1)': submission.addressLine1,
    'Address (Line 2)': submission.addressLine2,
    City: submission.city,
    'State / Province': submission.stateProvince,
    Country: submission.country,
    'ZIP / Postal Code': submission.zip,
    Birthday: submission.birthday,
    'Justification - Submitter Hackatime ID': submission.hackatimeUsername,
    'Justification - Hackatime Project Name(s) + Date Range(s)': submission.hackatimeProject
  };

  // Drop empty optional fields rather than sending blank strings.
  Object.keys(fields).forEach((key) => {
    if (fields[key] === undefined || fields[key] === '') delete fields[key];
  });

  const data = await airtableRequest(`${encodeURIComponent(SUBMISSION_TABLE)}`, {
    method: 'POST',
    body: JSON.stringify({ fields })
  });

  if (submission.screenshot?.base64) {
    // Best-effort: a failed screenshot upload should never block the
    // actual submission from going through.
    try {
      await uploadScreenshot(data.id, submission.screenshot);
    } catch (error) {
      console.error('Screenshot upload failed:', error.message);
    }
  }

  return data.id;
}

async function uploadScreenshot(recordId, screenshot) {
  const token = requireEnv('AIRTABLE_TOKEN');
  const baseId = requireEnv('AIRTABLE_BASE_ID');

  const response = await fetch(
    `${AIRTABLE_CONTENT_BASE}/${baseId}/${recordId}/${encodeURIComponent('Screenshot')}/uploadAttachment`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contentType: screenshot.contentType,
        file: screenshot.base64,
        filename: screenshot.filename
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Screenshot upload failed (${response.status}): ${body}`);
  }
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

export async function createShopClaim(claim) {
  const fields = {
    'Hackatime Username': claim.hackatimeUsername,
    'Submitter Email': claim.email,
    'Item Title': claim.itemTitle,
    'Item Name': claim.itemName,
    'Bits Spent': claim.price,
    'Claimed At': new Date().toISOString(),
    Fulfilled: false
  };

  const data = await airtableRequest(`${encodeURIComponent(CLAIMS_TABLE)}`, {
    method: 'POST',
    body: JSON.stringify({ fields })
  });

  return data.id;
}

// Sum of every claim a participant has made so far, so the real balance
// is (approved Bits) minus (everything they've spent) — never something
// the browser can adjust on its own.
export async function getTotalSpentBits(hackatimeUsername) {
  if (!hackatimeUsername) return 0;

  const filterFormula = `{Hackatime Username} = "${hackatimeUsername.replace(/"/g, '\\"')}"`;
  const params = new URLSearchParams({ filterByFormula: filterFormula });

  let total = 0;
  let offset;

  do {
    if (offset) params.set('offset', offset);
    const data = await airtableRequest(`${encodeURIComponent(CLAIMS_TABLE)}?${params.toString()}`);
    total += (data.records ?? []).reduce((sum, record) => sum + (record.fields['Bits Spent'] ?? 0), 0);
    offset = data.offset;
  } while (offset);

  return total;
}
