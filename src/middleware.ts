import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './lib/server/session';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Intercept all requests targeting `/admin` and `/admin/*` (except `/admin/admin_login`)
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && pathname !== '/admin/admin_login') {
    const sessionCookie = context.cookies.get('admin_session')?.value;

    if (!sessionCookie) {
      return context.redirect('/admin/admin_login');
    }

    const session = verifySessionToken(sessionCookie);
    if (!session) {
      // Clear invalid cookie and redirect to login
      context.cookies.delete('admin_session', { path: '/' });
      return context.redirect('/admin/admin_login');
    }

    // Set the user email in locals so pages/endpoints can access it
    context.locals.adminEmail = session.email;
  }

  return next();
});
