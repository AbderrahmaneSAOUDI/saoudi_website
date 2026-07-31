import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { addSystemLog } from '../../lib/server/system-logs';
import { clearCache } from '../../lib/server/cache';
import { FieldValue } from 'firebase-admin/firestore';

export const GET: APIRoute = async ({ redirect }) => {
	let targetUrl = '/Abderrahmane_SAOUDI_Resume.pdf';

	try {
		const db = getFirebaseAdminDb();
		const docRef = db.collection('configuration').doc('static_data');
		
		// Fetch current resume URL if customized in Firestore
		const snapshot = await docRef.get();
		if (snapshot.exists) {
			const data = snapshot.data();
			if (data?.resumeUrl) {
				targetUrl = data.resumeUrl;
			}
		}

		// Atomically increment resume download count
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
	} catch (error) {
		console.error('Error tracking resume download count:', error);
	}

	return redirect(targetUrl, 302);
};
