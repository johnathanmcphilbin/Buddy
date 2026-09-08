// Thin wrapper around Resend's API. Uses the default onboarding sender
// until a verified domain is configured, per Resend's own docs.

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendReviewEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Buddy Submissions <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${body}`);
  }

  return response.json();
}
