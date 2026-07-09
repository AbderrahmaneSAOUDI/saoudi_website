import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { saveFile, cleanOldExtensions } from '../../lib/server/storage';

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
		let warning = '';

		// 1. Process Resume PDF
		if (resumePdf && resumePdf.size > 0) {
			results.resumeUrl = await saveFile({
				file: resumePdf,
				destinationDir: 'resume',
				filename: 'Abderrahmane_SAOUDI_Resume.pdf',
				contentType: 'application/pdf',
				localFallbackPath: '',
			});
			if (results.resumeUrl.startsWith('/')) {
				warning = 'Wrote files locally as Firebase Storage is not configured/available.';
			}
		}

		// 2. Process Resume Preview Image
		if (resumePreview && resumePreview.size > 0) {
			const extMap: Record<string, string> = {
				'image/jpeg': 'jpg',
				'image/png': 'png',
				'image/webp': 'webp',
			};
			const ext = extMap[resumePreview.type] || 'jpg';
			const filename = `resume_preview.${ext}`;

			// Clean up old preview extensions to prevent stale caches (both in Firebase Storage and locally)
			await cleanOldExtensions({
				baseId: 'resume_preview',
				destinationDir: 'resume',
				localFallbackPath: '',
			});

			// If saving locally, let's also clean up old resume.ext files (which might have been saved by legacy code)
			await cleanOldExtensions({
				baseId: 'resume',
				destinationDir: 'resume',
				localFallbackPath: '',
			});

			results.previewUrl = await saveFile({
				file: resumePreview,
				destinationDir: 'resume',
				filename: filename,
				contentType: resumePreview.type,
				localFallbackPath: '',
			});
			if (results.previewUrl.startsWith('/')) {
				warning = 'Wrote files locally as Firebase Storage is not configured/available.';
			}
		}

		// 3. Update Firestore configuration document 'static_data'
		const updateData: Record<string, string> = {};
		if (results.resumeUrl) updateData.resumeUrl = results.resumeUrl;
		if (results.previewUrl) updateData.previewUrl = results.previewUrl;

		if (Object.keys(updateData).length > 0) {
			try {
				const db = getFirebaseAdminDb();
				await db.collection('configuration').doc('static_data').set(
					updateData,
					{ merge: true }
				);
			} catch (dbErr) {
				console.warn('Could not update Firestore configuration:', dbErr);
			}
		}

		const responseData: Record<string, any> = {
			success: true,
			...results,
		};
		if (warning) {
			responseData.warning = warning;
		}

		return new Response(JSON.stringify(responseData), {
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
