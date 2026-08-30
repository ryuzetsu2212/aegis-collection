/**
 * Simple in-memory rate limiter for API routes.
 * Tracks request counts per key (IP/email) within a sliding window.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }
  return stores.get(name)!
}

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key)
      }
    }
  }
}, 60 * 1000) // cleanup every 60s

export interface RateLimitConfig {
  /** Unique name for this limiter (e.g. 'login', 'otp-send') */
  name: string
  /** Maximum number of requests allowed within the window */
  maxAttempts: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

/**
 * Check and increment rate limit for a given key.
 * @param config - Rate limit configuration
 * @param key - Unique key to rate limit (e.g. IP address, email)
 * @returns RateLimitResult indicating if the request is allowed
 */
export function checkRateLimit(config: RateLimitConfig, key: string): RateLimitResult {
  const store = getStore(config.name)
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // First request or window expired
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    })
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetInSeconds: config.windowSeconds,
    }
  }

  if (entry.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  }
}
