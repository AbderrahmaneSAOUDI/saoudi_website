import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { deleteFile } from '../../lib/server/storage';
import { clearCache } from '../../lib/server/cache';

export const POST: APIRoute = async ({ locals, request }) => {
	// Auth check: verify session token
	if (!locals.adminEmail) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const formData = await request.formData();
		const action = formData.get('action') as string; // 'save', 'delete', or 'update_category'
		const designId = formData.get('id') as string;

		if (action !== 'save_companies' && !designId) {
			return new Response(JSON.stringify({ error: 'Missing Design ID' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const db = getFirebaseAdminDb();

		// ─── ACTION: DELETE ───────────────────────────────────────────────────
		if (action === 'delete') {
			const docRef = db.collection('designs').doc(designId);
			const docSnap = await docRef.get();

			if (!docSnap.exists) {
				return new Response(JSON.stringify({ error: 'Design not found' }), {
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			const designData = docSnap.data();
			const imageUrl = designData?.imageUrl as string | undefined;

			// 1. Delete Storage / local image file first (atomic policy)
			if (imageUrl && !imageUrl.startsWith('data:')) {
				await deleteFile(imageUrl, 'uploads/designs');
			}

			// 2. Delete Firestore document
			await docRef.delete();

			// Invalidate cache
			clearCache('designs_list');

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// ─── ACTION: SAVE COMPANIES (CRUD & REORDER) ────────────────────────
		if (action === 'save_companies') {
			const companiesListJson = formData.get('companies') as string;
			const renamesJson = formData.get('renames') as string;

			if (!companiesListJson) {
				return new Response(JSON.stringify({ error: 'Companies list is required.' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			let companiesList: string[];
			let renames: Record<string, string> = {};

			// SECURITY: Validate parsed JSON is actually the expected type.
			// Without this, a malicious admin could inject non-string values.
			try {
				const parsed = JSON.parse(companiesListJson);
				if (!Array.isArray(parsed) || !parsed.every((v: unknown) => typeof v === 'string')) {
					return new Response(JSON.stringify({ error: 'Companies must be an array of strings.' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					});
				}
				companiesList = parsed;

				if (renamesJson) {
					const parsedRenames = JSON.parse(renamesJson);
					if (typeof parsedRenames === 'object' && parsedRenames !== null) {
						renames = parsedRenames;
					}
				}
			} catch {
				return new Response(JSON.stringify({ error: 'Invalid JSON in companies or renames.' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			// 1. Update the configuration document
			const configRef = db.collection('configuration').doc('designs_companies');
			await configRef.set({ companies: companiesList });

			// 2. Perform company renames in designs collection
			const renameKeys = Object.keys(renames);
			if (renameKeys.length > 0) {
				const batch = db.batch();
				let updateCount = 0;

				for (const oldComp of renameKeys) {
					const newComp = renames[oldComp];
					if (typeof newComp !== 'string') continue;
					if (oldComp.trim() !== newComp.trim()) {
						const snapshot = await db.collection('designs').where('company', '==', oldComp.trim()).get();
						for (const doc of snapshot.docs) {
							// SAFETY: Firestore batches have a 500-operation limit.
							if (updateCount >= 499) break;
							batch.update(doc.ref, { company: newComp.trim() });
							updateCount++;
						}
					}
				}

				if (updateCount > 0) {
					await batch.commit();
				}
			}

			// Invalidate cache
			clearCache('designs_companies');
			clearCache('designs_list');

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// ─── ACTION: SAVE (CREATE OR UPDATE) ─────────────────────────────────
		if (action === 'save') {
			const title = formData.get('title') as string;
			const company = formData.get('company') as string;
			const date = formData.get('date') as string;
			const tagsStr = formData.get('tags') as string;
			const imageFile = formData.get('image') as File | null;

			// Server validation: title, company, and date are required
			if (!title || !company || !date) {
				return new Response(
					JSON.stringify({ error: 'Title, company, and date are required.' }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}

			const tags = tagsStr
				? tagsStr.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
				: [];

			// Fetch existing doc if updating
			const docRef = db.collection('designs').doc(designId);
			const docSnap = await docRef.get();
			let imageUrl = docSnap.exists ? docSnap.data()?.imageUrl : '';

			// Handle image upload / replacement
			if (imageFile && imageFile.size > 0) {
				const allowedTypes = ['image/webp'];
				if (!allowedTypes.includes(imageFile.type)) {
					return new Response(
						JSON.stringify({ error: 'Image must be a WebP file.' }),
						{ status: 400, headers: { 'Content-Type': 'application/json' } }
					);
				}
				if (imageFile.size > 800 * 1024) {
					return new Response(
						JSON.stringify({ error: 'Image file size must be under 800KB to store in Firestore.' }),
						{ status: 400, headers: { 'Content-Type': 'application/json' } }
					);
				}

				// If updating and the old image was NOT base64, delete it from storage
				if (imageUrl && !imageUrl.startsWith('data:')) {
					await deleteFile(imageUrl, 'uploads/designs');
				}

				// Convert the file buffer to Base64 data URL
				const arrayBuffer = await imageFile.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				imageUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
			}

			if (!imageUrl) {
				return new Response(
					JSON.stringify({ error: 'An image is required for this design project.' }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}

			// Prepare document fields
			const designPayload: Record<string, any> = {
				id: designId,
				title,
				imageUrl,
				company: company.trim(),
				tags,
				date,
			};

			// Save/Merge in Firestore
			await docRef.set(designPayload, { merge: true });

			// Invalidate cache
			clearCache('designs_list');

			return new Response(JSON.stringify({ success: true, design: designPayload }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ error: 'Invalid action specified.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error: any) {
		console.error('Admin designs API error:', error);
		return new Response(
			JSON.stringify({ error: error.message || 'Server error occurred during request.' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
