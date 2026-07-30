import fs from 'node:fs/promises';
import path from 'node:path';
import { getFirebaseAdminStorage } from './firebase-admin';
import { getErrorMessage } from './http';

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
 * Saves a media file in Firebase Storage. Local development falls back to
 * public/ so the same endpoint works without a provisioned bucket.
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

	try {
		const storageFile = getFirebaseAdminStorage().bucket().file(`${destinationDir}/${filename}`);
		await storageFile.save(buffer, {
			metadata: { contentType, cacheControl },
		});
		await storageFile.makePublic();
		return storageFile.publicUrl();
	} catch (error) {
		if (process.env.VERCEL) {
			console.error(`Firebase Storage upload failed for ${destinationDir}/${filename}:`, error);
			throw new Error(
				`Firebase Storage upload failed: ${getErrorMessage(error, 'Unknown storage error')}`,
			);
		}

		console.warn(
			`Firebase Storage upload failed for ${destinationDir}/${filename}; using the local development fallback.`,
		);

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
export async function deleteFile(url: string, expectedDirectory: string): Promise<void> {
	try {
		const normalizedDirectory = expectedDirectory.replace(/^\/+|\/+$/g, '');
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
