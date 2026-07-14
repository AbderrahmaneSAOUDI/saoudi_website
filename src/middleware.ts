import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './lib/server/session';

/**
 * Astro Middleware
 * Intercepts incoming requests to:
 * 1. Inject security headers on all responses.
 * 2. Protect admin routes via session verification.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // SECURITY: Normalize pathname to lowercase for case-insensitive route matching.
  // Prevents bypass via /Admin/ or /ADMIN/ on case-insensitive file systems.
  const normalizedPath = pathname.toLowerCase();

  // Intercept all requests targeting `/admin` and `/admin/*` (except `/admin/admin_login`)
  if ((normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')) && normalizedPath !== '/admin/admin_login') {
    
    // In development mode, mock the admin session to bypass authentication
    if (import.meta.env.DEV) {
      context.locals.adminEmail = 'mock@example.com';
      return addSecurityHeaders(await next());
    }
    
    // Extract the session cookie for production authentication
    const sessionCookie = context.cookies.get('admin_session')?.value;

    if (!sessionCookie) {
      // Redirect to login if no session cookie is found
      return context.redirect('/admin/admin_login');
    }

    // Verify the JWT-like session token
    const session = await verifySessionToken(sessionCookie);
    if (!session) {
      // Clear invalid cookie and redirect to login to ensure clean state
      context.cookies.delete('admin_session', { path: '/' });
      return context.redirect('/admin/admin_login');
    }

    // Set the user email in locals so protected pages/endpoints can access it
    context.locals.adminEmail = session.email;
  }

  // Continue to the next middleware or route handler
  const response = await next();
  return addSecurityHeaders(response);
});

/**
 * SECURITY: Injects critical security headers into every HTTP response.
 * These headers mitigate clickjacking, MIME-sniffing, and unauthorized feature access.
 */
function addSecurityHeaders(response: Response): Response {
  // Prevent embedding in iframes (clickjacking protection)
  response.headers.set('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Control referrer information leaked to external sites
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict browser feature access
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}
