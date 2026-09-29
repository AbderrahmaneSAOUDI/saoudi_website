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
} from '../../lib/server/api-guards';
import type { TrustedCompany } from '../../types';

const COMPANIES_DIRECTORY = 'uploads/companies';

function invalidateCompaniesCaches(): void {
	clearCache('trusted_companies_list');
}

export const GET: APIRoute = async ({ locals }) => {
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;

	try {
		const db = getFirebaseAdminDb();
		const snapshot = await db.collection('trusted_companies').orderBy('order', 'asc').get();

		const companies = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				name: typeof data.name === 'string' ? data.name : '',
				logoUrl: getPublicMediaUrl(data.logoUrl, 'trusted_companies', doc.id) ?? data.logoUrl ?? '',
				websiteUrl: typeof data.websiteUrl === 'string' ? data.websiteUrl : '',
				order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
				createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
				updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
			} as TrustedCompany;
		});

		return jsonResponse({ success: true, companies });
	} catch (error) {
		console.error('Admin Companies GET API error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Failed to fetch trusted companies list.') },
			500,
		);
	}
};

export const POST: APIRoute = async ({ locals, request }) => {
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;
	const formErr = validateFormRequest(request);
	if (formErr) return formErr;

	try {
		const formData = await request.formData();
		const action = getFormString(formData, 'action');
		const companyId = getFormString(formData, 'id').trim();

		const db = getFirebaseAdminDb();

		if (action === 'delete') {
			if (!companyId) return jsonResponse({ error: 'Missing Company ID' }, 400);

			const docRef = db.collection('trusted_companies').doc(companyId);
			const docSnap = await docRef.get();
			if (!docSnap.exists) return jsonResponse({ error: 'Company not found' }, 404);

			const deletedName = docSnap.data()?.name || companyId;
			const logoUrl = docSnap.data()?.logoUrl;

			await docRef.delete();
			if (typeof logoUrl === 'string' && !logoUrl.startsWith('data:') && logoUrl.includes('uploads/companies')) {
				await deleteFile(logoUrl, COMPANIES_DIRECTORY);
			}

			invalidateCompaniesCaches();

			await safeSystemLog({
				type: 'content',
				severity: 'warn',
				action: 'COMPANY_DELETED',
				title: `Removed trusted company: "${deletedName}"`,
				details: `Company permanently deleted by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'trusted_companies',
				targetDocId: companyId,
				changeType: 'delete',
			});

			return jsonResponse({ success: true });
		}

		if (action === 'save') {
			const name = getFormString(formData, 'name').trim();
			const websiteUrl = getFormString(formData, 'websiteUrl').trim();
			const orderRaw = getFormString(formData, 'order').trim();
			let providedLogoUrl = getFormString(formData, 'logoUrl').trim();
			const logoFile = getFormFile(formData, 'logo');

			if (!name) {
				return jsonResponse({ error: 'Company name is required.' }, 400);
			}
			if (!websiteUrl) {
				return jsonResponse({ error: 'Website URL is required.' }, 400);
			}

			const order = orderRaw !== '' && Number.isFinite(Number(orderRaw)) ? parseInt(orderRaw, 10) : 0;
			const targetId = companyId || `company_${crypto.randomUUID()}`;
			const docRef = db.collection('trusted_companies').doc(targetId);
			const docSnap = await docRef.get();
			const isNew = !docSnap.exists;
			const existingData = docSnap.data() ?? {};
			const previousLogoUrl = existingData.logoUrl;

			let finalLogoUrl = providedLogoUrl || (typeof previousLogoUrl === 'string' ? previousLogoUrl : '');

			if (logoFile && logoFile.size > 0) {
				const ext = logoFile.type === 'image/svg+xml' ? 'svg' : 'webp';
				const filename = `company_logo_${crypto.randomUUID()}.${ext}`;

				const uploadedUrl = await saveFile({
					file: logoFile,
					destinationDir: COMPANIES_DIRECTORY,
					filename,
					contentType: logoFile.type || 'image/webp',
					localFallbackPath: COMPANIES_DIRECTORY,
				});

				if (typeof previousLogoUrl === 'string' && previousLogoUrl.includes('uploads/companies')) {
					await deleteFile(previousLogoUrl, COMPANIES_DIRECTORY);
				}

				finalLogoUrl = uploadedUrl;
			}

			if (!finalLogoUrl) {
				return jsonResponse({ error: 'Company logo is required. Please upload an image.' }, 400);
			}

			const now = new Date().toISOString();
			const companyData: TrustedCompany = {
				id: targetId,
				name,
				websiteUrl,
				logoUrl: finalLogoUrl,
				order,
				createdAt: isNew ? now : existingData.createdAt || now,
				updatedAt: now,
			};

			await docRef.set(companyData, { merge: true });
			invalidateCompaniesCaches();

			await safeSystemLog({
				type: 'content',
				severity: 'info',
				action: isNew ? 'COMPANY_CREATED' : 'COMPANY_UPDATED',
				title: `${isNew ? 'Added' : 'Updated'} trusted company: "${name}"`,
				details: `Company ${isNew ? 'created' : 'updated'} by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'trusted_companies',
				targetDocId: targetId,
				changeType: isNew ? 'create' : 'update',
			});

			return jsonResponse({ success: true, company: companyData });
		}

		return jsonResponse({ error: 'Invalid action.' }, 400);
	} catch (error) {
		console.error('Admin Companies POST API error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Failed to save trusted company.') },
			500,
		);
	}
};
