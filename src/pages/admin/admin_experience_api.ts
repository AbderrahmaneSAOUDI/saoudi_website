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
import { getEnv } from '../../lib/server/env';
import { EMPLOYMENT_TYPES } from '../../types';

const EXPERIENCE_DIRECTORY = 'uploads/experience';
const MAX_LOGO_BYTES = 50 * 1024; // 50KB max for logos
const VALID_EMPLOYMENT_TYPES = new Set(EMPLOYMENT_TYPES);

function invalidateExperienceCaches(countChanged: boolean): void {
	clearCache('experience_list');
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
		const experienceId = getFormString(formData, 'id').trim();
		if (!experienceId) return jsonResponse({ error: 'Missing Experience ID' }, 400);

		const db = getFirebaseAdminDb();
		const docRef = db.collection('experience').doc(experienceId);

		if (action === 'delete') {
			const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
			const callerEmail = (locals.adminEmail || '').toLowerCase().trim();
			if (callerEmail !== primaryEmail) {
				return jsonResponse({ error: 'Permission denied. Only the website owner can do this action.' }, 403);
			}

			const docSnap = await docRef.get();
			if (!docSnap.exists) return jsonResponse({ error: 'Experience not found' }, 404);

			const logoUrl = docSnap.data()?.logoUrl;
			await docRef.delete();
			if (typeof logoUrl === 'string' && !logoUrl.startsWith('data:')) {
				await deleteFile(logoUrl, EXPERIENCE_DIRECTORY);
			}

			invalidateExperienceCaches(true);
			return jsonResponse({ success: true });
		}

		if (action === 'save') {
			const role = getFormString(formData, 'role').trim();
			const company = getFormString(formData, 'company').trim();
			const employmentType = getFormString(formData, 'employmentType').trim();
			const startDate = getFormString(formData, 'startDate').trim();
			const endDateRaw = getFormString(formData, 'endDate').trim();
			const responsibilities = getFormString(formData, 'responsibilities').trim();
			const orderRaw = getFormString(formData, 'order').trim();
			const logoFile = getFormFile(formData, 'logo');

			if (!role || !company || !employmentType || !startDate) {
				return jsonResponse(
					{ error: 'Role, company, employment type, and start date are required.' },
					400,
				);
			}
			if (!VALID_EMPLOYMENT_TYPES.has(employmentType as any)) {
				return jsonResponse({ error: 'Invalid employment type.' }, 400);
			}

			const order = orderRaw ? parseInt(orderRaw, 10) : 0;
			const endDate = endDateRaw || null;

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
					destinationDir: EXPERIENCE_DIRECTORY,
					localFallbackPath: EXPERIENCE_DIRECTORY,
					filename: `logo_${crypto.randomUUID()}.webp`,
					contentType: logoFile.type,
				});
				logoUrl = uploadedLogoUrl;
			}

			const experience = {
				id: experienceId,
				order: isNaN(order) ? 0 : order,
				role,
				company,
				logoUrl,
				employmentType,
				startDate,
				endDate,
				responsibilities,
			};
			const experiencePayload: Record<string, unknown> = { ...experience };

			// Clean up legacy fields from old schema
			if (docSnap.exists) {
				const legacyFields = ['location', 'date', 'period', 'descriptionPoints', 'technologies'];
				for (const field of legacyFields) {
					if (field in existingData) experiencePayload[field] = FieldValue.delete();
				}
			}

			try {
				await docRef.set(experiencePayload, { merge: true });
			} catch (error) {
				if (uploadedLogoUrl) await deleteFile(uploadedLogoUrl, EXPERIENCE_DIRECTORY);
				throw error;
			}

			if (
				uploadedLogoUrl &&
				typeof previousLogoUrl === 'string' &&
				previousLogoUrl &&
				!previousLogoUrl.startsWith('data:')
			) {
				await deleteFile(previousLogoUrl, EXPERIENCE_DIRECTORY);
			}

			invalidateExperienceCaches(!docSnap.exists);
			return jsonResponse({ success: true, experience });
		}

		return jsonResponse({ error: 'Invalid action specified.' }, 400);
	} catch (error) {
		console.error('Admin experience API error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Server error occurred during request.') },
			500,
		);
	}
};
