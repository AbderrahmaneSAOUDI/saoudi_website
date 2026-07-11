import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';


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
			if (resumePdf.size > 800 * 1024) {
				return new Response(JSON.stringify({ error: 'PDF must be under 800KB to store in Firestore' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		if (resumePreview && resumePreview.size > 0) {
			const allowedTypes = ['image/webp'];
			if (!allowedTypes.includes(resumePreview.type)) {
				return new Response(JSON.stringify({ error: 'Preview must be a WebP image' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			if (resumePreview.size > 800 * 1024) {
				return new Response(JSON.stringify({ error: 'Preview image must be under 800KB to store in Firestore' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		const results: { resumeUrl?: string; previewUrl?: string; warning?: string } = {};

		// 1. Process Resume PDF
		if (resumePdf && resumePdf.size > 0) {
			const arrayBuffer = await resumePdf.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			results.resumeUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
		}

		// 2. Process Resume Preview Image
		if (resumePreview && resumePreview.size > 0) {
			const arrayBuffer = await resumePreview.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			results.previewUrl = `data:${resumePreview.type};base64,${buffer.toString('base64')}`;
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
