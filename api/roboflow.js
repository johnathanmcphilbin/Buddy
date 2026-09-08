// Vercel serverless function that proxies requests to the Roboflow
// workflow endpoint. Roboflow's endpoint doesn't send an
// Access-Control-Allow-Origin header on its CORS preflight response, so
// browsers block calling it directly from client-side code. Routing
// through this same-origin function avoids the preflight entirely.
//
// Locally, the equivalent proxy is configured in vite.config.js.

const ROBOFLOW_WORKFLOW_URL = 'https://serverless.roboflow.com/johnathan-mcphilbin/workflows/buddy-everyday-objects';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const upstreamResponse = await fetch(ROBOFLOW_WORKFLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await upstreamResponse.json();
    res.status(upstreamResponse.status).json(data);
  } catch (error) {
    res.status(502).json({ error: 'Roboflow request failed' });
  }
}
