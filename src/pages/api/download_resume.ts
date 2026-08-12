import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { addSystemLog } from '../../lib/server/system-logs';

function isSafeDownloadTarget(value: string): boolean {
	if (value.startsWith('/') && !value.startsWith('//')) return true;
	try {
		const parsed = new URL(value);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

export const GET: APIRoute = async ({ locals }) => {
	let targetUrl = '/Abderrahmane_SAOUDI_Resume.pdf';
	let inlineResumeUrl: string | null = null;

	try {
		const db = getFirebaseAdminDb();
		const docRef = db.collection('configuration').doc('static_data');
		
		// Fetch current resume URL if customized in Firestore
		const snapshot = await docRef.get();
		let excludeSetting = true;
		if (snapshot.exists) {
			const data = snapshot.data();
			if (data?.resumeUrl) {
				const configuredUrl = String(data.resumeUrl);
				if (configuredUrl.startsWith('data:')) inlineResumeUrl = configuredUrl;
				else if (isSafeDownloadTarget(configuredUrl)) targetUrl = configuredUrl;
			}
			if (typeof data?.excludeAdminDownloads === 'boolean') {
				excludeSetting = data.excludeAdminDownloads;
			}
		}

		// Check if request originates from an authenticated admin
		const adminEmail = locals.adminEmail;
		// Middleware only sets locals.adminEmail after verifying the signature,
		// expiry, and current authorization. Cookie presence alone is not proof.
		const isAdmin = Boolean(adminEmail);
		
		const isExcluded = excludeSetting && isAdmin;

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

	if (inlineResumeUrl) {
		const match = /^data:application\/pdf;base64,([A-Za-z0-9+/=\r\n]+)$/i.exec(inlineResumeUrl);
		if (match) {
			const buffer = Buffer.from(match[1], 'base64');
			return new Response(new Uint8Array(buffer), {
				headers: {
					'Cache-Control': 'private, no-store',
					'Content-Disposition': 'attachment; filename="Abderrahmane_SAOUDI_Resume.pdf"',
					'Content-Length': String(buffer.byteLength),
					'Content-Type': 'application/pdf',
					'X-Content-Type-Options': 'nosniff',
				},
			});
		}
	}

	return new Response(null, {
		status: 302,
		headers: {
			'Cache-Control': 'private, no-store',
			Location: targetUrl,
		},
	});
};
