import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { addSystemLog } from '../../lib/server/system-logs';
import { clearCache } from '../../lib/server/cache';
import { FieldValue } from 'firebase-admin/firestore';

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

		if (isExcluded) {
			// Do NOT increment resume download counter for admins
			await addSystemLog({
				type: 'content',
				action: 'ADMIN_RESUME_DOWNLOAD',
				title: 'Resume Downloaded by Admin (Count Skipped)',
				details: `Admin (${adminEmail || 'Authenticated Admin'}) downloaded the resume. Download counter was not incremented.`,
				userEmail: adminEmail || 'Admin',
			});
		} else {
			// Atomically increment resume download count for public visitors
			await docRef.set(
				{
					resumeDownloads: FieldValue.increment(1),
					lastDownloadedAt: new Date().toISOString(),
				},
				{ merge: true }
			);

			// Log activity for system audit
			await addSystemLog({
				type: 'content',
				action: 'RESUME_DOWNLOAD',
				title: 'Resume Downloaded',
				details: 'A visitor clicked [Download] to view/download the resume PDF.',
				userEmail: 'Public Visitor',
			});

			// Clear admin stats cache
			clearCache('admin_dashboard_counts');
		}
	} catch (error) {
		console.error('Error tracking resume download count:', error);
	}

	return redirect(targetUrl, 302);
};
