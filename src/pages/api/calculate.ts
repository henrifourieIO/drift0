import type { APIRoute } from 'astro';
import { calculateBallistics, type BallisticsInput } from '../../lib/ballistics';
import { checkRateLimit, getClientIP } from '../../lib/rateLimit';

// Validation limits to prevent abuse
const LIMITS = {
  muzzleVelocity: { min: 50, max: 2000 },    // m/s (reasonable ballistic range)
  bulletWeight: { min: 0.1, max: 200 },      // grams
  ballisticCoefficient: { min: 0.001, max: 2 },
  zeroRange: { min: 1, max: 2000 },           // meters
  targetDistance: { min: 1, max: 5000 },      // meters
  windSpeed: { min: 0, max: 100 },            // m/s
  windAngle: { min: 0, max: 360 },            // degrees
  sightHeight: { min: 0, max: 500 },          // mm
  temperature: { min: -50, max: 60 },         // celsius
  altitude: { min: -500, max: 10000 },        // meters
};

function validateInput(input: any): { valid: boolean; error?: string } {
  // Check if input is an object
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid input format' };
  }

  // Check for required fields
  const requiredFields: (keyof BallisticsInput)[] = [
    'muzzleVelocity', 'bulletWeight', 'ballisticCoefficient',
    'zeroRange', 'targetDistance', 'windSpeed', 'windAngle',
    'sightHeight', 'temperature', 'altitude'
  ];

  for (const field of requiredFields) {
    if (!(field in input)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }

    const value = input[field];
    
    // Check if value is a number
    if (typeof value !== 'number' || !isFinite(value)) {
      return { valid: false, error: `Invalid value for ${field}: must be a finite number` };
    }

    // Check range limits
    const limit = LIMITS[field];
    if (value < limit.min || value > limit.max) {
      return { 
        valid: false, 
        error: `Value for ${field} out of range (${limit.min}-${limit.max})` 
      };
    }
  }

  return { valid: true };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limiting - 30 requests per minute per IP
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, { maxRequests: 30, windowMs: 60000 });
    
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please try again later.' 
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      });
    }
    
    // Check content length to prevent large payloads
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) {
      return new Response(JSON.stringify({ error: 'Request payload too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawInput = await request.json();
    
    // Validate input
    const validation = validateInput(rawInput);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const input: BallisticsInput = rawInput;
    const results = calculateBallistics(input);
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetTime),
      },
    });
  } catch (error) {
    // Log the actual error for debugging (in production, use proper logging)
    console.error('Calculation error:', error);
    
    // Return sanitized error message to client
    return new Response(JSON.stringify({ 
      error: 'An error occurred while processing your request' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    });
  }
};
