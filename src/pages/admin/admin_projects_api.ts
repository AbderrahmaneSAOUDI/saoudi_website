import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import { getPublicMediaUrl } from '../../lib/media';
import {
	getErrorMessage,
	getFormFile,
	getFormString,
	jsonResponse,
} from '../../lib/server/http';
import { deleteFile, persistInlineDataUrl, saveFile } from '../../lib/server/storage';
import {
	isSafePublicUrl,
	safeSystemLog,
	validateAdminSession,
	validateFormRequest,
	validateOwnerPermission,
	validateOptionalPublicUrl,
	validateWebpImage,
} from '../../lib/server/api-guards';

const PROJECTS_DIRECTORY = 'uploads/projects';
const MAX_BLOCKS = 40;
const MAX_BLOCK_IMAGES = 30;
const DEFAULT_PROJECT_FIELDS = ['Web Development', 'Mobile App', 'UI/UX Design', 'Full-Stack', 'AI / ML'];

type ProjectBlock = Record<string, any>;

class ProjectSaveConflictError extends Error {}

function getConfiguredStrings(value: unknown, fallback: string[]): string[] {
	if (!Array.isArray(value)) return fallback;
	return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function readString(value: unknown, maxLength: number): string | null {
	return typeof value === 'string' && value.length <= maxLength ? value : null;
}

function isSafeImageReference(value: string): boolean {
	return /^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/=\r\n]+$/i.test(value) || isSafePublicUrl(value);
}

function normalizeProjectBlocks(input: unknown[]): { blocks?: ProjectBlock[]; error?: string } {
	if (input.length > MAX_BLOCKS) return { error: `Projects support at most ${MAX_BLOCKS} content blocks.` };
	let imageCount = 0;
	const blocks: ProjectBlock[] = [];
	const blockIds = new Set<string>();

	for (const rawBlock of input) {
		if (!rawBlock || typeof rawBlock !== 'object' || Array.isArray(rawBlock)) {
			return { error: 'Every project block must be an object.' };
		}
		const source = rawBlock as Record<string, unknown>;
		const type = readString(source.type, 40);
		const id = readString(source.id, 100) || crypto.randomUUID();
		if (!type) return { error: 'Every project block requires a valid type.' };
		if (blockIds.has(id)) return { error: 'Project block IDs must be unique.' };
		blockIds.add(id);

		switch (type) {
			case 'heading': {
				const text = readString(source.text, 500);
				const level = Number(source.level);
				if (text === null || !Number.isInteger(level) || level < 1 || level > 6) return { error: 'Invalid heading block.' };
				blocks.push({ id, type, level, text });
				break;
			}
			case 'rich_text': {
				const content = readString(source.content, 20_000);
				if (content === null) return { error: 'Invalid rich text block.' };
				blocks.push({ id, type, content });
				break;
			}
			case 'callout': {
				const title = readString(source.title, 500);
				const text = readString(source.text, 5_000);
				const variant = readString(source.variant, 20);
				if (title === null || text === null || !variant || !['info', 'success', 'warning', 'error'].includes(variant)) return { error: 'Invalid callout block.' };
				blocks.push({ id, type, variant, title, text });
				break;
			}
			case 'list': {
				const listType = readString(source.listType, 20);
				if (!Array.isArray(source.items) || source.items.length > 100 || !source.items.every(item => readString(item, 1_000) !== null) || !listType || !['bullet', 'number'].includes(listType)) return { error: 'Invalid list block.' };
				blocks.push({ id, type, listType, items: source.items });
				break;
			}
			case 'single_image': {
				const imageUrl = readString(source.imageUrl, 1_000_000);
				if (imageUrl === null || (imageUrl && !isSafeImageReference(imageUrl))) return { error: 'Invalid project block image.' };
				if (imageUrl) imageCount++;
				blocks.push({ id, type, imageUrl });
				break;
			}
			case 'carousel': {
				if (!Array.isArray(source.images) || source.images.length > 20 || !source.images.every(image => typeof image === 'string' && image.length <= 1_000_000 && isSafeImageReference(image))) return { error: 'Invalid carousel block.' };
				imageCount += source.images.length;
				blocks.push({ id, type, images: source.images });
				break;
			}
			case 'metrics_grid': {
				if (!Array.isArray(source.items) || source.items.length > 20) return { error: 'Invalid metrics block.' };
				const items = source.items.map(item => item && typeof item === 'object' ? {
					label: readString((item as Record<string, unknown>).label, 200),
					value: readString((item as Record<string, unknown>).value, 200),
				} : null);
				if (items.some(item => !item || item.label === null || item.value === null)) return { error: 'Invalid metric item.' };
				blocks.push({ id, type, items });
				break;
			}
			case 'action_buttons': {
				if (!Array.isArray(source.buttons) || source.buttons.length > 10) return { error: 'Invalid action buttons block.' };
				const buttons = source.buttons.map(button => button && typeof button === 'object' ? {
					label: readString((button as Record<string, unknown>).label, 200),
					url: readString((button as Record<string, unknown>).url, 2_000),
				} : null);
				if (buttons.some(button => !button || button.label === null || button.url === null || !isSafePublicUrl(button.url))) return { error: 'Invalid project action button.' };
				blocks.push({ id, type, buttons });
				break;
			}
			default:
				return { error: `Unsupported project block type: ${type}` };
		}
	}

	if (imageCount > MAX_BLOCK_IMAGES) return { error: `Projects support at most ${MAX_BLOCK_IMAGES} block images.` };
	return { blocks };
}

