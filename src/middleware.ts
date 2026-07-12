import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './lib/server/session';

/**
 * Astro Middleware
 * Intercepts incoming requests to protect admin routes and inject local variables.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Intercept all requests targeting `/admin` and `/admin/*` (except `/admin/admin_login`)
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && pathname !== '/admin/admin_login') {
    
    // In development mode, mock the admin session to bypass authentication
    if (import.meta.env.DEV) {
      context.locals.adminEmail = 'mock@example.com';
      return next();
    }
    
    // Extract the session cookie for production authentication
    const sessionCookie = context.cookies.get('admin_session')?.value;

    if (!sessionCookie) {
      // Redirect to login if no session cookie is found
      return context.redirect('/admin/admin_login');
    }

    // Verify the JWT-like session token
    const session = verifySessionToken(sessionCookie);
    if (!session) {
      // Clear invalid cookie and redirect to login to ensure clean state
      context.cookies.delete('admin_session', { path: '/' });
      return context.redirect('/admin/admin_login');
    }

    // Set the user email in locals so protected pages/endpoints can access it
    context.locals.adminEmail = session.email;
  }

  // Continue to the next middleware or route handler
  return next();
});
