import type { APIRoute } from 'astro';
import { getFirebaseAdminDb, getFirebaseAdminStorage } from '../../lib/server/firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

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
		const action = formData.get('action') as string; // 'save' or 'delete'
		const designId = formData.get('id') as string;

		if (!designId) {
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
				await deleteImageFile(imageUrl);
			}

			// 2. Delete Firestore document
			await docRef.delete();

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// ─── ACTION: SAVE (CREATE OR UPDATE) ─────────────────────────────────
		if (action === 'save') {
			const title = formData.get('title') as string;
			const description = formData.get('description') as string;
			const category = formData.get('category') as string;
			const figmaUrl = formData.get('figmaUrl') as string | null;
			const date = formData.get('date') as string;
			const orderStr = formData.get('order') as string;
			const tagsStr = formData.get('tags') as string;
			const imageFile = formData.get('image') as File | null;

			// Server validation
			if (!title || !description || !category || !date) {
				return new Response(
					JSON.stringify({ error: 'Title, description, category, and date are required.' }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}

			const order = orderStr ? parseInt(orderStr, 10) : 0;
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
					await deleteImageFile(imageUrl);
				}

				// Upload/save new image
				imageUrl = await saveImageFile(designId, imageFile);
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
				order,
				title,
				description,
				imageUrl,
				category,
				tags,
				date,
			};

			if (figmaUrl && figmaUrl.trim().length > 0) {
				designPayload.figmaUrl = figmaUrl.trim();
			} else {
				// Delete field / store null
				designPayload.figmaUrl = null;
			}

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

// ─── Helper Functions ──────────────────────────────────────────────────

async function saveImageFile(designId: string, file: File): Promise<string> {
	const extMap: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
	};
	const ext = extMap[file.type] || 'jpg';
	const filename = `${designId}.${ext}`;

	try {
		const storage = getFirebaseAdminStorage();
		const bucket = storage.bucket();
		const storagePath = `designs/${filename}`;
		const storageFile = bucket.file(storagePath);
		const buffer = Buffer.from(await file.arrayBuffer());

		// Delete old files from bucket to keep storage clean
		for (const oldExt of ['jpg', 'png', 'webp']) {
			try {
				await bucket.file(`designs/${designId}.${oldExt}`).delete();
			} catch {
				/* ignore */
			}
		}

		await storageFile.save(buffer, {
			metadata: {
				contentType: file.type,
				cacheControl: 'public, max-age=31536000, immutable',
			},
		});

		await storageFile.makePublic();
		return storageFile.publicUrl();
	} catch (error) {
		console.warn('Firebase Storage upload failed; writing file locally to public/uploads/designs/...', error);

		// Fallback: Local directory
		const localDir = path.join(process.cwd(), 'public', 'uploads', 'designs');
		if (!fs.existsSync(localDir)) {
			fs.mkdirSync(localDir, { recursive: true });
		}
		
		// Clean up old local extensions
		for (const oldExt of ['jpg', 'png', 'webp']) {
			try {
				fs.unlinkSync(path.join(localDir, `${designId}.${oldExt}`));
			} catch {
				/* ignore */
			}
		}

		const localPath = path.join(localDir, filename);
		const buffer = Buffer.from(await file.arrayBuffer());
		fs.writeFileSync(localPath, buffer);

		return `/uploads/designs/${filename}`;
	}
}

async function deleteImageFile(url: string) {
	try {
		if (url.startsWith('/uploads/designs/')) {
			// Local fallback deletion
			const filename = url.replace('/uploads/designs/', '');
			const localPath = path.join(process.cwd(), 'public', 'uploads', 'designs', filename);
			if (fs.existsSync(localPath)) {
				fs.unlinkSync(localPath);
			}
		} else {
			// Firebase Storage deletion
			const storage = getFirebaseAdminStorage();
			const bucket = storage.bucket();

			let storagePath = '';
			if (url.includes('/o/')) {
				const match = url.match(/\/o\/([^?]+)/);
				if (match && match[1]) {
					storagePath = decodeURIComponent(match[1]);
				}
			} else if (url.includes('storage.googleapis.com')) {
				// Parse path after bucket name
				const parts = url.split('/');
				const bucketIndex = parts.findIndex(p => p.includes('storage.googleapis.com') || p.includes('appspot.com'));
				if (bucketIndex !== -1 && parts.length > bucketIndex + 1) {
					storagePath = parts.slice(bucketIndex + 2).join('/'); // skip bucket name part
				} else {
					storagePath = parts.slice(4).join('/'); // default fallback
				}
			}

			if (storagePath) {
				const file = bucket.file(storagePath);
				await file.delete();
			}
		}
	} catch (error) {
		console.warn('Failed to delete image file:', url, error);
	}
}
