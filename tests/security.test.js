import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setSession, getSession } from '../api/_lib/session.js';
import claim from '../api/shop/claim.js';
import status from '../api/bits/status.js';
import roboflow from '../api/roboflow.js';
import submit from '../api/submit.js';
import setEmail from '../api/hackatime/set-email.js';
import { availableBits } from '../api/_lib/balance.js';
import { getAllLedgerEntries } from '../api/_lib/airtable.js';
import { verifyOrBindEmail } from '../api/_lib/identity.js';
import { escapeHtml } from '../api/_lib/html.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
function response() {
  return { headers: {}, code: 200, body: null,
    setHeader(k, v) { this.headers[k] = v; }, getHeader(k) { return this.headers[k]; },
    status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }
  };
}
function request(body = {}, email = 'attacker@example.com', token = 'test-oauth') {
  const res = response();
  setSession(res, { hackatimeAccessToken: token, hackatimeEmail: email, hackatimeProject: 'Buddy' });
  return { method: 'POST', body, headers: { cookie: res.headers['Set-Cookie'].split(';')[0] } };
}
const json = (body, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body });
let spent, claims, lockOwner, identityBindings, queriedFilters, options;
beforeEach(() => {
  Object.assign(process.env, { SESSION_SECRET: 'security-test-only-secret-32-characters-long', RESEND_API_KEY: 'test-resend', AIRTABLE_TOKEN: 'test-airtable', AIRTABLE_BASE_ID: 'test-base',
    UPSTASH_REDIS_REST_URL: 'https://redis.example.test', UPSTASH_REDIS_REST_TOKEN: 'test-redis', ROBOFLOW_API_KEY: 'test-private-key' });
  spent = 0; claims = []; lockOwner = null; identityBindings = {}; queriedFilters = []; options = {};
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    if (target.includes('redis.example.test')) {
      const command = JSON.parse(init.body);
      if (command[0] === 'SET') {
        // Claim lock acquire: ['SET', key, owner, 'NX']
        assert.equal(command.length, 4, 'lock must not auto-expire');
        if (lockOwner) return json({ result: null });
        lockOwner = command[2]; return json({ result: 'OK' });
      }
      // Everything else is EVAL: ['EVAL', script, numkeys, key, ...args]
      const key = command[3];
      if (typeof key === 'string' && key.startsWith('buddy:identity:email:')) {
        const requested = command[4];
        if (identityBindings[key] === undefined) identityBindings[key] = requested;
        return json({ result: identityBindings[key] });
      }
      if (command[1].includes('INCR')) return json({ result: options.demoCount ?? 1 });
      // Claim lock release: ['EVAL', script, '1', key, owner]
      if (lockOwner === command[4]) lockOwner = null;
      return json({ result: 1 });
    }
    if (target.endsWith('/authenticated/me')) return json({ id: options.accountId ?? 123, username: 'attacker', trust_factor: { trust_level: options.banned ? 'red' : 'green' } });
    if (target.endsWith('/authenticated/projects')) return json({ projects: [{ name: 'Buddy', total_seconds: options.projectSeconds ?? 36000 }] });
    if (target.includes('api.airtable.com')) {
      const parsed = new URL(target);
      if (init.method === 'POST') {
        const fields = JSON.parse(init.body).fields;
        if (parsed.pathname.includes('Shop%20Claims')) {
          if (options.writeFails) throw new Error('uncertain write');
          claims.push(fields); spent += fields['Bits Spent'];
        }
        return json({ id: 'rec-test' });
      }
      queriedFilters.push(parsed.searchParams.get('filterByFormula'));
      if (parsed.pathname.includes('Ledger')) return json({ records: [{ fields: { Status: 'Approved', 'Approved Bits': options.approved ?? 8 } }] });
      return json({ records: [{ fields: { 'Bits Spent': spent } }] });
    }
    if (target.includes('api.resend.com')) {
      if (options.emailFails) throw new Error('email unavailable');
      return json({ id: 'email-test' });
    }
    if (target.includes('serverless.roboflow.com')) {
      options.upstream = JSON.parse(init.body);
      return json({ api_key: 'must-not-return', predictions: [{ class: 'MOUSE', confidence: 0.9, x: 1, y: 2, width: 3, height: 4 }] });
    }
    throw new Error(`Unexpected endpoint: ${target}`);
  };
});
afterEach(() => { globalThis.fetch = originalFetch; process.env = { ...originalEnv }; });

