import type { APIRoute } from 'astro';
import { getSystemLogs, addSystemLog, deleteSystemLog, purgeExpiredSystemLogs, canUserAccessLog } from '../../lib/server/system-logs';
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
		const searchQuery = (url.searchParams.get('search') || '').toLowerCase().trim();

		// For secondary admin requesting hidden types (admin, security, system), return empty early
		if (!isPrimaryAdmin && ['admin', 'security', 'system'].includes(requestedFilter)) {
			return new Response(JSON.stringify({ success: true, logs: [] }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const fetchType = requestedFilter === 'my_activity' ? 'all' : requestedFilter;
		let logs = await getSystemLogs(100, fetchType);

		// Apply Access Control Matrix filtering
		logs = logs.filter(l => canUserAccessLog(l, callerEmail, isPrimaryAdmin));

		// Additional filter for 'my_activity' tab (only logs produced by current user)
		if (requestedFilter === 'my_activity') {
			logs = logs.filter(l => (l.userEmail || '').toLowerCase().trim() === callerEmail);
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

		if (action === 'purge_expired') {
			const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
			const callerEmail = (adminEmail || '').toLowerCase().trim();
			const isOwner = callerEmail === primaryEmail && primaryEmail !== '';

			if (!isOwner) {
				return new Response(JSON.stringify({ error: 'Permission denied. Only the owner can purge logs.' }), {
					status: 403,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			const { success, deletedCount } = await purgeExpiredSystemLogs();

			if (success) {
				await addSystemLog({
					type: 'system',
					severity: 'info',
					action: 'SYSTEM_CACHE_CLEARED',
					title: 'Expired system logs purged',
					details: `Purged ${deletedCount} expired log records based on retention policy.`,
					userEmail: adminEmail,
				});

				return new Response(JSON.stringify({ success: true, deletedCount }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			} else {
				return new Response(JSON.stringify({ error: 'Failed to purge expired logs' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		if (action === 'delete_log') {
			const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
			const callerEmail = (adminEmail || '').toLowerCase().trim();
			const isOwner = callerEmail === primaryEmail && primaryEmail !== '';

			if (!isOwner) {
				return new Response(JSON.stringify({ error: 'Permission denied. Only the owner can delete logs.' }), {
					status: 403,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			const logId = formData.get('logId') as string;
			if (!logId) {
				return new Response(JSON.stringify({ error: 'Log ID is required' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			const success = await deleteSystemLog(logId);
			if (success) {
				return new Response(JSON.stringify({ success: true, logId }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			} else {
				return new Response(JSON.stringify({ error: 'Failed to delete log' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

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

export const DELETE: APIRoute = async ({ request, locals }) => {
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
		const isOwner = callerEmail === primaryEmail && primaryEmail !== '';

		if (!isOwner) {
			return new Response(JSON.stringify({ error: 'Permission denied. Only the owner can delete logs.' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const url = new URL(request.url);
		let logId = url.searchParams.get('id');

		if (!logId && request.headers.get('content-type')?.includes('application/json')) {
			const body = await request.json();
			logId = body.id || body.logId;
		}

		if (!logId) {
			return new Response(JSON.stringify({ error: 'Log ID is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const success = await deleteSystemLog(logId);
		if (success) {
			return new Response(JSON.stringify({ success: true, logId }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		} else {
			return new Response(JSON.stringify({ error: 'Failed to delete log' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	} catch (error) {
		console.error('Error in admin_logs_api DELETE:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
