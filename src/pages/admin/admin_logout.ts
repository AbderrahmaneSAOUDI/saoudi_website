import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const adminEmail = context.locals.adminEmail || 'admin';
  try {
    const { addSystemLog } = await import('../../lib/server/system-logs');
    await addSystemLog({
      type: 'auth',
      severity: 'info',
      action: 'AUTH_LOGOUT',
      title: `Admin session signed out: ${adminEmail}`,
      details: `Admin session ended for ${adminEmail}`,
      userEmail: adminEmail,
      requestPath: '/admin/admin_logout',
    });
  } catch (err) {
    console.warn('Could not record logout log:', err);
  }

  // Clear the admin_session and admin_remember cookies from the root path
  context.cookies.delete('admin_session', { path: '/' });
  context.cookies.delete('admin_remember', { path: '/' });
  
  // Clean redirect back to the admin login page
  return context.redirect('/admin/admin_login');
};
