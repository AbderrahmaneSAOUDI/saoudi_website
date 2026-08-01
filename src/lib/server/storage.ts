import fs from 'node:fs/promises';
import path from 'node:path';
import { getFirebaseAdminStorage } from './firebase-admin';
import { getEnv } from './env';
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
 * Saves a media file. If Cloud Storage is not configured or fails,
 * production uses Base64 Data URLs stored in Firestore (100% free, no credit card),
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

	// If no storage bucket is configured and running on Vercel, immediately return Base64 Data URL
	if (!hasStorageBucket && process.env.VERCEL) {
		const base64 = buffer.toString('base64');
		return `data:${contentType};base64,${base64}`;
	}

	try {
		const storageFile = getFirebaseAdminStorage().bucket().file(`${destinationDir}/${filename}`);
		await storageFile.save(buffer, {
			metadata: { contentType, cacheControl },
		});
		await storageFile.makePublic();
		return storageFile.publicUrl();
	} catch (error) {
		console.warn(
			`Firebase Storage upload failed for ${destinationDir}/${filename}: ${getErrorMessage(error, 'Unknown storage error')}. Falling back to inline data URL / local storage.`,
		);

		if (process.env.VERCEL) {
			const base64 = buffer.toString('base64');
			return `data:${contentType};base64,${base64}`;
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
export async function deleteFile(url: string, expectedDirectory: string): Promise<void> {
	try {
		if (!url || url.startsWith('data:')) {
			return;
		}

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
