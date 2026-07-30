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

export const CACHE_TTL_MS = {
  PUBLIC_DATA: 60_000,
  ADMIN_DATA: 30_000,
} as const;

type CacheEntry<T> = {
  data: T;
  expiry: number;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();
const inFlightLoads = new Map<string, Promise<unknown>>();
const cacheVersions = new Map<string, number>();

function getCacheVersion(key: string): number {
  return cacheVersions.get(key) ?? 0;
}

function invalidateKey(key: string): void {
  cacheStore.delete(key);
  inFlightLoads.delete(key);
  cacheVersions.set(key, getCacheVersion(key) + 1);
}

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
  
  // Refresh insertion order so capacity eviction behaves as a true LRU.
  cacheStore.delete(key);
  cacheStore.set(key, entry);
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

  cacheStore.delete(key);
  cacheStore.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

/**
 * Returns cached data or coalesces concurrent cache misses into one loader call.
 * An invalidation that happens while the loader is running prevents stale data
 * from being written back after an admin mutation.
 */
export async function getOrSetCached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = CACHE_TTL_MS.PUBLIC_DATA,
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  const pending = inFlightLoads.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const version = getCacheVersion(key);
  const loadPromise = loader()
    .then((data) => {
      if (getCacheVersion(key) === version) {
        setCached(key, data, ttlMs);
      }
      return data;
    })
    .finally(() => {
      if (inFlightLoads.get(key) === loadPromise) {
        inFlightLoads.delete(key);
      }
    });

  inFlightLoads.set(key, loadPromise);
  return loadPromise;
}

/**
 * Clears a specific cache key, or clears the entire cache if no key is provided.
 */
export function clearCache(key?: string): void {
  if (key) {
    invalidateKey(key);
  } else {
    const keys = new Set([...cacheStore.keys(), ...inFlightLoads.keys()]);
    for (const cacheKey of keys) invalidateKey(cacheKey);
  }
}

/**
 * Clears all cache entries whose key starts with the given prefix.
 * Useful for invalidating a family of related keys (e.g., 'designs_' clears
 * 'designs_list', 'designs_companies', etc.) after admin CRUD operations.
 */
export function clearCacheByPrefix(prefix: string): void {
  const keys = new Set([...cacheStore.keys(), ...inFlightLoads.keys()]);
  for (const key of keys) {
    if (key.startsWith(prefix)) {
      invalidateKey(key);
    }
  }
}
