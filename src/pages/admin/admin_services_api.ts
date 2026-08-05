import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import {
	getErrorMessage,
	getFormFile,
	getFormString,
	isFormRequest,
	jsonResponse,
} from '../../lib/server/http';
import { deleteFile, saveFile } from '../../lib/server/storage';
import { getEnv } from '../../lib/server/env';

const SERVICES_DIRECTORY = 'uploads/services';
const MAX_LOGO_BYTES = 50 * 1024; // 50KB max for logos

function invalidateServicesCaches(countChanged: boolean): void {
	clearCache('services_list');
	if (countChanged) {
		clearCache('public_dashboard_counts');
		clearCache('admin_dashboard_counts');
	}
}

export const POST: APIRoute = async ({ locals, request }) => {
	if (!locals.adminEmail) return jsonResponse({ error: 'Unauthorized' }, 401);
	if (!isFormRequest(request)) {
		return jsonResponse({ error: 'Expected a form-encoded request.' }, 415);
	}

	try {
		const formData = await request.formData();
		const action = getFormString(formData, 'action');
		const serviceId = getFormString(formData, 'id').trim();
		if (!serviceId) return jsonResponse({ error: 'Missing Service ID' }, 400);

		const db = getFirebaseAdminDb();
		const docRef = db.collection('services').doc(serviceId);

		if (action === 'delete') {
			const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
			const callerEmail = (locals.adminEmail || '').toLowerCase().trim();
			if (callerEmail !== primaryEmail) {
				return jsonResponse({ error: 'Permission denied. Only the website owner can do this action.' }, 403);
			}

			const docSnap = await docRef.get();
			if (!docSnap.exists) return jsonResponse({ error: 'Service not found' }, 404);

			const logoUrl = docSnap.data()?.logoUrl;
			await docRef.delete();
			if (typeof logoUrl === 'string' && !logoUrl.startsWith('data:')) {
				await deleteFile(logoUrl, SERVICES_DIRECTORY);
			}

			invalidateServicesCaches(true);
			return jsonResponse({ success: true });
		}

		if (action === 'save') {
			const title = getFormString(formData, 'title').trim();
			const description = getFormString(formData, 'description').trim();
			const featuresRaw = getFormString(formData, 'features').trim();
			const orderRaw = getFormString(formData, 'order').trim();
			const logoFile = getFormFile(formData, 'logo');

			if (!title || !description) {
				return jsonResponse(
					{ error: 'Title and description are required.' },
					400,
				);
			}

			const order = orderRaw ? parseInt(orderRaw, 10) : 0;
			const features = featuresRaw
				? featuresRaw.split('\n').map((f) => f.trim()).filter(Boolean)
				: [];

			const docSnap = await docRef.get();
			const existingData = docSnap.data() ?? {};
			const previousLogoUrl = existingData.logoUrl;
			let logoUrl = typeof previousLogoUrl === 'string' ? previousLogoUrl : null;
			let uploadedLogoUrl: string | undefined;

			if (logoFile) {
				if (logoFile.type !== 'image/webp') {
					return jsonResponse({ error: 'Logo must be a WebP file.' }, 400);
				}
				if (logoFile.size > MAX_LOGO_BYTES) {
					return jsonResponse({ error: 'Logo file size must be under 50KB.' }, 400);
				}

				uploadedLogoUrl = await saveFile({
					file: logoFile,
					destinationDir: SERVICES_DIRECTORY,
					localFallbackPath: SERVICES_DIRECTORY,
					filename: `service_logo_${crypto.randomUUID()}.webp`,
					contentType: logoFile.type,
				});
				logoUrl = uploadedLogoUrl;
			}

			const serviceData = {
				id: serviceId,
				order: isNaN(order) ? 0 : order,
				title,
				description,
				logoUrl,
				features,
				updatedAt: new Date().toISOString(),
				...(docSnap.exists ? {} : { createdAt: new Date().toISOString() }),
			};

			try {
				await docRef.set(serviceData, { merge: true });
			} catch (error) {
				if (uploadedLogoUrl) await deleteFile(uploadedLogoUrl, SERVICES_DIRECTORY);
				throw error;
			}

			if (
				uploadedLogoUrl &&
				typeof previousLogoUrl === 'string' &&
				previousLogoUrl &&
				!previousLogoUrl.startsWith('data:')
			) {
				await deleteFile(previousLogoUrl, SERVICES_DIRECTORY);
			}

			invalidateServicesCaches(!docSnap.exists);
			return jsonResponse({ success: true, service: serviceData });
		}

		return jsonResponse({ error: 'Invalid action specified.' }, 400);
	} catch (error) {
		console.error('Admin services API error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Server error occurred during request.') },
			500,
		);
	}
};
