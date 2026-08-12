import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import { getPublicMediaUrl } from '../../lib/media';
import {
	getErrorMessage,
	getFormFile,
	getFormString,
	jsonResponse,
} from '../../lib/server/http';
import { deleteFile, saveFile } from '../../lib/server/storage';
import {
	safeSystemLog,
	validateAdminSession,
	validateFormRequest,
	validateOwnerPermission,
	validateWebpImage,
} from '../../lib/server/api-guards';

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
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;
	const formErr = validateFormRequest(request);
	if (formErr) return formErr;

	try {
		const formData = await request.formData();
		const action = getFormString(formData, 'action');
		const serviceId = getFormString(formData, 'id').trim();
		if (!serviceId) return jsonResponse({ error: 'Missing Service ID' }, 400);

		const db = getFirebaseAdminDb();
		const docRef = db.collection('services').doc(serviceId);

		if (action === 'delete') {
			const ownerErr = validateOwnerPermission(locals.adminEmail);
			if (ownerErr) return ownerErr;

			const docSnap = await docRef.get();
			if (!docSnap.exists) return jsonResponse({ error: 'Service not found' }, 404);

			const deletedTitle = docSnap.data()?.title || serviceId;
			const logoUrl = docSnap.data()?.logoUrl;
			await docRef.delete();
			if (typeof logoUrl === 'string' && !logoUrl.startsWith('data:')) {
				await deleteFile(logoUrl, SERVICES_DIRECTORY);
			}

			invalidateServicesCaches(true);

			await safeSystemLog({
				type: 'content',
				severity: 'warn',
				action: 'SERVICE_DELETED',
				title: `Removed service card: "${deletedTitle}"`,
				details: `Service card permanently deleted by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'services',
				targetDocId: serviceId,
				changeType: 'delete',
			});

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
				const imageErr = validateWebpImage(logoFile, MAX_LOGO_BYTES, 'Logo must be a WebP file.', 'Logo file size must be under 50KB.');
				if (imageErr) return imageErr;

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

			const isNewService = !docSnap.exists;
			invalidateServicesCaches(isNewService);

			await safeSystemLog({
				type: 'content',
				severity: 'info',
				action: isNewService ? 'SERVICE_CREATED' : 'SERVICE_UPDATED',
				title: `${isNewService ? 'Added new' : 'Updated'} service card: "${title}"`,
				details: `Order: ${order}, Features count: ${features.length}`,
				userEmail: locals.adminEmail,
				targetCollection: 'services',
				targetDocId: serviceId,
				changeType: isNewService ? 'create' : 'update',
			});
			return jsonResponse({
				success: true,
				service: {
					...serviceData,
					logoUrl: getPublicMediaUrl(serviceData.logoUrl, 'services', serviceId) ?? null,
				},
			});
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
