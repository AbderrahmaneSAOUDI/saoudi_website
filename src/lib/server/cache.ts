/**
 * Server-side In-memory Cache
 * 
 * Simple cache with Time-To-Live (TTL) to store query results and configuration data.
 * Helps reduce Firestore reads and speeds up Astro SSR rendering.
 */

type CacheEntry<T> = {
  data: T;
  expiry: number;
};

const cacheStore = new Map<string, CacheEntry<any>>();

/**
 * Retrieves a value from the cache. Returns null if not found or expired.
 */
export function getCached<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiry) {
    cacheStore.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Sets a value in the cache with a specified TTL (default: 5 minutes / 300,000ms).
 */
export function setCached<T>(key: string, data: T, ttlMs: number = 300000): void {
  cacheStore.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

/**
 * Clears a specific cache key, or clears the entire cache if no key is provided.
 */
export function clearCache(key?: string): void {
  if (key) {
    cacheStore.delete(key);
  } else {
    cacheStore.clear();
  }
}
