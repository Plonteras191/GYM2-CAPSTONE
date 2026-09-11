import { createContext, useContext, useRef } from 'react';

const DataCacheContext = createContext(null);

/**
 * Global cache for API data with sessionStorage persistence.
 *
 * Pattern: Stale-While-Revalidate + sessionStorage TTL
 *   - In-memory ref  → survives page navigation (no re-fetch on route change)
 *   - sessionStorage → survives page refresh (F5) within the same tab
 *   - TTL (5 min)    → stale entries re-fetch in background; expired ones show spinner
 *
 * sessionStorage clears automatically when the tab is closed, so admin
 * data never lingers between sessions.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_PREFIX = 'gym_cache_';

function readFromStorage(key) {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    // Expired? Treat as cache miss — caller will re-fetch with spinner
    if (Date.now() - timestamp > TTL_MS) {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeToStorage(key, data) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // sessionStorage quota exceeded or unavailable — silently skip
  }
}

function removeFromStorage(key) {
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + key);
  } catch { /* noop */ }
}

export function DataCacheProvider({ children }) {
  // In-memory ref for navigation caching (same session, no JSON parse overhead)
  const cacheRef = useRef({});

  const getCache = (key) => {
    // 1. Check in-memory first (fastest)
    if (cacheRef.current[key] !== undefined) return cacheRef.current[key];
    // 2. Fall back to sessionStorage (survives refresh)
    const stored = readFromStorage(key);
    if (stored !== null) {
      cacheRef.current[key] = stored; // hydrate memory cache
      return stored;
    }
    return null;
  };

  const setCache = (key, data) => {
    cacheRef.current[key] = data;
    writeToStorage(key, data);
  };

  const invalidateCache = (key) => {
    delete cacheRef.current[key];
    removeFromStorage(key);
  };

  const invalidateAll = () => {
    cacheRef.current = {};
    // Clear only our prefixed keys, not unrelated sessionStorage data
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => sessionStorage.removeItem(k));
  };

  return (
    <DataCacheContext.Provider value={{ getCache, setCache, invalidateCache, invalidateAll }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) {
    throw new Error('useDataCache must be used inside <DataCacheProvider>');
  }
  return ctx;
}

export default DataCacheContext;
