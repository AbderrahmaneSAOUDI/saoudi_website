import type { APIRoute } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
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

const CERTIFICATES_DIRECTORY = 'uploads/certificates';
const MAX_IMAGE_BYTES = 800 * 1024;
const VALID_TYPES = new Set(['Online', 'In-Person', 'Hybrid']);

function invalidateCertificateCaches(countChanged: boolean): void {
	clearCache('certificates_list');
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
		const certificateId = getFormString(formData, 'id').trim();
		if (!certificateId) return jsonResponse({ error: 'Missing Certificate ID' }, 400);

		const db = getFirebaseAdminDb();
		const docRef = db.collection('certificates').doc(certificateId);

		if (action === 'delete') {
			const docSnap = await docRef.get();
			if (!docSnap.exists) return jsonResponse({ error: 'Certificate not found' }, 404);

			const imageUrl = docSnap.data()?.imageUrl;
			await docRef.delete();
			if (typeof imageUrl === 'string' && !imageUrl.startsWith('data:')) {
				await deleteFile(imageUrl, CERTIFICATES_DIRECTORY);
			}

			invalidateCertificateCaches(true);
			return jsonResponse({ success: true });
		}

		if (action === 'save') {
			const title = getFormString(formData, 'title').trim();
			const issuer = getFormString(formData, 'issuer').trim();
			const date = getFormString(formData, 'date').trim();
			const type = getFormString(formData, 'type').trim();
			const credentialUrl = getFormString(formData, 'credentialUrl').trim();
			const imageFile = getFormFile(formData, 'image');

			if (!title || !issuer || !date || !type) {
				return jsonResponse(
					{ error: 'Title, issuer, date, and certificate type are required.' },
					400,
				);
			}
			if (!VALID_TYPES.has(type)) {
				return jsonResponse({ error: 'Invalid certificate type.' }, 400);
			}

			const docSnap = await docRef.get();
			const existingData = docSnap.data() ?? {};
			const previousImageUrl = existingData.imageUrl;
			let imageUrl = typeof previousImageUrl === 'string' ? previousImageUrl : null;
			let uploadedImageUrl: string | undefined;

			if (imageFile) {
				if (imageFile.type !== 'image/webp') {
					return jsonResponse({ error: 'Image must be a WebP file.' }, 400);
				}
				if (imageFile.size > MAX_IMAGE_BYTES) {
					return jsonResponse({ error: 'Image file size must be under 800KB.' }, 400);
				}

				uploadedImageUrl = await saveFile({
					file: imageFile,
					destinationDir: CERTIFICATES_DIRECTORY,
					localFallbackPath: CERTIFICATES_DIRECTORY,
					filename: `certificate_${crypto.randomUUID()}.webp`,
					contentType: imageFile.type,
				});
				imageUrl = uploadedImageUrl;
			}

			const certificate = {
				id: certificateId,
				title,
				issuer,
				date,
				type,
				credentialUrl: credentialUrl || null,
				imageUrl,
			};
			const certificatePayload: Record<string, unknown> = { ...certificate };

			if (docSnap.exists) {
				if ('credentialId' in existingData) certificatePayload.credentialId = FieldValue.delete();
				if ('period' in existingData) certificatePayload.period = FieldValue.delete();
				if ('order' in existingData) certificatePayload.order = FieldValue.delete();
			}

			try {
				await docRef.set(certificatePayload, { merge: true });
			} catch (error) {
				if (uploadedImageUrl) await deleteFile(uploadedImageUrl, CERTIFICATES_DIRECTORY);
				throw error;
			}

			if (
				uploadedImageUrl &&
				typeof previousImageUrl === 'string' &&
				previousImageUrl &&
				!previousImageUrl.startsWith('data:')
			) {
				await deleteFile(previousImageUrl, CERTIFICATES_DIRECTORY);
			}

			invalidateCertificateCaches(!docSnap.exists);
			return jsonResponse({ success: true, certificate });
		}

		return jsonResponse({ error: 'Invalid action specified.' }, 400);
	} catch (error) {
		console.error('Admin certificates API error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Server error occurred during request.') },
			500,
		);
	}
};
