import type { APIRoute } from 'astro';
import { getFirebaseAdminStorage, getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import fs from 'fs';
import path from 'path';

/**
 * POST /admin/admin_resume_upload
 *
 * Handles resume PDF and preview image uploads via multipart form data.
 * Saves files to Firebase Storage and updates the configuration/static_data document.
 * In local development, falls back to saving files directly in the public/ folder
 * if Firebase Storage is not provisioned or fails.
 */
export const POST: APIRoute = async ({ locals, request }) => {
	// Auth guard
	if (!locals.adminEmail) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const formData = await request.formData();
		const resumePdf = formData.get('resumePdf') as File | null;
		const resumePreview = formData.get('resumePreview') as File | null;

		if (!resumePdf && !resumePreview) {
			return new Response(JSON.stringify({ error: 'No files provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Validations
		if (resumePdf && resumePdf.size > 0) {
			if (resumePdf.type !== 'application/pdf') {
				return new Response(JSON.stringify({ error: 'Resume must be a PDF file' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			if (resumePdf.size > 10 * 1024 * 1024) {
				return new Response(JSON.stringify({ error: 'PDF must be under 10MB' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		if (resumePreview && resumePreview.size > 0) {
			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
			if (!allowedTypes.includes(resumePreview.type)) {
				return new Response(JSON.stringify({ error: 'Preview must be a JPEG, PNG, or WebP image' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			if (resumePreview.size > 10 * 1024 * 1024) {
				return new Response(JSON.stringify({ error: 'Preview image must be under 10MB' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		const results: { resumeUrl?: string; previewUrl?: string; warning?: string } = {};
		let storageFailed = false;
		let storageErrorMessage = '';

		try {
			const storage = getFirebaseAdminStorage();
			const bucket = storage.bucket();
			const db = getFirebaseAdminDb();

			// Upload resume PDF
			if (resumePdf && resumePdf.size > 0) {
				const pdfBuffer = Buffer.from(await resumePdf.arrayBuffer());
				const pdfFile = bucket.file('resume/Abderrahmane_SAOUDI_Resume.pdf');

				// Delete old file if exists
				try { await pdfFile.delete(); } catch { /* ignore */ }

				await pdfFile.save(pdfBuffer, {
					metadata: {
						contentType: 'application/pdf',
						cacheControl: 'public, max-age=31536000, immutable',
					},
				});

				await pdfFile.makePublic();
				results.resumeUrl = pdfFile.publicUrl();

				// Update Firestore configuration
				await db.collection('configuration').doc('static_data').set(
					{ resumeUrl: results.resumeUrl },
					{ merge: true }
				);
			}

			// Upload resume preview image
			if (resumePreview && resumePreview.size > 0) {
				const extMap: Record<string, string> = {
					'image/jpeg': 'jpg',
					'image/png': 'png',
					'image/webp': 'webp',
				};
				const ext = extMap[resumePreview.type] || 'jpg';
				const previewBuffer = Buffer.from(await resumePreview.arrayBuffer());
				const previewFile = bucket.file(`resume/resume_preview.${ext}`);

				// Delete old preview files
				for (const oldExt of ['jpg', 'png', 'webp']) {
					try { await bucket.file(`resume/resume_preview.${oldExt}`).delete(); } catch { /* ignore */ }
				}

				await previewFile.save(previewBuffer, {
					metadata: {
						contentType: resumePreview.type,
						cacheControl: 'public, max-age=31536000, immutable',
					},
				});

				await previewFile.makePublic();
				results.previewUrl = previewFile.publicUrl();
			}
		} catch (storageError: any) {
			console.warn('Firebase Storage upload failed:', storageError);
			storageFailed = true;
			storageErrorMessage = storageError.message || String(storageError);
		}

		// Fallback to local writes in local dev environment
		if (storageFailed) {
			if (import.meta.env.DEV) {
				console.log('Firebase Storage failed. Falling back to local public directory writing...');

				if (resumePdf && resumePdf.size > 0) {
					const pdfBuffer = Buffer.from(await resumePdf.arrayBuffer());
					const localPdfPath = path.join(process.cwd(), 'public', 'Abderrahmane_SAOUDI_Resume.pdf');
					fs.writeFileSync(localPdfPath, pdfBuffer);
					results.resumeUrl = '/Abderrahmane_SAOUDI_Resume.pdf';

					try {
						const db = getFirebaseAdminDb();
						await db.collection('configuration').doc('static_data').set(
							{ resumeUrl: results.resumeUrl },
							{ merge: true }
						);
					} catch (dbErr) {
						console.warn('Could not update Firestore config:', dbErr);
					}
				}

				if (resumePreview && resumePreview.size > 0) {
					const previewBuffer = Buffer.from(await resumePreview.arrayBuffer());
					const localPreviewPath = path.join(process.cwd(), 'public', 'resume.jpg');
					fs.writeFileSync(localPreviewPath, previewBuffer);
					results.previewUrl = '/resume.jpg';
				}

				return new Response(JSON.stringify({
					success: true,
					...results,
					warning: 'Wrote files locally as Firebase Storage is not configured/available.',
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			} else {
				return new Response(JSON.stringify({
					error: `Upload failed: ${storageErrorMessage}. Make sure Firebase Storage is enabled in the console.`,
				}), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		return new Response(JSON.stringify({
			success: true,
			...results,
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error: any) {
		console.error('Resume upload endpoint error:', error);
		return new Response(JSON.stringify({
			error: error.message || 'Upload failed. Please try again.',
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
