const getCache = new Map();
const pendingGets = new Map();

const ttlByPath = [
  [/\/api\/guilds\/[^/]+\/commands$/, 5 * 60_000],
  [/\/api\/guilds\/[^/]+\/config$/, 30_000],
  [/\/api\/guilds\/[^/]+\/music$/, 5_000],
  [/\/api\/guilds\/[^/]+\/overview$/, 20_000],
  [/\/api\/guilds$/, 60_000]
];

function getTtl(path) {
  return ttlByPath.find(([pattern]) => pattern.test(path))?.[1] ?? 15_000;
}

function invalidateRelated(path) {
  const guildMatch = path.match(/\/api\/guilds\/([^/]+)/);
  const keys = [...getCache.keys()];

  for (const key of keys) {
    if (key === path || (guildMatch && key.includes(`/api/guilds/${guildMatch[1]}/`))) {
      getCache.delete(key);
    }
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export async function apiGet(path, options = {}) {
  const useCache = options.cache !== false;
  const cached = getCache.get(path);

  if (useCache && cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  if (useCache && pendingGets.has(path)) {
    return pendingGets.get(path);
  }

  const request = requestJson(path)
    .then((data) => {
      if (useCache) {
        getCache.set(path, {
          data,
          expiresAt: Date.now() + getTtl(path)
        });
      }
      return data;
    })
    .finally(() => pendingGets.delete(path));

  if (useCache) pendingGets.set(path, request);
  return request;
}

export function apiPreload(path) {
  apiGet(path).catch(() => {});
}

export async function apiPatch(path, body) {
  const data = await requestJson(path, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  invalidateRelated(path);
  return data;
}
