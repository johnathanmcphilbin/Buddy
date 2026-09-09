// Authenticated encryption keeps access tokens confidential and rejects tampered,
// expired, and legacy sessions. Deployment requires participants to reconnect.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { parseCookies, serializeCookie, appendSetCookie } from './cookies.js';

const SESSION_COOKIE = 'buddy_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getKey() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32 || secret.startsWith('change_me')) throw new Error('A strong SESSION_SECRET is required');
  return createHash('sha256').update(secret).digest();
}

export function getSession(req) {
  try {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (!token) return {};
    const [version, iv, tag, payload, extra] = token.split('.');
    if (version !== 'v2' || !iv || !tag || !payload || extra !== undefined) return {};
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    const data = JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload, 'base64url')), decipher.final()]).toString('utf8'));
    if (!Number.isFinite(data.expiresAt) || data.expiresAt <= Date.now()) return {};
    return data;
  } catch { return {}; }
}

export function setSession(res, data) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const payload = Buffer.concat([cipher.update(JSON.stringify({ ...data, expiresAt: Date.now() + MAX_AGE_SECONDS * 1000 }), 'utf8'), cipher.final()]);
  const token = ['v2', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), payload.toString('base64url')].join('.');
  appendSetCookie(res, serializeCookie(SESSION_COOKIE, token, { maxAge: MAX_AGE_SECONDS }));
}

export function clearSession(res) {
  appendSetCookie(res, serializeCookie(SESSION_COOKIE, '', { maxAge: 0 }));
}

// Short-lived cookie used only to validate the OAuth `state` param
// against CSRF between the login redirect and the callback.
const STATE_COOKIE = 'buddy_oauth_state';

export function setOAuthState(res, state) {
  const cookie = serializeCookie(STATE_COOKIE, state, { maxAge: 600 });
  appendSetCookie(res, cookie);
}

export function readOAuthState(req) {
  return parseCookies(req)[STATE_COOKIE] ?? null;
}

export function clearOAuthState(res) {
  const cookie = serializeCookie(STATE_COOKIE, '', { maxAge: 0 });
  appendSetCookie(res, cookie);
}