function getBlockMediaUrls(blocks: unknown): string[] {
	if (!Array.isArray(blocks)) return [];
	const urls: string[] = [];
	for (const block of blocks) {
		if (!block || typeof block !== 'object') continue;
		if (block.type === 'single_image' && typeof block.imageUrl === 'string') urls.push(block.imageUrl);
		if (block.type === 'carousel' && Array.isArray(block.images)) {
			urls.push(...block.images.filter((image: unknown): image is string => typeof image === 'string'));
		}
	}
	return urls;
}

function getBlockMediaOwnerKey(projectId: string): string {
	return `${PROJECTS_DIRECTORY}/project:${projectId}`;
}

function getBlockMediaObjectIds(blocks: unknown): string[] {
	return [...new Set(
		getBlockMediaUrls(blocks)
			.filter(url => url.startsWith('/api/media-object/'))
			.map(url => url.slice('/api/media-object/'.length)),
	)];
}

async function blockMediaBelongsToProject(blocks: ProjectBlock[], projectId: string): Promise<boolean> {
	const ids = getBlockMediaObjectIds(blocks);
	if (ids.some(id => !/^[0-9a-f-]{36}$/i.test(id))) return false;
	const ownerKey = getBlockMediaOwnerKey(projectId);
	const snapshots = await Promise.all(
		ids.map(id => getFirebaseAdminDb().collection('media_objects').doc(id).get()),
	);
	return snapshots.every(snapshot => {
		const data = snapshot.data();
		return snapshot.exists && data?.directory === PROJECTS_DIRECTORY && data?.ownerKey === ownerKey;
	});
}

async function deleteUnreferencedProjectMedia(urls: string[], projectId: string): Promise<void> {
	const ids = [...new Set(
		urls
			.filter(url => url.startsWith('/api/media-object/'))
			.map(url => url.slice('/api/media-object/'.length))
			.filter(id => /^[0-9a-f-]{36}$/i.test(id)),
	)];
	if (ids.length === 0) return;

	const db = getFirebaseAdminDb();
	const projectRef = db.collection('projects').doc(projectId);
	const ownerKey = getBlockMediaOwnerKey(projectId);
	try {
		await db.runTransaction(async transaction => {
			const currentProject = await transaction.get(projectRef);
			const retainedIds = new Set(getBlockMediaObjectIds(currentProject.data()?.blocks));
			const candidateRefs = ids
				.filter(id => !retainedIds.has(id))
				.map(id => db.collection('media_objects').doc(id));
			const mediaSnapshots = await Promise.all(candidateRefs.map(ref => transaction.get(ref)));
			for (const snapshot of mediaSnapshots) {
				const data = snapshot.data();
				if (snapshot.exists && data?.directory === PROJECTS_DIRECTORY && data?.ownerKey === ownerKey) {
					transaction.delete(snapshot.ref);
				}
			}
		});
	} catch (error) {
		// A failed cleanup leaves an orphaned object, which is safer than deleting
		// media that a concurrent edit still references.
		console.warn('Failed to clean up unreferenced project media:', error);
	}
}

