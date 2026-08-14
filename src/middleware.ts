import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './lib/server/session';
import { jsonResponse } from './lib/server/http';
import { isAuthorizedAdminEmail, normalizeAdminEmail } from './lib/server/admin-authorization';

const ADMIN_API_PATHS = new Set([
  '/admin/admin_certificates_api',
  '/admin/admin_designs_api',
  '/admin/admin_resume_upload',
  '/admin/admin_emails_api',
  '/admin/admin_tasks_api',
  '/admin/admin_todos_api',
  '/admin/admin_logs_api',
  '/admin/admin_projects_api',
  '/admin/admin_stats_api',
]);

const PUBLIC_PAGE_PATHS = new Set([
  '/',
  '/projects',
  '/designs',
  '/certifications',
  '/experience',
  '/resume',
  '/services',
  '/volunteering',
]);

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
  const lowerPath = pathname.toLowerCase();
  const normalizedPath = lowerPath === '/' ? '/' : lowerPath.replace(/\/+$/, '');
  const isAdminRoute = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/');
  const isLoginRoute = normalizedPath === '/admin/admin_login';
  const isAdminApi = ADMIN_API_PATHS.has(normalizedPath) || /^\/admin\/admin_[a-z0-9_]+_api$/.test(normalizedPath);
  const needsCurrentAdminAuthorization = isAdminRoute || normalizedPath === '/api/download_resume';
  // Every current server island is public portfolio data. The encrypted query
  // uniquely identifies its props, so it is safe to share briefly at the CDN.
  const cachePublicPage = context.request.method === 'GET' && (
    PUBLIC_PAGE_PATHS.has(normalizedPath) || normalizedPath.startsWith('/_server-islands/')
  );

  // Check for admin session cookie on all incoming requests
  const sessionCookie = context.cookies.get('admin_session')?.value;
  let verifiedEmail: string | null = null;

  if (sessionCookie) {
    const session = await verifySessionToken(sessionCookie);
    if (session) {
      const normalizedEmail = normalizeAdminEmail(session.email);
      if (!needsCurrentAdminAuthorization || await isAuthorizedAdminEmail(normalizedEmail)) {
        verifiedEmail = normalizedEmail;
      }
    }

    if (!verifiedEmail && needsCurrentAdminAuthorization && !isLoginRoute) {
      context.cookies.delete('admin_session', { path: '/' });
      context.cookies.delete('admin_remember', { path: '/' });
      try {
        const { addSystemLog } = await import('./lib/server/system-logs');
        await addSystemLog({
          type: 'security',
          severity: 'warn',
          action: 'AUTH_SESSION_INVALID',
          title: 'Invalid, expired, or revoked admin session presented',
          details: `Session verification or current authorization failed for route: ${pathname}`,
          userEmail: 'anonymous',
          requestPath: pathname,
        });
      } catch (err) {
        console.warn('Could not log invalid session in middleware:', err);
      }
    }
  }

  // Intercept all requests targeting `/admin` and `/admin/*` (except `/admin/admin_login`)
  if (isAdminRoute && !isLoginRoute) {
    if (!verifiedEmail) {
      if (import.meta.env.DEV) {
        // In local development mode without an explicit session cookie, default to primary ADMIN_EMAIL
        const { getEnv } = await import('./lib/server/env');
        verifiedEmail = getEnv('ADMIN_EMAIL') || 'mock@example.com';
      } else {
        const response = isAdminApi
          ? jsonResponse({ error: 'Unauthorized' }, 401)
          : context.redirect('/admin/admin_login');
        return addSecurityHeaders(response, true, pathname);
      }
    }
  }

  if (verifiedEmail) {
    context.locals.adminEmail = verifiedEmail;
  }

  // Continue to the next middleware or route handler
  const response = await next();
  return addSecurityHeaders(response, isAdminRoute, pathname, cachePublicPage);
});

/**
 * SECURITY: Injects critical security headers into every HTTP response.
 * These headers mitigate clickjacking, MIME-sniffing, and unauthorized feature access.
 */
function addSecurityHeaders(
  response: Response,
  preventCaching = false,
  pathname = '',
  cachePublicPage = false,
): Response {
  try {
    // Attempt to mutate headers directly. This works for standard dynamic responses.
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (preventCaching) {
      response.headers.set('Cache-Control', 'private, no-store');
    } else if (cachePublicPage) {
      response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    } else if (pathname.startsWith('/uploads/') || pathname.endsWith('.webp')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    return response;
  } catch {
    // Some platform responses expose immutable headers. Clone them rather than
    // silently returning a response without the intended security policy.
    const headers = new Headers(response.headers);
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (preventCaching) {
      headers.set('Cache-Control', 'private, no-store');
    } else if (cachePublicPage) {
      headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    } else if (pathname.startsWith('/uploads/') || pathname.endsWith('.webp')) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}
