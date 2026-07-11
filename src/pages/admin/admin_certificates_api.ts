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
		const action = formData.get('action') as string; // 'save' or 'delete'
		const certificateId = formData.get('id') as string;

		if (!certificateId) {
			return new Response(JSON.stringify({ error: 'Missing Certificate ID' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const db = getFirebaseAdminDb();

		// ─── ACTION: DELETE ───────────────────────────────────────────────────
		if (action === 'delete') {
			const docRef = db.collection('certificates').doc(certificateId);
			const docSnap = await docRef.get();

			if (!docSnap.exists) {
				return new Response(JSON.stringify({ error: 'Certificate not found' }), {
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			const certData = docSnap.data();
			const imageUrl = certData?.imageUrl as string | undefined;

			// Delete storage/local image file first if it exists
			if (imageUrl && !imageUrl.startsWith('data:')) {
				await deleteFile(imageUrl, 'uploads/certificates');
			}

			// Delete Firestore document
			await docRef.delete();

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// ─── ACTION: SAVE (CREATE OR UPDATE) ─────────────────────────────────
		if (action === 'save') {
			const title = formData.get('title') as string;
			const issuer = formData.get('issuer') as string;
			const date = formData.get('date') as string;
			const credentialUrl = formData.get('credentialUrl') as string;
			const imageFile = formData.get('image') as File | null;

			// Server validation: title, issuer, and date are required
			if (!title || !issuer || !date) {
				return new Response(
					JSON.stringify({ error: 'Title, issuer, and date are required.' }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}

			const docRef = db.collection('certificates').doc(certificateId);
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
						JSON.stringify({ error: 'Image file size must be under 800KB.' }),
						{ status: 400, headers: { 'Content-Type': 'application/json' } }
					);
				}

				// If updating and the old image was NOT base64, delete it
				if (imageUrl && !imageUrl.startsWith('data:')) {
					await deleteFile(imageUrl, 'uploads/certificates');
				}

				// Clean up old variations of the file with other extensions
				await cleanOldExtensions({
					baseId: certificateId,
					destinationDir: 'uploads/certificates',
					localFallbackPath: 'uploads/certificates',
				});

				// Save file to Storage
				imageUrl = await saveFile({
					file: imageFile,
					destinationDir: 'uploads/certificates',
					filename: `${certificateId}.webp`,
					contentType: 'image/webp',
					localFallbackPath: 'uploads/certificates',
				});
			}

			// Prepare document fields
			const certificatePayload: Record<string, any> = {
				id: certificateId,
				title: title.trim(),
				issuer: issuer.trim(),
				date: date.trim(),
			};

			if (credentialUrl && credentialUrl.trim() !== '') {
				certificatePayload.credentialUrl = credentialUrl.trim();
			} else {
				certificatePayload.credentialUrl = null;
			}

			// Explicitly set credentialId to null to clean up existing Firestore entries if they exist
			certificatePayload.credentialId = null;

			// Also handle period removal for existing docs
			certificatePayload.period = null;

			// Explicitly set order to null to clean up existing Firestore entries
			certificatePayload.order = null;

			if (imageUrl) {
				certificatePayload.imageUrl = imageUrl;
			} else {
				certificatePayload.imageUrl = null;
			}

			// Save/Merge in Firestore
			await docRef.set(certificatePayload, { merge: true });

			return new Response(JSON.stringify({ success: true, certificate: certificatePayload }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ error: 'Invalid action specified.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error: any) {
		console.error('Admin certificates API error:', error);
		return new Response(
			JSON.stringify({ error: error.message || 'Server error occurred during request.' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
