import { getFirebaseAdminStorage } from './firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Interface representing the parameters required to save a file.
 */
export interface SaveFileParams {
	file: File;
	destinationDir: string;
	filename: string;
	contentType: string;
	cacheControl?: string;
	localFallbackPath: string;
}

/**
 * Interface representing the parameters required to clean up old extensions.
 */
export interface CleanExtensionsParams {
	baseId: string;
	destinationDir: string;
	localFallbackPath: string;
	extensions?: string[];
}

/**
 * Saves a file to Firebase Storage (under the specified destination directory),
 * falling back to writing to the local public folder if Firebase Storage is not configured or fails.
 *
 * @param params SaveFileParams object containing file, destinationDir, filename, contentType, cacheControl, and localFallbackPath.
 * @returns The public URL/path of the saved file.
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
		// Attempt to upload to Firebase Storage
		const storage = getFirebaseAdminStorage();
		const bucket = storage.bucket();
		const storagePath = `${destinationDir}/${filename}`;
		const storageFile = bucket.file(storagePath);

		// Delete the target file path in Storage first if it exists to prevent cache issues
		try {
			await storageFile.delete();
		} catch {
			/* ignore if it does not exist */
		}

		// Save the file bytes with Cache-Control headers
		await storageFile.save(buffer, {
			metadata: {
				contentType,
				cacheControl,
			},
		});

		// Make it publicly accessible
		await storageFile.makePublic();
		return storageFile.publicUrl();
	} catch (error) {
		if (process.env.VERCEL) {
			console.error(
				`Firebase Storage upload failed for ${destinationDir}/${filename} on Vercel:`,
				error
			);
			throw new Error(
				`Firebase Storage upload failed: ${(error as any).message || 'Unknown error'}. Please ensure Cloud Storage is enabled in the Firebase Console (Build > Storage > Get Started) for this project.`
			);
		}

		console.warn(
			`Firebase Storage upload failed for ${destinationDir}/${filename}; falling back to local filesystem:`,
			error
		);

		// Fallback to local directory writing
		const localDir = path.join(process.cwd(), 'public', localFallbackPath);
		if (!fs.existsSync(localDir)) {
			fs.mkdirSync(localDir, { recursive: true });
		}

		// Delete target local file path if it exists
		const localFilePath = path.join(localDir, filename);
		try {
			if (fs.existsSync(localFilePath)) {
				fs.unlinkSync(localFilePath);
			}
		} catch {
			/* ignore */
		}

		fs.writeFileSync(localFilePath, buffer);

		// Also write to built dist/client directory if it exists (for real-time dev builds feedback)
		const distDir = path.join(process.cwd(), 'dist', 'client', localFallbackPath);
		if (fs.existsSync(path.join(process.cwd(), 'dist', 'client'))) {
			if (!fs.existsSync(distDir)) {
				fs.mkdirSync(distDir, { recursive: true });
			}
			const distFilePath = path.join(distDir, filename);
			try {
				if (fs.existsSync(distFilePath)) {
					fs.unlinkSync(distFilePath);
				}
			} catch {
				/* ignore */
			}
			fs.writeFileSync(distFilePath, buffer);
		}

		// Return the locally accessible path
		return localFallbackPath
			? `/${localFallbackPath}/${filename}`.replace(/\/+/g, '/')
			: `/${filename}`;
	}
}

/**
 * Deletes a file either from local fallback path or from Firebase Storage depending on its URL pattern.
 *
 * @param url The public URL of the file to delete.
 * @param localFallbackPath The local fallback directory path relative to the public folder.
 */
export async function deleteFile(url: string, localFallbackPath: string): Promise<void> {
	try {
		const isLocal = url.startsWith('/') && !url.startsWith('//');
		if (isLocal) {
			// Delete locally from public/
			const filename = path.basename(url);
			const localPath = path.join(process.cwd(), 'public', localFallbackPath, filename);
			if (fs.existsSync(localPath)) {
				fs.unlinkSync(localPath);
			}

			// Also delete from dist/client if it exists
			const distPath = path.join(process.cwd(), 'dist', 'client', localFallbackPath, filename);
			if (fs.existsSync(distPath)) {
				fs.unlinkSync(distPath);
			}
		} else {
			// Delete from Firebase Storage bucket
			const storage = getFirebaseAdminStorage();
			const bucket = storage.bucket();

			let storagePath = '';
			if (url.includes('/o/')) {
				const match = url.match(/\/o\/([^?]+)/);
				if (match && match[1]) {
					storagePath = decodeURIComponent(match[1]);
				}
			} else if (url.includes('storage.googleapis.com')) {
				const parts = url.split('/');
				const bucketIndex = parts.findIndex(
					(p) => p.includes('storage.googleapis.com') || p.includes('appspot.com')
				);
				if (bucketIndex !== -1 && parts.length > bucketIndex + 1) {
					storagePath = parts.slice(bucketIndex + 2).join('/');
				} else {
					storagePath = parts.slice(4).join('/');
				}
			}

			if (storagePath) {
				const file = bucket.file(storagePath);
				await file.delete();
			}
		}
	} catch (error) {
		console.warn('Failed to delete file from storage/local path:', url, error);
	}
}

/**
 * Cleans up old variations of a file with other extensions (e.g. cleans up old webp/jpg/png versions)
 * to keep both Firebase Storage and local directories clean and free of orphan files.
 *
 * @param params CleanExtensionsParams containing baseId, destinationDir, localFallbackPath, and extensions.
 */
export async function cleanOldExtensions({
	baseId,
	destinationDir,
	localFallbackPath,
	extensions = ['jpg', 'png', 'webp'],
}: CleanExtensionsParams): Promise<void> {
	// 1. Clean up from Firebase Storage bucket
	try {
		const storage = getFirebaseAdminStorage();
		const bucket = storage.bucket();
		for (const ext of extensions) {
			try {
				await bucket.file(`${destinationDir}/${baseId}.${ext}`).delete();
			} catch {
				/* ignore if it does not exist */
			}
		}
	} catch (error) {
		/* Firebase storage not available or configured */
	}

	// 2. Clean up from local public directory
	const localDir = path.join(process.cwd(), 'public', localFallbackPath);
	if (fs.existsSync(localDir)) {
		for (const ext of extensions) {
			try {
				const localFilePath = path.join(localDir, `${baseId}.${ext}`);
				if (fs.existsSync(localFilePath)) {
					fs.unlinkSync(localFilePath);
				}
			} catch {
				/* ignore */
			}
		}
	}

	// 3. Clean up from local dist/client directory if exists
	const distDir = path.join(process.cwd(), 'dist', 'client', localFallbackPath);
	if (fs.existsSync(distDir)) {
		for (const ext of extensions) {
			try {
				const distFilePath = path.join(distDir, `${baseId}.${ext}`);
				if (fs.existsSync(distFilePath)) {
					fs.unlinkSync(distFilePath);
				}
			} catch {
				/* ignore */
			}
		}
	}
}