test('session encrypted, tampering and legacy cookies rejected', () => {
  const req = request();
  assert.equal(getSession(req).hackatimeAccessToken, 'test-oauth');
  assert.ok(!req.headers.cookie.includes(Buffer.from('test-oauth').toString('base64')));
  assert.deepEqual(getSession({ headers: { cookie: req.headers.cookie + '.extra' } }), {});
  assert.deepEqual(getSession({ headers: { cookie: 'buddy_session=legacy.payload' } }), {});
  assert.deepEqual(getSession({ headers: { cookie: 'buddy_session=%XX' } }), {});
});
test('session expiry enforced on server', () => {
  const req = request(); const realNow = Date.now;
  try { Date.now = () => realNow() + 8 * 86400000; assert.deepEqual(getSession(req), {}); } finally { Date.now = realNow; }
});
test('default placeholder secret rejected', () => {
  process.env.SESSION_SECRET = 'change_me_to_a_long_random_string';
  assert.throws(() => request());
});

// --- Email/account identity binding (api/_lib/identity.js) ---
test('first account to use an email owns it; a different account is rejected', async () => {
  assert.equal(await verifyOrBindEmail('123', 'shared@example.com'), true);
  assert.equal(await verifyOrBindEmail('123', 'shared@example.com'), true, 'same account can keep using its own email');
  assert.equal(await verifyOrBindEmail('456', 'shared@example.com'), false, 'a different account cannot claim an already-bound email');
});
test('set-email rejects an email already bound to a different Hackatime account', async () => {
  const first = response(); await setEmail(request({ email: 'victim@example.com' }, 'irrelevant'), first);
  assert.equal(first.code, 200); assert.equal(first.body.email, 'victim@example.com');

  options.accountId = 456;
  const second = response(); await setEmail(request({ email: 'victim@example.com' }, 'irrelevant'), second);
  assert.equal(second.code, 409);
});
test('submit rejects reusing an email already bound to a different account', async () => {
  const body = Object.fromEntries(['codeUrl', 'playableUrl', 'firstName', 'lastName', 'email', 'description', 'githubUsername', 'addressLine1', 'city', 'stateProvince', 'country', 'zip', 'birthday'].map((k) => [k, 'test']));
  body.codeUrl = 'https://example.com'; body.playableUrl = 'https://example.com'; body.email = 'victim@example.com';

  const first = response(); await submit(request(body, 'irrelevant'), first);
  assert.equal(first.code, 200);

  options.accountId = 456;
  const second = response(); await submit(request(body, 'irrelevant'), second);
  assert.equal(second.code, 409);
});

