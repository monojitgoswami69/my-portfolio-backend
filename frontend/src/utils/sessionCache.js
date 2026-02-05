/**
 * Session Storage Cache Utility
 * Provides caching layer for API responses using sessionStorage
 */

const CACHE_PREFIX = 'cache_';

/**
 * Get cached data from sessionStorage
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if not found/expired
 */
export function getCached(key) {
  try {
    const cached = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Set cached data in sessionStorage
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export function setCached(key, data) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

/**
 * Clear specific cached data
 * @param {string} key - Cache key to clear
 */
export function clearCached(key) {
  try {
    sessionStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear all cached data
 */
export function clearAllCached() {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

/**
 * Wrapper for API calls with caching
 * @param {string} cacheKey - Cache key
 * @param {Function} apiFn - Async function that makes the API call
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<any>} - API response
 */
export async function cachedApiCall(cacheKey, apiFn, forceRefresh = false) {
  // Try cache first if not forcing refresh
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }
  
  // Make API call
  const data = await apiFn();
  
  // Cache the result
  setCached(cacheKey, data);
  
  return data;
}
