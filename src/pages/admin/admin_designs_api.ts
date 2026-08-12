import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache, clearCacheByPrefix } from '../../lib/server/cache';
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

const DESIGNS_DIRECTORY = 'uploads/designs';
const DEFAULT_DESIGN_COMPANIES = ['Google', 'GDG', 'Freelance', 'Personal'];
const MAX_TRANSACTION_RENAMES = 450;

class DesignConflictError extends Error {
	constructor(message: string, readonly status = 409) {
		super(message);
	}
}

function getConfiguredCompanies(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
		: DEFAULT_DESIGN_COMPANIES;
}

function invalidateDesignCaches(countChanged: boolean): void {
	clearCacheByPrefix('designs_');
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
			const designsQuery = db.collection('designs').select('company');
			const companiesRef = db.collection('configuration').doc('designs_companies');
			try {
				await db.runTransaction(async transaction => {
					const usageSnapshot = await transaction.get(designsQuery);
					const updates = usageSnapshot.docs.flatMap(doc => {
						const currentCompany = doc.data().company;
						if (typeof currentCompany !== 'string' || !currentCompany) return [];
						const nextCompany = renameMap.get(currentCompany) || currentCompany;
						if (!companies.includes(nextCompany)) {
							throw new DesignConflictError(
								`The company "${currentCompany}" is still used by a design. Rename or reassign it first.`,
							);
						}
						return nextCompany === currentCompany ? [] : [{ ref: doc.ref, company: nextCompany }];
					});
					if (updates.length > MAX_TRANSACTION_RENAMES) {
						throw new DesignConflictError(
							`This rename affects more than ${MAX_TRANSACTION_RENAMES} designs. Reassign them in smaller groups.`,
							400,
						);
					}
					for (const update of updates) transaction.update(update.ref, { company: update.company });
					transaction.set(companiesRef, { companies });
				});
			} catch (error) {
				if (error instanceof DesignConflictError) {
					return jsonResponse({ error: error.message }, error.status);
				}
				throw error;
			}

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

			const companiesRef = db.collection('configuration').doc('designs_companies');
			const companiesSnapshot = await companiesRef.get();
			const allowedCompanies = getConfiguredCompanies(companiesSnapshot.data()?.companies);
			if (!allowedCompanies.includes(company)) {
				return jsonResponse({ error: 'Select a company from the current configured list.' }, 409);
			}

			const docRef = db.collection('designs').doc(designId);
			let uploadedImageUrl: string | undefined;

			if (imageFile) {
				const imageErr = validateWebpImage(imageFile);
				if (imageErr) return imageErr;

				uploadedImageUrl = await saveFile({
					file: imageFile,
					destinationDir: DESIGNS_DIRECTORY,
					localFallbackPath: DESIGNS_DIRECTORY,
					filename: `design_${crypto.randomUUID()}.webp`,
					contentType: imageFile.type,
				});
			}

			let design: { id: string; title: string; imageUrl: string; company: string; date: string };
			let previousImageUrl = '';
			let isNewDesign = false;
			try {
				await db.runTransaction(async transaction => {
					const [currentCompaniesSnapshot, currentDesignSnapshot] = await Promise.all([
						transaction.get(companiesRef),
						transaction.get(docRef),
					]);
					const currentCompanies = getConfiguredCompanies(currentCompaniesSnapshot.data()?.companies);
					if (!currentCompanies.includes(company)) {
						throw new DesignConflictError('The selected company is no longer available. Reload and try again.');
					}
					const storedImageUrl = currentDesignSnapshot.data()?.imageUrl;
					previousImageUrl = typeof storedImageUrl === 'string' ? storedImageUrl : '';
					const imageUrl = uploadedImageUrl || previousImageUrl;
					if (!imageUrl) {
						throw new DesignConflictError('An image is required for this design project.', 400);
					}
					design = { id: designId, title, imageUrl, company, date };
					isNewDesign = !currentDesignSnapshot.exists;
					// Writing the validated configuration back unchanged makes company-list
					// edits and design saves conflict instead of creating a write-skew orphan.
					transaction.set(companiesRef, { companies: currentCompanies }, { merge: true });
					transaction.set(docRef, design, { merge: true });
				});
			} catch (error) {
				if (uploadedImageUrl) await deleteFile(uploadedImageUrl, DESIGNS_DIRECTORY);
				if (error instanceof DesignConflictError) {
					return jsonResponse({ error: error.message }, error.status);
				}
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

			return jsonResponse({
				success: true,
				design: {
					...design!,
					imageUrl: getPublicMediaUrl(design!.imageUrl, 'designs', designId) || '',
				},
			});
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
