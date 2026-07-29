/**
 * Server-side In-memory Cache
 * 
 * Simple cache with Time-To-Live (TTL) to store query results and configuration data.
 * Helps reduce Firestore reads and speeds up Astro SSR rendering.
 *
 * Constraints:
 *  - MAX_ENTRIES: evicts the oldest entry when the store is full (LRU-like cap).
 *  - Expired entries are pruned lazily on every write to avoid unbounded growth.
 */

const MAX_ENTRIES = 64;

type CacheEntry<T> = {
  data: T;
  expiry: number;
};

const cacheStore = new Map<string, CacheEntry<any>>();

/**
 * Removes all entries whose TTL has already elapsed.
 * Called automatically on every write so the Map never grows unbounded.
 */
function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cacheStore) {
    if (now > entry.expiry) {
      cacheStore.delete(key);
    }
  }
}

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
  
  return entry.data as T;
}

/**
 * Sets a value in the cache with a specified TTL (default: 5 minutes / 300,000ms).
 */
export function setCached<T>(key: string, data: T, ttlMs: number = 300000): void {
  // Prune stale entries before inserting to keep the store lean.
  pruneExpired();

  // If still at capacity after pruning, evict the oldest insertion.
  if (cacheStore.size >= MAX_ENTRIES && !cacheStore.has(key)) {
    const firstKey = cacheStore.keys().next().value;
    if (firstKey !== undefined) {
      cacheStore.delete(firstKey);
    }
  }

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

/**
 * Clears all cache entries whose key starts with the given prefix.
 * Useful for invalidating a family of related keys (e.g., 'designs_' clears
 * 'designs_list', 'designs_companies', etc.) after admin CRUD operations.
 */
export function clearCacheByPrefix(prefix: string): void {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}
