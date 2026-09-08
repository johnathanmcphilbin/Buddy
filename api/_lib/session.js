// Signed, HttpOnly cookie session. There's no persistent server/database
// here (Vercel functions are stateless between invocations), so the
// Hackatime access token and selected project live in the cookie itself,
// signed with SESSION_SECRET so the browser can't forge or tamper with
// it. The cookie is HttpOnly + Secure (in production) + SameSite=Lax, so
// page JavaScript never sees the access token — only server routes do.
//
// Hackatime access tokens are long-lived (per Hack Club's own
// integration notes, ~16 years), so there is no refresh-token flow here.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { parseCookies, serializeCookie, appendSetCookie } from './cookies.js';

const SESSION_COOKIE = 'buddy_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured');
  }
  return secret;
}

function sign(payload) {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function encode(data) {
  const payload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function decode(token) {
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export function getSession(req) {
  const cookies = parseCookies(req);
  return decode(cookies[SESSION_COOKIE]) ?? {};
}

export function setSession(res, data) {
  const cookie = serializeCookie(SESSION_COOKIE, encode(data), { maxAge: MAX_AGE_SECONDS });
  appendSetCookie(res, cookie);
}

export function clearSession(res) {
  const cookie = serializeCookie(SESSION_COOKIE, '', { maxAge: 0 });
  appendSetCookie(res, cookie);
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
