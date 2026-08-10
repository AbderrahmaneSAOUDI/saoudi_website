import type { APIRoute } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import {
	getErrorMessage,
	getFormFile,
	getFormString,
	jsonResponse,
} from '../../lib/server/http';
import { deleteFile, saveFile } from '../../lib/server/storage';
import { EMPLOYMENT_TYPES } from '../../types';
import {
	safeSystemLog,
	validateAdminSession,
	validateFormRequest,
	validateOwnerPermission,
	validateWebpImage,
} from '../../lib/server/api-guards';

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
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;
	const formErr = validateFormRequest(request);
	if (formErr) return formErr;

	try {
		const formData = await request.formData();
		const action = getFormString(formData, 'action');
		const experienceId = getFormString(formData, 'id').trim();
		if (!experienceId) return jsonResponse({ error: 'Missing Experience ID' }, 400);

		const db = getFirebaseAdminDb();
		const docRef = db.collection('experience').doc(experienceId);

		if (action === 'delete') {
			const ownerErr = validateOwnerPermission(locals.adminEmail);
			if (ownerErr) return ownerErr;

			const docSnap = await docRef.get();
			if (!docSnap.exists) return jsonResponse({ error: 'Experience not found' }, 404);

			const deletedRole = docSnap.data()?.role || '';
			const deletedCompany = docSnap.data()?.company || '';
			const deletedTitle = deletedRole && deletedCompany ? `${deletedRole} at ${deletedCompany}` : experienceId;
			const logoUrl = docSnap.data()?.logoUrl;
			await docRef.delete();
			if (typeof logoUrl === 'string' && !logoUrl.startsWith('data:')) {
				await deleteFile(logoUrl, EXPERIENCE_DIRECTORY);
			}

			invalidateExperienceCaches(true);

			await safeSystemLog({
				type: 'content',
				severity: 'warn',
				action: 'EXPERIENCE_DELETED',
				title: `Removed experience entry: "${deletedTitle}"`,
				details: `Experience entry permanently deleted by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'experience',
				targetDocId: experienceId,
				changeType: 'delete',
			});

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
				const imageErr = validateWebpImage(logoFile, MAX_LOGO_BYTES, 'Logo must be a WebP file.', 'Logo file size must be under 50KB.');
				if (imageErr) return imageErr;

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

			const isNewExp = !docSnap.exists;
			invalidateExperienceCaches(isNewExp);

			await safeSystemLog({
				type: 'content',
				severity: 'info',
				action: isNewExp ? 'EXPERIENCE_CREATED' : 'EXPERIENCE_UPDATED',
				title: `${isNewExp ? 'Added' : 'Updated'} experience entry: "${role} at ${company}"`,
				details: `Type: ${employmentType}, Period: ${startDate} to ${endDate || 'Present'}`,
				userEmail: locals.adminEmail,
				targetCollection: 'experience',
				targetDocId: experienceId,
				changeType: isNewExp ? 'create' : 'update',
			});
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