async function persistBlockMedia(
	blocks: ProjectBlock[],
	projectId: string,
): Promise<{ blocks: ProjectBlock[]; createdUrls: string[] }> {
	const createdUrls: string[] = [];
	const ownerKey = getBlockMediaOwnerKey(projectId);
	try {
		for (const block of blocks) {
			if (block.type === 'single_image' && typeof block.imageUrl === 'string' && block.imageUrl.startsWith('data:')) {
				block.imageUrl = await persistInlineDataUrl(block.imageUrl, PROJECTS_DIRECTORY, ownerKey);
				createdUrls.push(block.imageUrl);
			}
			if (block.type === 'carousel' && Array.isArray(block.images)) {
				for (let index = 0; index < block.images.length; index++) {
					if (block.images[index].startsWith('data:')) {
						block.images[index] = await persistInlineDataUrl(block.images[index], PROJECTS_DIRECTORY, ownerKey);
						createdUrls.push(block.images[index]);
					}
				}
			}
		}
		return { blocks, createdUrls };
	} catch (error) {
		await Promise.all(createdUrls.map(url => deleteFile(url, PROJECTS_DIRECTORY, ownerKey)));
		throw error;
	}
}

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
		if (action !== 'save_fields' && !projectId) {
			return jsonResponse({ error: 'Missing Project ID' }, 400);
		}

		const db = getFirebaseAdminDb();

		if (action === 'delete') {
			const docRef = db.collection('projects').doc(projectId);
			const ownerErr = validateOwnerPermission(locals.adminEmail);
			if (ownerErr) return ownerErr;

			const docSnap = await docRef.get();
			if (!docSnap.exists) return jsonResponse({ error: 'Project not found' }, 404);

			const deletedTitle = docSnap.data()?.title || projectId;
			const imageUrl = docSnap.data()?.imageUrl;
			const blockMediaUrls = getBlockMediaUrls(docSnap.data()?.blocks).filter(url => url.startsWith('/api/media-object/'));
			await docRef.delete();
			if (typeof imageUrl === 'string' && !imageUrl.startsWith('data:')) {
				await deleteFile(imageUrl, PROJECTS_DIRECTORY);
			}
			await deleteUnreferencedProjectMedia(blockMediaUrls, projectId);

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
				if (fields.length === 0) {
					return jsonResponse({ error: 'At least one project field is required.' }, 400);
				}
				if (fields.length > 100 || fields.some(field => field.length > 100)) {
					return jsonResponse({ error: 'Project fields exceed the supported limit.' }, 400);
				}
			} catch {
				return jsonResponse({ error: 'Invalid JSON in fields.' }, 400);
			}

			const fieldsRef = db.collection('configuration').doc('projects_fields');
			try {
				await db.runTransaction(async transaction => {
					const projectsSnapshot = await transaction.get(db.collection('projects').select('field'));
					const removedUsedFields = [...new Set(
						projectsSnapshot.docs
							.map(doc => doc.data().field)
							.filter((field): field is string => typeof field === 'string' && field.length > 0 && !fields.includes(field)),
					)];
					if (removedUsedFields.length > 0) {
						throw new ProjectSaveConflictError(
							`These fields are still used by projects: ${removedUsedFields.join(', ')}. Reassign those projects first.`,
						);
					}
					transaction.set(fieldsRef, { fields });
				});
			} catch (error) {
				if (error instanceof ProjectSaveConflictError) {
					return jsonResponse({ error: error.message }, 409);
				}
				throw error;
			}
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
			const docRef = db.collection('projects').doc(projectId);
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
			const projectUrlErr = validateOptionalPublicUrl(projectUrl, 'Project URL');
			if (projectUrlErr) return projectUrlErr;
			const githubUrlErr = validateOptionalPublicUrl(githubUrl, 'GitHub URL');
			if (githubUrlErr) return githubUrlErr;

			let technologies: string[] = [];
			if (rawTechnologies) {
				if (rawTechnologies.startsWith('[')) {
					try {
						const parsedTechnologies: unknown = JSON.parse(rawTechnologies);
						if (!Array.isArray(parsedTechnologies) || !parsedTechnologies.every((value) => typeof value === 'string')) {
							return jsonResponse({ error: 'Technologies must be an array of strings.' }, 400);
						}
						technologies = parsedTechnologies;
					} catch {
						return jsonResponse({ error: 'Invalid JSON in technologies.' }, 400);
					}
				} else {
					technologies = rawTechnologies.split(',');
				}
				technologies = [...new Set(technologies.map((value) => value.trim()).filter(Boolean))];
				if (technologies.length > 50 || technologies.some((value) => value.length > 80)) {
					return jsonResponse({ error: 'Technologies exceed the supported limit.' }, 400);
				}
			}

			let blocks: ProjectBlock[] | undefined;
			if (rawBlocks) {
				try {
					const parsedBlocks: unknown = JSON.parse(rawBlocks);
					if (!Array.isArray(parsedBlocks)) {
						return jsonResponse({ error: 'Project blocks must be an array.' }, 400);
					}
					const normalized = normalizeProjectBlocks(parsedBlocks);
					if (normalized.error) return jsonResponse({ error: normalized.error }, 400);
					blocks = normalized.blocks;
				} catch {
					return jsonResponse({ error: 'Invalid JSON in project blocks.' }, 400);
				}
			}
			if (blocks) {
				for (const block of blocks) {
					if (!block || typeof block !== 'object' || block.type !== 'action_buttons' || !Array.isArray(block.buttons)) continue;
					for (const button of block.buttons) {
						const url = button && typeof button.url === 'string' ? button.url.trim() : '';
						const urlErr = validateOptionalPublicUrl(url, 'Project action URL');
						if (urlErr) return urlErr;
					}
				}
			}
			if (imageFile) {
				const imageErr = validateWebpImage(imageFile);
				if (imageErr) return imageErr;
			}

			const fieldsRef = db.collection('configuration').doc('projects_fields');
			const [docSnap, fieldsSnapshot] = await Promise.all([docRef.get(), fieldsRef.get()]);
			const existingData = docSnap.data() ?? {};
			const allowedFields = getConfiguredStrings(fieldsSnapshot.data()?.fields, DEFAULT_PROJECT_FIELDS);
			const resolvedField = field || String(existingData.field || DEFAULT_PROJECT_FIELDS[0]);
			if (!allowedFields.includes(resolvedField)) {
				return jsonResponse({ error: 'Select a project field from the current configured list.' }, 409);
			}
			let uploadedBlockMediaUrls: string[] = [];
			if (blocks) {
				if (!await blockMediaBelongsToProject(blocks, projectId)) {
					return jsonResponse({ error: 'A project block references media owned by another record.' }, 400);
				}
				const persisted = await persistBlockMedia(blocks, projectId);
				blocks = persisted.blocks;
				uploadedBlockMediaUrls = persisted.createdUrls;
				if (Buffer.byteLength(JSON.stringify(blocks), 'utf8') > 700 * 1024) {
					await Promise.all(uploadedBlockMediaUrls.map(url => deleteFile(url, PROJECTS_DIRECTORY, getBlockMediaOwnerKey(projectId))));
					return jsonResponse({ error: 'Project content blocks are too large.' }, 400);
				}
			}
			const previousImageUrl = existingData.imageUrl;
			let imageUrl = typeof previousImageUrl === 'string' ? previousImageUrl : '';
			let uploadedImageUrl: string | undefined;

			if (imageFile) {
				try {
					uploadedImageUrl = await saveFile({
						file: imageFile,
						destinationDir: PROJECTS_DIRECTORY,
						localFallbackPath: PROJECTS_DIRECTORY,
						filename: `project_${crypto.randomUUID()}.webp`,
						contentType: imageFile.type,
					});
				} catch (error) {
					await Promise.all(uploadedBlockMediaUrls.map(url => deleteFile(url, PROJECTS_DIRECTORY, getBlockMediaOwnerKey(projectId))));
					throw error;
				}
				imageUrl = uploadedImageUrl;
			}

			const project = {
				id: projectId,
				title,
				field: resolvedField,
				description: formData.has('description') ? description : String(existingData.description || ''),
				imageUrl,
				projectUrl: projectUrl || '',
				githubUrl: githubUrl || '',
				date: date || new Date().toISOString().substring(0, 7),
				technologies,
				// An explicitly submitted empty array means the editor cleared all blocks.
				blocks: blocks ?? (Array.isArray(existingData.blocks) ? existingData.blocks : []),
				featured: existingData.featured ?? false,
				order: existingData.order ?? 0,
			};

			const projectPayload: Record<string, unknown> = { ...project };

			try {
				await db.runTransaction(async transaction => {
					const mediaRefs = getBlockMediaObjectIds(project.blocks)
						.map(id => db.collection('media_objects').doc(id));
					const [currentFieldsSnapshot, ...mediaSnapshots] = await Promise.all([
						transaction.get(fieldsRef),
						...mediaRefs.map(ref => transaction.get(ref)),
					]);
					const currentFields = getConfiguredStrings(currentFieldsSnapshot.data()?.fields, DEFAULT_PROJECT_FIELDS);
					if (!currentFields.includes(resolvedField)) {
						throw new ProjectSaveConflictError('The selected project field is no longer available.');
					}
					const ownerKey = getBlockMediaOwnerKey(projectId);
					if (mediaSnapshots.some(snapshot => {
						const data = snapshot.data();
						return !snapshot.exists || data?.directory !== PROJECTS_DIRECTORY || data?.ownerKey !== ownerKey;
					})) {
						throw new ProjectSaveConflictError('Project media changed during this edit. Reload and try again.');
					}
					// Serialize field-list edits with project saves to prevent write skew.
					transaction.set(fieldsRef, { fields: currentFields }, { merge: true });
					transaction.set(docRef, projectPayload, { merge: true });
				});
			} catch (error) {
				if (uploadedImageUrl) await deleteFile(uploadedImageUrl, PROJECTS_DIRECTORY);
				await Promise.all(uploadedBlockMediaUrls.map(url => deleteFile(url, PROJECTS_DIRECTORY, getBlockMediaOwnerKey(projectId))));
				if (error instanceof ProjectSaveConflictError) {
					return jsonResponse({ error: error.message }, 409);
				}
				throw error;
			}

			if (blocks) {
				const retainedUrls = new Set(getBlockMediaUrls(blocks));
				const removedUrls = getBlockMediaUrls(existingData.blocks).filter(
					url => url.startsWith('/api/media-object/') && !retainedUrls.has(url),
				);
				await deleteUnreferencedProjectMedia(removedUrls, projectId);
			}

			// Read the document back so the client only reports success with the
			// canonical data that Firestore actually persisted.
			const savedSnapshot = await docRef.get();
			if (!savedSnapshot.exists) {
				throw new Error('Project was not found after it was saved.');
			}
			const savedData = savedSnapshot.data() ?? {};
			const savedProject = { id: savedSnapshot.id, ...savedData };

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
				details: `Field: ${resolvedField}, Techs: ${technologies.join(', ') || 'N/A'}`,
				userEmail: locals.adminEmail,
				targetCollection: 'projects',
				targetDocId: projectId,
				changeType: isNewProject ? 'create' : 'update',
			});

			return jsonResponse({
				success: true,
				project: {
					...savedProject,
					imageUrl: getPublicMediaUrl(
						typeof savedData.imageUrl === 'string' ? savedData.imageUrl : '',
						'projects',
						projectId,
					) || '',
				},
			});
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
