import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { addSystemLog } from '../../lib/server/system-logs';

export const GET: APIRoute = async ({ redirect, locals, cookies }) => {
	let targetUrl = '/Abderrahmane_SAOUDI_Resume.pdf';

	try {
		const db = getFirebaseAdminDb();
		const docRef = db.collection('configuration').doc('static_data');
		
		// Fetch current resume URL if customized in Firestore
		const snapshot = await docRef.get();
		let excludeSetting = true;
		if (snapshot.exists) {
			const data = snapshot.data();
			if (data?.resumeUrl) {
				targetUrl = data.resumeUrl;
			}
			if (typeof data?.excludeAdminDownloads === 'boolean') {
				excludeSetting = data.excludeAdminDownloads;
			}
		}

		// Check if request originates from an authenticated admin
		const ignoreCookie = cookies.get('ignore_admin_downloads')?.value;
		const adminEmail = locals.adminEmail;
		const hasAdminSession = Boolean(cookies.get('admin_session')?.value);
		const isAdmin = Boolean(adminEmail || hasAdminSession);
		
		// Exclude admin downloads if setting is enabled and requester is an admin (unless cookie is explicitly 'false')
		const isExcluded = excludeSetting && isAdmin && ignoreCookie !== 'false';

		if (!isExcluded) {
			// Atomically increment resume download count for public visitors
			await docRef.set(
				{
					resumeDownloads: FieldValue.increment(1),
					lastDownloadedAt: new Date().toISOString(),
				},
				{ merge: true }
			);

			// Clear admin stats cache
			clearCache('admin_dashboard_counts');

			await addSystemLog({
				type: 'visitor',
				action: 'VISITOR_RESUME_DOWNLOAD',
				title: 'Public Resume Downloaded',
				details: 'A site visitor downloaded the resume PDF.',
				severity: 'info',
				userEmail: 'visitor',
			});
		} else {
			await addSystemLog({
				type: 'visitor',
				action: 'ADMIN_RESUME_DOWNLOAD',
				title: 'Resume Downloaded by Admin (Count Skipped)',
				details: `Admin (${adminEmail || 'authenticated'}) downloaded the resume. Counter was not incremented.`,
				severity: 'info',
				userEmail: adminEmail || 'admin',
			});
		}
	} catch (error) {
		console.error('Error tracking resume download count:', error);
	}

	return redirect(targetUrl, 302);
};
