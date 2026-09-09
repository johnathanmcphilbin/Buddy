import { createHash, randomUUID } from 'node:crypto';

export async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token || !url.startsWith('https://')) throw new Error('Claim storage unavailable');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Claim storage unavailable');
  const data = await response.json();
  if (data.error) throw new Error('Claim storage unavailable');
  return data.result;
}

// A durable lock, deliberately without expiry. If a worker dies during an
// ambiguous Airtable write, auto-expiry could permit another debit before that
// write settles. Keep the account blocked until an operator reconciles it.
export async function acquireClaimLock(accountId) {
  const key = `buddy:claim:${createHash('sha256').update(accountId).digest('hex')}`;
  const owner = randomUUID();
  const result = await redis(['SET', key, owner, 'NX']);
  if (result !== 'OK') return null;
  return async () => {
    await redis(['EVAL', "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end", '1', key, owner]);
  };
}