// --- Bits ledger/claims (email-based lookup) ---
test('claim spends against the session email, scoped by a lowercase-exact Airtable filter', async () => {
  const res = response(); await claim(request({ itemId: 'better-eyes' }, 'Victim@Example.com'), res);
  assert.equal(res.body.claimed, true); assert.equal(res.body.balance, 0);
  assert.equal(claims[0]['Bits Spent'], 8); assert.equal(claims[0]['Submitter Email'], 'Victim@Example.com');
  assert.ok(queriedFilters.every((f) => f === 'LOWER({Submitter Email}) = "victim@example.com"'));
});
test('balance status looks up by session email', async () => {
  const req = request({}, 'victim@example.com'); req.method = 'GET'; const res = response();
  await status(req, res); assert.equal(res.body.balance, 8);
  assert.ok(queriedFilters.every((f) => f === 'LOWER({Submitter Email}) = "victim@example.com"'));
});
test('balance status with no email on record reports not submitted, without querying Airtable', async () => {
  const req = request({}, ''); req.method = 'GET'; const res = response();
  await status(req, res);
  assert.equal(res.body.status, 'Not submitted'); assert.equal(res.body.balance, 0);
  assert.equal(queriedFilters.length, 0);
});
test('concurrent claims cannot both spend same balance', async () => {
  const results = Array.from({ length: 12 }, response);
  await Promise.all(results.map((res) => claim(request({ itemId: 'better-eyes' }), res)));
  assert.equal(claims.length, 1); assert.equal(spent, 8);
  assert.equal(results.filter((res) => res.body.claimed).length, 1);
  assert.equal(lockOwner, null);
});
test('sequential repeat rejected once balance is spent', async () => {
  await claim(request({ itemId: 'better-eyes' }), response());
  const res = response(); await claim(request({ itemId: 'better-eyes' }), res);
  assert.equal(res.body.claimed, false); assert.equal(claims.length, 1);
});
test('ambiguous write keeps durable lock; retries cannot debit', async () => {
  options.writeFails = true; const res = response(); await claim(request({ itemId: 'better-eyes' }), res);
  assert.equal(res.code, 503); assert.ok(lockOwner);
  const retry = response(); await claim(request({ itemId: 'better-eyes' }), retry); assert.equal(retry.code, 409);
});
test('missing storage blocks spending', async () => {
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = response(); await claim(request({ itemId: 'better-eyes' }), res);
  assert.equal(res.code, 503); assert.equal(claims.length, 0);
});
test('notification failure does not report successful debit as failed', async () => {
  options.emailFails = true; const res = response(); await claim(request({ itemId: 'better-eyes' }), res);
  assert.equal(res.body.claimed, true); assert.equal(lockOwner, null);
});
test('banned account rejected by server', async () => {
  options.banned = true; const res = response(); await claim(request({ itemId: 'better-eyes' }), res);
  assert.equal(res.code, 403); assert.equal(claims.length, 0);
});
test('anonymous and invalid items cannot claim', async () => {
  const res = response(); await claim({ method: 'POST', headers: {}, body: { itemId: 'better-eyes' } }, res); assert.equal(res.code, 401);
  const invalid = response(); await claim(request({ itemId: '__proto__' }), invalid); assert.equal(invalid.code, 400);
});
test('invalid ledger numbers fail closed', () => {
  for (const value of [NaN, Infinity, -1, '100', 1.5]) assert.throws(() => availableBits([{ status: 'Approved', approvedBits: value }], 0));
  assert.throws(() => availableBits([{ status: 'Approved', approvedBits: 10 }], NaN));
  assert.equal(availableBits([{ status: 'Pending', approvedBits: 100 }], 0), 0);
});
test('email formula injection is escaped, not rejected outright', async () => {
  await assert.rejects(getAllLedgerEntries(''), 'blank identity must fail closed');
  await getAllLedgerEntries('a" OR TRUE()');
  assert.equal(queriedFilters.at(-1), 'LOWER({Submitter Email}) = "a\\" or true()"');
});
test('server injects private key; drops client key and upstream secrets', async () => {
  const res = response(); await roboflow({ method: 'POST', body: { api_key: 'attacker-key', inputs: { image: { type: 'base64', value: 'YWJj' } } } }, res);
  assert.equal(res.code, 200); assert.equal(options.upstream.api_key, 'test-private-key');
  assert.ok(!JSON.stringify(res.body).includes('must-not-return')); assert.equal(res.body.predictions[0].class, 'MOUSE');
});
test('inference budget caps upstream paid calls', async () => {
  options.demoCount = 10001; const res = response(); await roboflow({ method: 'POST', body: { inputs: { image: { type: 'base64', value: 'YWJj' } } } }, res);
  assert.equal(res.code, 429); assert.equal(options.upstream, undefined);
});
test('image URLs and oversized images rejected', async () => {
  for (const image of [{ type: 'url', value: 'https://example.com' }, { type: 'base64', value: 'a'.repeat(2000001) }]) {
    const res = response(); await roboflow({ method: 'POST', body: { inputs: { image } } }, res); assert.equal(res.code, 400);
  }
});
test('HTML escaping blocks email markup injection', () => {
  assert.equal(escapeHtml('<img src="x">&'), '&lt;img src=&quot;x&quot;&gt;&amp;');
});
test('submission rejects script URLs', async () => {
  const body = Object.fromEntries(['codeUrl', 'playableUrl', 'firstName', 'lastName', 'email', 'description', 'githubUsername', 'addressLine1', 'city', 'stateProvince', 'country', 'zip', 'birthday'].map((k) => [k, 'test']));
  body.codeUrl = 'javascript:alert(1)'; body.playableUrl = 'https://example.com';
  const res = response(); await submit(request(body), res); assert.equal(res.code, 400);
});
test('submission below the minimum project hours is rejected', async () => {
  options.projectSeconds = 3600; // 1 hour, under the 2-hour minimum
  const body = Object.fromEntries(['codeUrl', 'playableUrl', 'firstName', 'lastName', 'email', 'description', 'githubUsername', 'addressLine1', 'city', 'stateProvince', 'country', 'zip', 'birthday'].map((k) => [k, 'test']));
  body.codeUrl = 'https://example.com'; body.playableUrl = 'https://example.com';
  const res = response(); await submit(request(body), res);
  assert.equal(res.code, 400);
});
