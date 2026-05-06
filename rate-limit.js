const store = new Map();

export function assertRateLimit(key, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    const error = new Error("Rate limit exceeded");
    error.statusCode = 429;
    throw error;
  }

  current.count += 1;
  store.set(key, current);
}
