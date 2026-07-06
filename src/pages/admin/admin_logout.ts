import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  // Clear the admin_session cookie from the root path
  context.cookies.delete('admin_session', { path: '/' });
  
  // Clean redirect back to the admin login page
  return context.redirect('/admin/admin_login');
};
