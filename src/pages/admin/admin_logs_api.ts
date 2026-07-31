import type { APIRoute } from 'astro';
import { getSystemLogs, addSystemLog } from '../../lib/server/system-logs';
import { getEnv } from '../../lib/server/env';

export const GET: APIRoute = async ({ url, locals }) => {
	try {
		const adminEmail = locals.adminEmail;
		if (!adminEmail) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
		const callerEmail = (adminEmail || '').toLowerCase().trim();
		const isPrimaryAdmin = callerEmail === primaryEmail && primaryEmail !== '';

		const requestedFilter = url.searchParams.get('type') || 'all';
		const typeFilter = isPrimaryAdmin ? requestedFilter : 'content';
		const searchQuery = (url.searchParams.get('search') || '').toLowerCase().trim();

		let logs = await getSystemLogs(100, typeFilter);
		if (!isPrimaryAdmin) {
			logs = logs.filter(l => l.type === 'content');
		}

		if (searchQuery) {
			logs = logs.filter(
				l =>
					l.title.toLowerCase().includes(searchQuery) ||
					(l.details && l.details.toLowerCase().includes(searchQuery)) ||
					l.userEmail.toLowerCase().includes(searchQuery) ||
					l.action.toLowerCase().includes(searchQuery)
			);
		}

		return new Response(JSON.stringify({ success: true, logs }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error fetching admin logs:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const adminEmail = locals.adminEmail;
		if (!adminEmail) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const formData = await request.formData();
		const action = formData.get('action') as string;

		if (action === 'log_event') {
			const type = (formData.get('type') as any) || 'system';
			const eventAction = (formData.get('eventAction') as string) || 'CUSTOM_EVENT';
			const title = (formData.get('title') as string) || 'Client Action Logged';
			const details = (formData.get('details') as string) || '';

			const createdLog = await addSystemLog({
				type,
				action: eventAction,
				title,
				details,
				userEmail: adminEmail,
			});

			return new Response(JSON.stringify({ success: true, log: createdLog }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ error: 'Invalid action' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error in admin_logs_api POST:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
