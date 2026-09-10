export async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token || !url.startsWith('https://')) throw new Error('Redis storage unavailable');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Redis storage unavailable');
  const data = await response.json();
  if (data.error) throw new Error('Redis storage unavailable');
  return data.result;
}
