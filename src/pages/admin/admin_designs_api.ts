import type { APIRoute } from 'astro';
import type { DocumentReference } from 'firebase-admin/firestore';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache, clearCacheByPrefix } from '../../lib/server/cache';
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

const DESIGNS_DIRECTORY = 'uploads/designs';
const MAX_IMAGE_BYTES = 700 * 1024;
const DEFAULT_DESIGN_COMPANIES = ['Google', 'GDG', 'Freelance', 'Personal'];

function invalidateDesignCaches(countChanged: boolean): void {
	clearCacheByPrefix('designs_');
	if (countChanged) {
		clearCache('public_dashboard_counts');
		clearCache('admin_dashboard_counts');
	}
}

async function commitCompanyUpdates(
	updates: Array<{ ref: DocumentReference; company: string }>,
): Promise<void> {
	const db = getFirebaseAdminDb();

	for (let offset = 0; offset < updates.length; offset += 500) {
		const batch = db.batch();
		for (const update of updates.slice(offset, offset + 500)) {
			batch.update(update.ref, { company: update.company });
		}
		await batch.commit();
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
		const designId = getFormString(formData, 'id').trim();

		if (action !== 'save_companies' && !designId) {
			return jsonResponse({ error: 'Missing Design ID' }, 400);
		}

		const db = getFirebaseAdminDb();

		if (action === 'delete') {
			const ownerErr = validateOwnerPermission(locals.adminEmail);
			if (ownerErr) return ownerErr;

			const docRef = db.collection('designs').doc(designId);
			const docSnap = await docRef.get();
			if (!docSnap.exists) return jsonResponse({ error: 'Design not found' }, 404);

			const deletedTitle = docSnap.data()?.title || docSnap.data()?.company || designId;
			const imageUrl = docSnap.data()?.imageUrl;
			await docRef.delete();

			if (typeof imageUrl === 'string' && !imageUrl.startsWith('data:')) {
				await deleteFile(imageUrl, DESIGNS_DIRECTORY);
			}

			invalidateDesignCaches(true);

			await safeSystemLog({
				type: 'content',
				severity: 'warn',
				action: 'DESIGN_DELETED',
				title: `Removed design card: "${deletedTitle}"`,
				details: `Design card deleted by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'designs',
				targetDocId: designId,
				changeType: 'delete',
			});

			return jsonResponse({ success: true });
		}

		if (action === 'save_companies') {
			const companiesJson = getFormString(formData, 'companies');
			const renamesJson = getFormString(formData, 'renames');
			if (!companiesJson) {
				return jsonResponse({ error: 'Companies list is required.' }, 400);
			}

			let companies: string[];
			let renames: Record<string, unknown> = {};
			try {
				const parsedCompanies: unknown = JSON.parse(companiesJson);
				if (!Array.isArray(parsedCompanies) || !parsedCompanies.every((value) => typeof value === 'string')) {
					return jsonResponse({ error: 'Companies must be an array of strings.' }, 400);
				}

				companies = [...new Set(parsedCompanies.map((value) => value.trim()).filter(Boolean))];
				if (companies.length === 0) {
					return jsonResponse({ error: 'At least one company is required.' }, 400);
				}
				if (companies.length > 100 || companies.some((value) => value.length > 100)) {
					return jsonResponse({ error: 'Company names exceed the supported limit.' }, 400);
				}

				if (renamesJson) {
					const parsedRenames: unknown = JSON.parse(renamesJson);
					if (!parsedRenames || typeof parsedRenames !== 'object' || Array.isArray(parsedRenames)) {
						return jsonResponse({ error: 'Renames must be an object.' }, 400);
					}
					renames = parsedRenames as Record<string, unknown>;
				}
			} catch {
				return jsonResponse({ error: 'Invalid JSON in companies or renames.' }, 400);
			}

			const renameEntries = Object.entries(renames)
				.filter((entry): entry is [string, string] => typeof entry[1] === 'string')
				.map(([oldCompany, newCompany]) => [oldCompany.trim(), newCompany.trim()] as const)
				.filter(([oldCompany, newCompany]) => oldCompany && newCompany && oldCompany !== newCompany);
			const renameMap = new Map(renameEntries);
			const usageSnapshot = await db.collection('designs').select('company').get();
			const orphanedCompanies = [...new Set(
				usageSnapshot.docs
					.map(doc => doc.data().company)
					.filter((company): company is string => typeof company === 'string' && company.length > 0)
					.map(company => renameMap.get(company) || company)
					.filter(company => !companies.includes(company)),
			)];
			if (orphanedCompanies.length > 0) {
				return jsonResponse({
					error: `These companies are still used by designs: ${orphanedCompanies.join(', ')}. Rename or reassign them first.`,
				}, 409);
			}

			// All exact-match rename queries are independent, so fetch them concurrently.
			const snapshots = await Promise.all(
				renameEntries.map(([oldCompany]) =>
					db.collection('designs').where('company', '==', oldCompany).get(),
				),
			);

			const updates = snapshots.flatMap((snapshot, index) => {
				const newCompany = renameEntries[index][1];
				return snapshot.docs.map((doc) => ({ ref: doc.ref, company: newCompany }));
			});

			await commitCompanyUpdates(updates);
			await db.collection('configuration').doc('designs_companies').set({ companies });

			invalidateDesignCaches(false);

			await safeSystemLog({
				type: 'content',
				severity: 'info',
				action: 'DESIGN_COMPANIES_UPDATED',
				title: 'Updated design companies list',
				details: `Companies: ${companies.join(', ')}`,
				userEmail: locals.adminEmail,
			});

			return jsonResponse({ success: true });
		}

		if (action === 'save') {
			const title = getFormString(formData, 'title').trim();
			const company = getFormString(formData, 'company').trim();
			const date = getFormString(formData, 'date').trim();
			const imageFile = getFormFile(formData, 'image');
			if (!company) return jsonResponse({ error: 'Company is required.' }, 400);

			const docRef = db.collection('designs').doc(designId);
			const companiesRef = db.collection('configuration').doc('designs_companies');
			const [docSnap, companiesSnapshot] = await Promise.all([docRef.get(), companiesRef.get()]);
			const configuredCompanies = companiesSnapshot.data()?.companies;
			const allowedCompanies = Array.isArray(configuredCompanies)
				? configuredCompanies.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
				: DEFAULT_DESIGN_COMPANIES;
			if (!allowedCompanies.includes(company)) {
				return jsonResponse({ error: 'Select a company from the current configured list.' }, 409);
			}
			const previousImageUrl = docSnap.exists ? docSnap.data()?.imageUrl : '';
			let imageUrl = typeof previousImageUrl === 'string' ? previousImageUrl : '';
			let uploadedImageUrl: string | undefined;

			if (imageFile) {
				const imageErr = validateWebpImage(imageFile, MAX_IMAGE_BYTES);
				if (imageErr) return imageErr;

				uploadedImageUrl = await saveFile({
					file: imageFile,
					destinationDir: DESIGNS_DIRECTORY,
					localFallbackPath: DESIGNS_DIRECTORY,
					filename: `design_${crypto.randomUUID()}.webp`,
					contentType: imageFile.type,
				});
				imageUrl = uploadedImageUrl;
			}

			if (!imageUrl) {
				return jsonResponse({ error: 'An image is required for this design project.' }, 400);
			}

			const design = { id: designId, title, imageUrl, company, date };
			try {
				await docRef.set(design, { merge: true });
			} catch (error) {
				if (uploadedImageUrl) await deleteFile(uploadedImageUrl, DESIGNS_DIRECTORY);
				throw error;
			}

			if (
				uploadedImageUrl &&
				typeof previousImageUrl === 'string' &&
				previousImageUrl &&
				!previousImageUrl.startsWith('data:')
			) {
				await deleteFile(previousImageUrl, DESIGNS_DIRECTORY);
			}

			const isNewDesign = !docSnap.exists;
			invalidateDesignCaches(isNewDesign);

			await safeSystemLog({
				type: 'content',
				severity: 'info',
				action: isNewDesign ? 'DESIGN_CREATED' : 'DESIGN_UPDATED',
				title: `${isNewDesign ? 'Added new' : 'Updated'} design card: "${title || company}"`,
				details: `Company: ${company}`,
				userEmail: locals.adminEmail,
				targetCollection: 'designs',
				targetDocId: designId,
				changeType: isNewDesign ? 'create' : 'update',
			});

			return jsonResponse({ success: true, design });
		}

		return jsonResponse({ error: 'Invalid action specified.' }, 400);
	} catch (error) {
		console.error('Admin designs API error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Server error occurred during request.') },
			500,
		);
	}
};
