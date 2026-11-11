import type { RequestHandler } from 'express';

export function securityHeaders(options: { production: boolean }): RequestHandler {
  return (request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (options.production && request.secure) {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  };
}
