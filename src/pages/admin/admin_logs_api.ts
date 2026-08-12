import type { APIRoute } from 'astro';
import {
	getSystemLogs,
	deleteSystemLog,
	purgeExpiredSystemLogs,
	canUserAccessLog,
} from '../../lib/server/system-logs';
import { getEnv } from '../../lib/server/env';
import { getErrorMessage, jsonResponse } from '../../lib/server/http';
import {
	safeSystemLog,
	validateAdminSession,
	validateFormRequest,
	validateOwnerPermission,
} from '../../lib/server/api-guards';

export const GET: APIRoute = async ({ url, locals }) => {
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;

	try {
		const adminEmail = locals.adminEmail!;
		const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
		const callerEmail = adminEmail.toLowerCase().trim();
		const isPrimaryAdmin = callerEmail === primaryEmail && primaryEmail !== '';

		const requestedFilter = url.searchParams.get('type') || 'all';
		const searchQuery = (url.searchParams.get('search') || '').toLowerCase().trim();

		// For secondary admin requesting hidden types (admin, security, system), return empty early
		if (!isPrimaryAdmin && ['admin', 'security', 'system'].includes(requestedFilter)) {
			return jsonResponse({ success: true, logs: [] });
		}

		const fetchType = requestedFilter === 'my_activity' ? 'all' : requestedFilter;
		let logs = await getSystemLogs(100, fetchType);

		// Apply Access Control Matrix filtering
		logs = logs.filter((l) => canUserAccessLog(l, callerEmail, isPrimaryAdmin));

		// Additional filter for 'my_activity' tab (only logs produced by current user)
		if (requestedFilter === 'my_activity') {
			logs = logs.filter((l) => (l.userEmail || '').toLowerCase().trim() === callerEmail);
		}

		if (searchQuery) {
			logs = logs.filter(
				(l) =>
					l.title.toLowerCase().includes(searchQuery) ||
					(l.details && l.details.toLowerCase().includes(searchQuery)) ||
					l.userEmail.toLowerCase().includes(searchQuery) ||
					l.action.toLowerCase().includes(searchQuery),
			);
		}

		return jsonResponse({ success: true, logs });
	} catch (error) {
		console.error('Error fetching admin logs:', error);
		return jsonResponse({ error: getErrorMessage(error, 'Failed to fetch logs') }, 500);
	}
};

export const POST: APIRoute = async ({ request, locals }) => {
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;
	const formErr = validateFormRequest(request);
	if (formErr) return formErr;

	try {
		const adminEmail = locals.adminEmail!;
		const formData = await request.formData();
		const action = formData.get('action') as string;

		if (action === 'purge_expired') {
			const ownerErr = validateOwnerPermission(adminEmail);
			if (ownerErr) return ownerErr;

			const { success, deletedCount } = await purgeExpiredSystemLogs();

			if (success) {
				await safeSystemLog({
					type: 'system',
					severity: 'info',
					action: 'SYSTEM_CACHE_CLEARED',
					title: 'Expired system logs purged',
					details: `Purged ${deletedCount} expired log records based on retention policy.`,
					userEmail: adminEmail,
				});

				return jsonResponse({ success: true, deletedCount });
			} else {
				return jsonResponse({ error: 'Failed to purge expired logs' }, 500);
			}
		}

		if (action === 'delete_log') {
			const ownerErr = validateOwnerPermission(adminEmail);
			if (ownerErr) return ownerErr;

			const logId = formData.get('logId') as string;
			if (!logId) {
				return jsonResponse({ error: 'Log ID is required' }, 400);
			}

			const success = await deleteSystemLog(logId);
			if (success) {
				return jsonResponse({ success: true, logId });
			} else {
				return jsonResponse({ error: 'Failed to delete log' }, 500);
			}
		}

		return jsonResponse({ error: 'Invalid action' }, 400);
	} catch (error) {
		console.error('Error in admin_logs_api POST:', error);
		return jsonResponse({ error: getErrorMessage(error, 'Internal server error') }, 500);
	}
};

export const DELETE: APIRoute = async ({ request, locals }) => {
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;

	try {
		const adminEmail = locals.adminEmail!;
		const ownerErr = validateOwnerPermission(adminEmail);
		if (ownerErr) return ownerErr;

		const url = new URL(request.url);
		let logId = url.searchParams.get('id');

		if (!logId && request.headers.get('content-type')?.includes('application/json')) {
			const body = await request.json();
			logId = body.id || body.logId;
		}

		if (!logId) {
			return jsonResponse({ error: 'Log ID is required' }, 400);
		}

		const success = await deleteSystemLog(logId);
		if (success) {
			return jsonResponse({ success: true, logId });
		} else {
			return jsonResponse({ error: 'Failed to delete log' }, 500);
		}
	} catch (error) {
		console.error('Error in admin_logs_api DELETE:', error);
		return jsonResponse({ error: getErrorMessage(error, 'Internal server error') }, 500);
	}
};
