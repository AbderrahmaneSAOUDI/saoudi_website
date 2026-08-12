import fs from 'node:fs/promises';
import path from 'node:path';
import { getFirebaseAdminDb, getFirebaseAdminStorage } from './firebase-admin';
import { getEnv } from './env';
import { getErrorMessage } from './http';

// Base64 expands data by roughly one third. Staying below this source limit
// leaves room for Firestore's 1 MiB document cap and the document's text fields.
const MAX_INLINE_SOURCE_BYTES = 700 * 1024;

async function saveInlineMedia(
	buffer: Buffer,
	contentType: string,
	directory: string,
	ownerKey: string,
): Promise<string> {
	if (buffer.byteLength > MAX_INLINE_SOURCE_BYTES) {
		throw new Error('Upload requires configured object storage when the file exceeds 700KB.');
	}

	const id = crypto.randomUUID();
	await getFirebaseAdminDb().collection('media_objects').doc(id).set({
		contentType,
		base64: buffer.toString('base64'),
		directory: directory.replace(/^\/+|\/+$/g, ''),
		ownerKey,
		createdAt: new Date().toISOString(),
	});
	return `/api/media-object/${id}`;
}

export async function persistInlineDataUrl(
	value: string,
	directory: string,
	ownerKey: string,
): Promise<string> {
	const match = /^data:(image\/(?:avif|gif|jpe?g|png|webp));base64,([a-z0-9+/=\r\n]+)$/i.exec(value);
	if (!match) throw new Error('Unsupported inline image data.');
	return saveInlineMedia(Buffer.from(match[2], 'base64'), match[1].toLowerCase(), directory, ownerKey);
}

export interface SaveFileParams {
	file: File;
	destinationDir: string;
	filename: string;
	contentType: string;
	cacheControl?: string;
	localFallbackPath: string;
}

async function pathExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function deleteIfPresent(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}
}

/**
 * Saves a media file. If Cloud Storage is not configured or fails,
 * production stores the bytes in a dedicated Firestore media document,
 * while local development falls back to the public/ folder.
 */
export async function saveFile({
	file,
	destinationDir,
	filename,
	contentType,
	cacheControl = 'public, max-age=31536000, immutable',
	localFallbackPath,
}: SaveFileParams): Promise<string> {
	const buffer = Buffer.from(await file.arrayBuffer());
	const hasStorageBucket = Boolean(getEnv('FIREBASE_STORAGE_BUCKET'));

	// Keep fallback bytes in a dedicated document so content documents never
	// exceed Firestore's 1 MiB limit when they reference multiple media files.
	if (!hasStorageBucket && process.env.VERCEL) {
		return saveInlineMedia(buffer, contentType, destinationDir, `${destinationDir}/${filename}`);
	}

	try {
		const storageFile = getFirebaseAdminStorage().bucket().file(`${destinationDir}/${filename}`);
		await storageFile.save(buffer, {
			metadata: {
				contentType,
				cacheControl,
				...(contentType === 'application/pdf'
					? { contentDisposition: 'attachment; filename="Abderrahmane_SAOUDI_Resume.pdf"' }
					: {}),
			},
		});
		await storageFile.makePublic();
		return storageFile.publicUrl();
	} catch (error) {
		console.warn(
			`Firebase Storage upload failed for ${destinationDir}/${filename}: ${getErrorMessage(error, 'Unknown storage error')}. Falling back to inline data URL / local storage.`,
		);

		if (process.env.VERCEL) {
			return saveInlineMedia(buffer, contentType, destinationDir, `${destinationDir}/${filename}`);
		}

		const publicDir = path.join(process.cwd(), 'public', localFallbackPath);
		await fs.mkdir(publicDir, { recursive: true });
		await fs.writeFile(path.join(publicDir, filename), buffer);

		// Keep a running preview build in sync when its client directory exists.
		const distClientDir = path.join(process.cwd(), 'dist', 'client');
		if (await pathExists(distClientDir)) {
			const distDir = path.join(distClientDir, localFallbackPath);
			await fs.mkdir(distDir, { recursive: true });
			await fs.writeFile(path.join(distDir, filename), buffer);
		}

		return `/${localFallbackPath}/${filename}`.replace(/\/+/g, '/');
	}
}

function getStorageObjectPath(url: string): string {
	if (url.includes('/o/')) {
		const match = url.match(/\/o\/([^?]+)/);
		return match?.[1] ? decodeURIComponent(match[1]) : '';
	}

	try {
		const parsedUrl = new URL(url);
		if (parsedUrl.hostname === 'storage.googleapis.com') {
			const [, ...segments] = parsedUrl.pathname.split('/').filter(Boolean);
			return segments.join('/');
		}
	} catch {
		return '';
	}

	return '';
}

/**
 * Deletes an uploaded file without allowing a stored URL to escape its
 * expected directory. Cleanup failures are non-fatal to completed DB writes.
 */
export async function deleteFile(
	url: string,
	expectedDirectory: string,
	expectedOwnerKey?: string,
): Promise<void> {
	try {
		if (!url || url.startsWith('data:')) {
			return;
		}
		const normalizedDirectory = expectedDirectory.replace(/^\/+|\/+$/g, '');
		if (url.startsWith('/api/media-object/')) {
			const id = url.slice('/api/media-object/'.length);
			if (/^[0-9a-f-]{36}$/i.test(id)) {
				const ref = getFirebaseAdminDb().collection('media_objects').doc(id);
				const snapshot = await ref.get();
				const data = snapshot.data();
				if (
					snapshot.exists &&
					data?.directory === normalizedDirectory &&
					(!expectedOwnerKey || data?.ownerKey === expectedOwnerKey)
				) {
					await ref.delete();
				}
			}
			return;
		}
		const isLocal = url.startsWith('/') && !url.startsWith('//');

		if (isLocal) {
			const filename = path.basename(url);
			await Promise.all([
				deleteIfPresent(path.join(process.cwd(), 'public', normalizedDirectory, filename)),
				deleteIfPresent(path.join(process.cwd(), 'dist', 'client', normalizedDirectory, filename)),
			]);
			return;
		}

		const storagePath = getStorageObjectPath(url);
		if (!storagePath.startsWith(`${normalizedDirectory}/`)) {
			return;
		}

		await getFirebaseAdminStorage().bucket().file(storagePath).delete({ ignoreNotFound: true });
	} catch (error) {
		console.warn('Failed to clean up uploaded file:', url, error);
	}
}
