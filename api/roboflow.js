import { redis } from './_lib/redis.js';
const ROBOFLOW_WORKFLOW_URL = 'https://serverless.roboflow.com/johnathan-mcphilbin/workflows/buddy-everyday-objects';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.ROBOFLOW_API?.trim();
  if (!apiKey) return res.status(503).json({ error: 'Demo is temporarily unavailable.' });
  const image = req.body?.inputs?.image;
  if (image?.type !== 'base64' || typeof image.value !== 'string' || image.value.length > 2000000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.value)) {
    return res.status(400).json({ error: 'A base64 image is required.' });
  }
  // Best-effort daily cap: if Redis isn't reachable, don't block the whole
  // demo over a quota check that has nothing to do with whether inference
  // itself works.
  try {
    const limit = Number(process.env.ROBOFLOW_DAILY_LIMIT || 10000);
    if (Number.isSafeInteger(limit) && limit > 0) {
      const count = await redis(['EVAL', "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 172800) end; return n", '1', `buddy:inference:${new Date().toISOString().slice(0, 10)}`]);
      if (Number.isSafeInteger(count) && count > limit) {
        return res.status(429).json({ error: 'Demo daily limit reached. Please try again tomorrow.' });
      }
    }
  } catch (error) {
    console.error('Roboflow daily quota check unavailable, allowing request:', error.message);
  }

  try {
    const upstreamResponse = await fetch(ROBOFLOW_WORKFLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, inputs: { image: { type: 'base64', value: image.value } } }),
      signal: AbortSignal.timeout(15000)
    });
    if (!upstreamResponse.ok) {
      const body = await upstreamResponse.text();
      throw new Error(`Roboflow request failed (${upstreamResponse.status}): ${body}`);
    }
    const data = await upstreamResponse.json();
    // Only return detection fields needed by the browser, never upstream config.
    const detections = [];
    function collect(node, depth = 0) {
      if (!node || typeof node !== 'object' || depth > 12) return;
      if (Array.isArray(node)) return node.forEach((entry) => collect(entry, depth + 1));
      if (typeof node.confidence === 'number' && typeof (node.class ?? node.class_name ?? node.label) === 'string') {
        detections.push({ class: node.class ?? node.class_name ?? node.label, confidence: node.confidence,
          x: node.x, y: node.y, width: node.width, height: node.height });
      } else Object.values(node).forEach((entry) => collect(entry, depth + 1));
    }
    collect(data);
    return res.status(200).json({ predictions: detections });
  } catch (error) {
    console.error('Roboflow inference failed:', error.message);
    return res.status(502).json({ error: 'Roboflow request failed' });
  }
}
