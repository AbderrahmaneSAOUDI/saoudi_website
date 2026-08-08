import type { APIRoute } from 'astro';
import { clearCache } from '../../lib/server/cache';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import {
	getErrorMessage,
	getFormFile,
	isFormRequest,
	jsonResponse,
} from '../../lib/server/http';
import { deleteFile, saveFile } from '../../lib/server/storage';

const RESUME_DIRECTORY = 'uploads/resume';
const MAX_FILE_BYTES = 800 * 1024;

type UploadedFile = {
	field: 'resumeUrl' | 'previewUrl';
	url: string;
};

export const POST: APIRoute = async ({ locals, request }) => {
	if (!locals.adminEmail) return jsonResponse({ error: 'Unauthorized' }, 401);
	if (!isFormRequest(request)) {
		return jsonResponse({ error: 'Expected a form-encoded request.' }, 415);
	}

	try {
		const formData = await request.formData();
		const resumePdf = getFormFile(formData, 'resumePdf');
		const resumePreview = getFormFile(formData, 'resumePreview');
		if (!resumePdf && !resumePreview) {
			return jsonResponse({ error: 'No files provided' }, 400);
		}

		if (resumePdf) {
			if (resumePdf.type !== 'application/pdf') {
				return jsonResponse({ error: 'Resume must be a PDF file' }, 400);
			}
			if (resumePdf.size > MAX_FILE_BYTES) {
				return jsonResponse({ error: 'PDF must be under 800KB' }, 400);
			}
		}

		if (resumePreview) {
			if (resumePreview.type !== 'image/webp') {
				return jsonResponse({ error: 'Preview must be a WebP image' }, 400);
			}
			if (resumePreview.size > MAX_FILE_BYTES) {
				return jsonResponse({ error: 'Preview image must be under 800KB' }, 400);
			}
		}

		const db = getFirebaseAdminDb();
		const configRef = db.collection('configuration').doc('static_data');
		const uploadTasks: Array<Promise<UploadedFile>> = [];

		if (resumePdf) {
			uploadTasks.push(
				saveFile({
					file: resumePdf,
					destinationDir: RESUME_DIRECTORY,
					localFallbackPath: RESUME_DIRECTORY,
					filename: `resume_${crypto.randomUUID()}.pdf`,
					contentType: resumePdf.type,
				}).then((url) => ({ field: 'resumeUrl', url })),
			);
		}

		if (resumePreview) {
			uploadTasks.push(
				saveFile({
					file: resumePreview,
					destinationDir: RESUME_DIRECTORY,
					localFallbackPath: RESUME_DIRECTORY,
					filename: `resume_preview_${crypto.randomUUID()}.webp`,
					contentType: resumePreview.type,
				}).then((url) => ({ field: 'previewUrl', url })),
			);
		}

		// The existing config read and independent uploads can run concurrently.
		const [configResult, uploadResults] = await Promise.all([
			configRef.get().then(
				(snapshot) => ({ snapshot, error: null }),
				(error: unknown) => ({ snapshot: null, error }),
			),
			Promise.allSettled(uploadTasks),
		]);

		const uploads = uploadResults
			.filter((result): result is PromiseFulfilledResult<UploadedFile> => result.status === 'fulfilled')
			.map((result) => result.value);
		const failedUpload = uploadResults.find(
			(result): result is PromiseRejectedResult => result.status === 'rejected',
		);

		if (configResult.error || failedUpload) {
			await Promise.all(uploads.map(({ url }) => deleteFile(url, RESUME_DIRECTORY)));
			throw configResult.error ?? failedUpload?.reason;
		}

		const previousData = configResult.snapshot?.data() ?? {};
		const updateData = Object.fromEntries(uploads.map(({ field, url }) => [field, url]));

		try {
			await configRef.set(updateData, { merge: true });
		} catch (error) {
			await Promise.all(uploads.map(({ url }) => deleteFile(url, RESUME_DIRECTORY)));
			throw error;
		}

		// The DB now points at the new files, so old objects can be removed safely.
		await Promise.all(
			uploads.map(({ field, url }) => {
				const previousUrl = previousData[field];
				return typeof previousUrl === 'string' &&
					previousUrl &&
					previousUrl !== url &&
					!previousUrl.startsWith('data:')
					? deleteFile(previousUrl, RESUME_DIRECTORY)
					: Promise.resolve();
			}),
		);

		clearCache('resume_config');

		try {
			const { addSystemLog } = await import('../../lib/server/system-logs');
			const updatedFields = uploads.map((u) => (u.field === 'resumeUrl' ? 'PDF' : 'Preview Image')).join(' and ');
			await addSystemLog({
				type: 'content',
				severity: 'info',
				action: 'RESUME_UPDATED',
				title: `Updated resume ${updatedFields}`,
				details: `Uploaded new files to Storage bucket by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'configuration',
				targetDocId: 'static_data',
				changeType: 'update',
			});
		} catch (logErr) {
			console.warn('Could not log resume upload event:', logErr);
		}

		return jsonResponse({
			success: true,
			...Object.fromEntries(uploads.map(({ field, url }) => [field, url])),
		});
	} catch (error) {
		console.error('Resume upload failed:', error);
		return jsonResponse({ error: getErrorMessage(error, 'Resume upload failed') }, 500);
	}
};
