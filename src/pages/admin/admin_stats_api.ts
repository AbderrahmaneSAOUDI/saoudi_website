import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { addSystemLog } from '../../lib/server/system-logs';
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
		};

		return jsonResponse({ success: true, counts });
	} catch (error) {
		console.error('Error fetching admin live stats:', error);
		return jsonResponse({ error: 'Failed to fetch admin stats' }, 500);
	}
};

export const POST: APIRoute = async ({ locals, request }) => {
	if (!locals.adminEmail) return jsonResponse({ error: 'Unauthorized' }, 401);
	if (!isFormRequest(request)) {
		return jsonResponse({ error: 'Expected form-encoded or JSON request' }, 415);
	}

	try {
		const formData = await request.formData();
		const action = getFormString(formData, 'action');

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

			await addSystemLog({
				type: 'content',
				action: 'RESUME_DOWNLOADS_RESET',
				title: 'Resume Downloads Counter Reset',
				details: `Admin ${locals.adminEmail} reset resume download counter to 0.`,
				userEmail: locals.adminEmail,
			});

			clearCache('admin_dashboard_counts');
			return jsonResponse({ success: true, count: 0 });
		}

		return jsonResponse({ error: 'Invalid action specified' }, 400);
	} catch (error) {
		console.error('Error resetting downloads count:', error);
		return jsonResponse({ error: getErrorMessage(error, 'Failed to reset downloads count') }, 500);
	}
};
