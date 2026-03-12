/**
 * Optional Redis cache for API responses and hot data.
 * Set REDIS_URL to enable. Use for read-heavy endpoints (catalog, dashboard summary).
 * TTL in seconds; default 5 min for catalog, 1 min for user-specific data.
 */
const REDIS_URL = process.env.REDIS_URL?.trim();

let client = null;

async function getClient() {
  if (!REDIS_URL) return null;
  if (client) return client;
  try {
    const Redis = (await import('ioredis')).default;
    client = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 });
    client.on('error', (err) => console.warn('Redis cache error:', err?.message));
    return client;
  } catch (e) {
    console.warn('Redis cache init failed:', e?.message);
    return null;
  }
}

/**
 * Get cached string value. Returns null if key missing or Redis unavailable.
 * @param {string} key - Cache key (e.g. "catalog:courses")
 * @returns {Promise<string|null>}
 */
export async function cacheGet(key) {
  const c = await getClient();
  if (!c) return null;
  try {
    const val = await c.get(key);
    return val;
  } catch (_) {
    return null;
  }
}

/**
 * Set cached value with TTL.
 * @param {string} key
 * @param {string} value - Serialize objects with JSON.stringify
 * @param {number} ttlSeconds - Time to live (default 300)
 */
export async function cacheSet(key, value, ttlSeconds = 300) {
  const c = await getClient();
  if (!c) return;
  try {
    await c.setex(key, ttlSeconds, value);
  } catch (_) {}
}

/**
 * Delete a key (e.g. on catalog update).
 */
export async function cacheDel(key) {
  const c = await getClient();
  if (!c) return;
  try {
    await c.del(key);
  } catch (_) {}
}

/**
 * Get-or-set pattern: return cached value or compute, store, and return.
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {() => Promise<string>} fn - Async function that returns value to cache
 * @returns {Promise<string>}
 */
export async function cacheGetOrSet(key, ttlSeconds, fn) {
  const cached = await cacheGet(key);
  if (cached != null) return cached;
  const value = await fn();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

export function isCacheEnabled() {
  return !!REDIS_URL;
}
