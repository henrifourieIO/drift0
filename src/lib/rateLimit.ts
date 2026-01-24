/**
 * Simple in-memory rate limiter for API endpoints
 * For production with multiple instances, consider using:
 * - Cloudflare Workers KV for distributed rate limiting
 * - Cloudflare Rate Limiting rules
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;  // Maximum requests allowed
  windowMs: number;     // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request from the given IP is rate limited
 * @param ip - IP address of the requester
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 } // 60 requests per minute by default
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${ip}`;
  
  let entry = rateLimitStore.get(key);
  
  // If no entry exists or the window has expired, create a new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Increment the request count
  entry.count++;
  
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP address from request
 * Handles Cloudflare and other proxy headers
 */
export function getClientIP(request: Request): string {
  // Check Cloudflare header first
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Check X-Forwarded-For
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Take the first IP in the list (client IP)
    return xForwardedFor.split(',')[0].trim();
  }
  
  // Check X-Real-IP
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }
  
  // Fallback to unknown (shouldn't happen in Cloudflare Workers)
  return 'unknown';
}
