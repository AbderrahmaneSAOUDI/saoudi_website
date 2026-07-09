import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { saveFile, deleteFile, cleanOldExtensions } from '../../lib/server/storage';

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
			if (imageUrl) {
				await deleteFile(imageUrl, 'uploads/designs');
			}

			// 2. Delete Firestore document
			await docRef.delete();

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

			const companiesList = JSON.parse(companiesListJson) as string[];
			const renames = renamesJson ? JSON.parse(renamesJson) as Record<string, string> : {};

			// 1. Update the configuration document
			const configRef = db.collection('configuration').doc('designs_companies');
			await configRef.set({ companies: companiesList });

			// 2. Perform company renames in designs collection
			const renameKeys = Object.keys(renames);
			if (renameKeys.length > 0) {
				const batch = db.batch();
				let hasUpdates = false;

				for (const oldComp of renameKeys) {
					const newComp = renames[oldComp];
					if (oldComp.trim() !== newComp.trim()) {
						const snapshot = await db.collection('designs').where('company', '==', oldComp.trim()).get();
						snapshot.docs.forEach(doc => {
							batch.update(doc.ref, { company: newComp.trim() });
							hasUpdates = true;
						});
					}
				}

				if (hasUpdates) {
					await batch.commit();
				}
			}

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
				const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
				if (!allowedTypes.includes(imageFile.type)) {
					return new Response(
						JSON.stringify({ error: 'Image must be a JPEG, PNG, or WebP file.' }),
						{ status: 400, headers: { 'Content-Type': 'application/json' } }
					);
				}
				if (imageFile.size > 10 * 1024 * 1024) {
					return new Response(
						JSON.stringify({ error: 'Image file size must be under 10MB.' }),
						{ status: 400, headers: { 'Content-Type': 'application/json' } }
					);
				}

				// If updating, delete the old image file first
				if (imageUrl) {
					await deleteFile(imageUrl, 'uploads/designs');
				}

				// Upload/save new image
				const extMap: Record<string, string> = {
					'image/jpeg': 'jpg',
					'image/png': 'png',
					'image/webp': 'webp',
				};
				const ext = extMap[imageFile.type] || 'jpg';
				const filename = `${designId}.${ext}`;

				// Clean up old extension variations first (jpg, png, webp)
				await cleanOldExtensions({
					baseId: designId,
					destinationDir: 'designs',
					localFallbackPath: 'uploads/designs',
				});

				imageUrl = await saveFile({
					file: imageFile,
					destinationDir: 'designs',
					filename,
					contentType: imageFile.type,
					localFallbackPath: 'uploads/designs',
				});
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
