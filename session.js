import crypto from "node:crypto";
import { appendSetCookie, parseCookies, readSignedValue, serializeCookie, createSignedValue } from "./cookies.js";

const SESSION_COOKIE = "monarch.dashboard.sid";
const STATE_COOKIE = "monarch.dashboard.oauth";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OAUTH_TTL_MS = 10 * 60 * 1000;

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded) {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function readCookiePayload(req, name, secret) {
  const cookies = parseCookies(req.headers.cookie);
  const signed = readSignedValue(cookies[name], secret);
  if (!signed) return null;
  return decodePayload(signed);
}

export function getSession(req, secret) {
  const payload = readCookiePayload(req, SESSION_COOKIE, secret);
  if (!payload || payload.expiresAt <= Date.now()) {
    return null;
  }
  return payload.session;
}

export function createSession(res, session, { secret, secure }) {
  const encoded = encodePayload({
    session,
    expiresAt: Date.now() + SESSION_TTL_MS
  });

  appendSetCookie(res, serializeCookie(SESSION_COOKIE, createSignedValue(encoded, secret), {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure,
    maxAge: SESSION_TTL_MS / 1000
  }));
}

export function destroySession(req, res, { secret, secure }) {
  appendSetCookie(res, serializeCookie(SESSION_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure,
    maxAge: 0
  }));
}

export function createOauthState(res, callbackUrl, { secret, secure }) {
  const state = crypto.randomBytes(18).toString("base64url");
  const encoded = encodePayload({
    state,
    callbackUrl,
    expiresAt: Date.now() + OAUTH_TTL_MS
  });

  appendSetCookie(res, serializeCookie(STATE_COOKIE, createSignedValue(encoded, secret), {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure,
    maxAge: OAUTH_TTL_MS / 1000
  }));

  return state;
}

export function consumeOauthState(req, res, state, { secret, secure }) {
  const stored = readCookiePayload(req, STATE_COOKIE, secret);
  const callbackUrl =
    stored &&
    stored.expiresAt > Date.now() &&
    stored.state === state
      ? stored.callbackUrl
      : null;

  appendSetCookie(res, serializeCookie(STATE_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure,
    maxAge: 0
  }));

  return callbackUrl;
}
