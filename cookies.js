import crypto from "node:crypto";

export function parseCookies(header = "") {
  return header.split(";").reduce((cookies, chunk) => {
    const index = chunk.indexOf("=");
    if (index === -1) return cookies;
    const key = chunk.slice(0, index).trim();
    const value = chunk.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

export function appendSetCookie(res, value) {
  const current = res.getHeader("Set-Cookie");
  if (!current) {
    res.setHeader("Set-Cookie", value);
    return;
  }

  if (Array.isArray(current)) {
    res.setHeader("Set-Cookie", [...current, value]);
    return;
  }

  res.setHeader("Set-Cookie", [current, value]);
}

export function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function createSignedValue(value, secret) {
  const signature = crypto.createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}.${signature}`;
}

export function readSignedValue(input, secret) {
  if (!input) return null;
  const index = input.lastIndexOf(".");
  if (index === -1) return null;
  const value = input.slice(0, index);
  const signature = input.slice(index + 1);
  const expected = crypto.createHmac("sha256", secret).update(value).digest("base64url");

  try {
    const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    return valid ? value : null;
  } catch {
    return null;
  }
}
