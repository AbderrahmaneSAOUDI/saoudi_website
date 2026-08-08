import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { getEnv } from '../../lib/server/env';
import { clearCache } from '../../lib/server/cache';
import { getErrorMessage, getFormString, isFormRequest, jsonResponse } from '../../lib/server/http';

export const GET: APIRoute = async ({ locals }) => {
	if (!locals.adminEmail) return jsonResponse({ error: 'Unauthorized' }, 401);

	try {
		const db = getFirebaseAdminDb();
		const [projectsSnap, experienceSnap, designsSnap, certificatesSnap, volunteeringSnap, configSnap] = await Promise.all([
			db.collection('projects').count().get(),
			db.collection('experience').count().get(),
			db.collection('designs').count().get(),
			db.collection('certificates').count().get(),
			db.collection('volunteering').count().get(),
			db.collection('configuration').doc('static_data').get(),
		]);

		const counts = {
			projects: projectsSnap.data().count,
			experience: experienceSnap.data().count,
			designs: designsSnap.data().count,
			certificates: certificatesSnap.data().count,
			volunteering: volunteeringSnap.data().count,
			resumeDownloads: configSnap.exists ? (configSnap.data()?.resumeDownloads || 0) : 0,
			excludeAdminDownloads: configSnap.exists ? (configSnap.data()?.excludeAdminDownloads ?? true) : true,
		};

		return jsonResponse({ success: true, counts });
	} catch (error) {
		console.error('Error fetching admin live stats:', error);
		return jsonResponse({ error: 'Failed to fetch admin stats' }, 500);
	}
};

export const POST: APIRoute = async ({ locals, request, cookies }) => {
	if (!locals.adminEmail) return jsonResponse({ error: 'Unauthorized' }, 401);
	if (!isFormRequest(request)) {
		return jsonResponse({ error: 'Expected form-encoded or JSON request' }, 415);
	}

	try {
		const formData = await request.formData();
		const action = getFormString(formData, 'action');

		if (action === 'toggle_exclude_downloads' || action === 'set_exclude_downloads') {
			const db = getFirebaseAdminDb();
			const configRef = db.collection('configuration').doc('static_data');

			const configSnap = await configRef.get();
			const currentVal = configSnap.exists ? (configSnap.data()?.excludeAdminDownloads ?? true) : true;

			let newVal: boolean;
			const reqVal = getFormString(formData, 'exclude');
			if (reqVal === 'true') newVal = true;
			else if (reqVal === 'false') newVal = false;
			else newVal = !currentVal;

			await configRef.set(
				{
					excludeAdminDownloads: newVal,
					updatedAt: new Date().toISOString(),
					updatedBy: locals.adminEmail,
				},
				{ merge: true }
			);

			const maxAge = 30 * 24 * 60 * 60;
			cookies.set('ignore_admin_downloads', String(newVal), {
				path: '/',
				maxAge,
				sameSite: 'lax',
				secure: true,
			});

			clearCache('admin_dashboard_counts');
			return jsonResponse({ success: true, excludeAdminDownloads: newVal });
		}

		if (action === 'reset_downloads') {
			const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
			const callerEmail = (locals.adminEmail || '').toLowerCase().trim();
			if (callerEmail !== primaryEmail) {
				return jsonResponse({ error: 'Permission denied. Only the website owner can do this action.' }, 403);
			}

			const db = getFirebaseAdminDb();
			const configRef = db.collection('configuration').doc('static_data');

			await configRef.set(
				{
					resumeDownloads: 0,
					lastResetAt: new Date().toISOString(),
					resetBy: locals.adminEmail,
				},
				{ merge: true }
			);

			clearCache('admin_dashboard_counts');
			return jsonResponse({ success: true, count: 0 });
		}

		return jsonResponse({ error: 'Invalid action specified' }, 400);
	} catch (error) {
		console.error('Error resetting downloads count:', error);
		return jsonResponse({ error: getErrorMessage(error, 'Failed to reset downloads count') }, 500);
	}
};
