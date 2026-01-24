import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Process the request
  const response = await next();

  // Clone response to modify headers
  const newResponse = new Response(response.body, response);

  // Security Headers
  const securityHeaders = {
    // Content Security Policy - restrict sources to prevent XSS
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' seo.werqr.com",  // Allow Plausible analytics
      "style-src 'self' 'unsafe-inline'",  // Inline styles used in React components
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Enable browser XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Permissions Policy - disable unnecessary features
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',  // Disable FLoC
      'payment=()',
      'usb=()',
    ].join(', '),

    // Strict Transport Security (HTTPS only) - Cloudflare will handle this
    // Uncomment when using HTTPS in production
    // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  // CORS headers - restrict to same origin by default
  // Only allow from your own domain in production
  const origin = context.request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:8080',
    'https://drift0.werqr.com',  // Update with your production domain
  ];

  if (origin && allowedOrigins.includes(origin)) {
    newResponse.headers.set('Access-Control-Allow-Origin', origin);
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    newResponse.headers.set('Access-Control-Max-Age', '86400');
  }

  // Handle OPTIONS preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: newResponse.headers,
    });
  }

  return newResponse;
});
