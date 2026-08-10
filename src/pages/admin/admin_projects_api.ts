import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
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

const PROJECTS_DIRECTORY = 'uploads/projects';
const MAX_IMAGE_BYTES = 800 * 1024;

function invalidateProjectCaches(countChanged: boolean): void {
	clearCache('projects_list');
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
		const projectId = getFormString(formData, 'id').trim();
		if (!projectId) return jsonResponse({ error: 'Missing Project ID' }, 400);

		const db = getFirebaseAdminDb();
		const docRef = db.collection('projects').doc(projectId);

		if (action === 'delete') {
			const ownerErr = validateOwnerPermission(locals.adminEmail);
			if (ownerErr) return ownerErr;

			const docSnap = await docRef.get();
			if (!docSnap.exists) return jsonResponse({ error: 'Project not found' }, 404);

			const deletedTitle = docSnap.data()?.title || projectId;
			const imageUrl = docSnap.data()?.imageUrl;
			await docRef.delete();
			if (typeof imageUrl === 'string' && !imageUrl.startsWith('data:')) {
				await deleteFile(imageUrl, PROJECTS_DIRECTORY);
			}

			invalidateProjectCaches(true);

			await safeSystemLog({
				type: 'content',
				severity: 'warn',
				action: 'PROJECT_DELETED',
				title: `Removed project card: "${deletedTitle}"`,
				details: `Project card permanently deleted by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'projects',
				targetDocId: projectId,
				changeType: 'delete',
			});

			return jsonResponse({ success: true });
		}

		if (action === 'save_fields') {
			const fieldsJson = getFormString(formData, 'fields');
			if (!fieldsJson) {
				return jsonResponse({ error: 'Fields list is required.' }, 400);
			}

			let fields: string[];
			try {
				const parsedFields: unknown = JSON.parse(fieldsJson);
				if (!Array.isArray(parsedFields) || !parsedFields.every((value) => typeof value === 'string')) {
					return jsonResponse({ error: 'Fields must be an array of strings.' }, 400);
				}
				fields = [...new Set(parsedFields.map((value) => value.trim()).filter(Boolean))];
			} catch {
				return jsonResponse({ error: 'Invalid JSON in fields.' }, 400);
			}

			await db.collection('configuration').doc('projects_fields').set({ fields });
			invalidateProjectCaches(false);

			await safeSystemLog({
				type: 'content',
				severity: 'info',
				action: 'PROJECT_FIELDS_UPDATED',
				title: 'Updated project category fields list',
				details: `Fields: ${fields.join(', ')}`,
				userEmail: locals.adminEmail,
			});

			return jsonResponse({ success: true });
		}

		if (action === 'save') {
			const title = getFormString(formData, 'title').trim();
			const field = getFormString(formData, 'field').trim();
			const description = getFormString(formData, 'description').trim();
			const date = getFormString(formData, 'date').trim();
			const projectUrl = getFormString(formData, 'projectUrl').trim();
			const githubUrl = getFormString(formData, 'githubUrl').trim();
			const rawTechnologies = getFormString(formData, 'technologies').trim();
			const rawBlocks = getFormString(formData, 'blocks').trim();
			const imageFile = getFormFile(formData, 'image');

			if (!title) {
				return jsonResponse({ error: 'Project title is required.' }, 400);
			}

			let technologies: string[] = [];
			if (rawTechnologies) {
				try {
					if (rawTechnologies.startsWith('[')) {
						technologies = JSON.parse(rawTechnologies);
					} else {
						technologies = rawTechnologies.split(',').map(t => t.trim()).filter(Boolean);
					}
				} catch {
					technologies = rawTechnologies.split(',').map(t => t.trim()).filter(Boolean);
				}
			}

			let blocks: any[] = [];
			if (rawBlocks) {
				try {
					blocks = JSON.parse(rawBlocks);
				} catch (e) {
					console.warn('Failed to parse project blocks payload:', e);
				}
			}

			const docSnap = await docRef.get();
			const existingData = docSnap.data() ?? {};
			const previousImageUrl = existingData.imageUrl;
			let imageUrl = typeof previousImageUrl === 'string' ? previousImageUrl : '';
			let uploadedImageUrl: string | undefined;

			if (imageFile) {
				const imageErr = validateWebpImage(imageFile, MAX_IMAGE_BYTES);
				if (imageErr) return imageErr;

				uploadedImageUrl = await saveFile({
					file: imageFile,
					destinationDir: PROJECTS_DIRECTORY,
					localFallbackPath: PROJECTS_DIRECTORY,
					filename: `project_${crypto.randomUUID()}.webp`,
					contentType: imageFile.type,
				});
				imageUrl = uploadedImageUrl;
			}

			const project = {
				id: projectId,
				title,
				field: field || 'Web Development',
				description: description || '',
				imageUrl,
				projectUrl: projectUrl || '',
				githubUrl: githubUrl || '',
				date: date || new Date().toISOString().substring(0, 7),
				technologies,
				blocks: Array.isArray(blocks) && blocks.length > 0 ? blocks : (existingData.blocks || []),
				featured: existingData.featured ?? false,
				order: existingData.order ?? 0,
			};

			const projectPayload: Record<string, unknown> = { ...project };

			try {
				await docRef.set(projectPayload, { merge: true });
			} catch (error) {
				if (uploadedImageUrl) await deleteFile(uploadedImageUrl, PROJECTS_DIRECTORY);
				throw error;
			}

			if (
				uploadedImageUrl &&
				typeof previousImageUrl === 'string' &&
				previousImageUrl &&
				!previousImageUrl.startsWith('data:')
			) {
				await deleteFile(previousImageUrl, PROJECTS_DIRECTORY);
			}

			const isNewProject = !docSnap.exists;
			invalidateProjectCaches(isNewProject);

			await safeSystemLog({
				type: 'content',
				severity: 'info',
				action: isNewProject ? 'PROJECT_CREATED' : 'PROJECT_UPDATED',
				title: `${isNewProject ? 'Added new' : 'Updated'} project card: "${title}"`,
				details: `Field: ${field || 'Web Development'}, Techs: ${technologies.join(', ') || 'N/A'}`,
				userEmail: locals.adminEmail,
				targetCollection: 'projects',
				targetDocId: projectId,
				changeType: isNewProject ? 'create' : 'update',
			});

			return jsonResponse({ success: true, project });
		}

		return jsonResponse({ error: 'Invalid action specified.' }, 400);
	} catch (error) {
		console.error('Admin projects API error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Server error occurred during request.') },
			500,
		);
	}
};
