/**
 * Image optimization utilities for responsive loading and thumbnail generation.
 */

/**
 * Extracts Google Drive file ID from various Google Drive URL formats.
 */
export function getGoogleDriveFileId(url: string): string | null {
	if (!url || typeof url !== 'string') return null;
	if (url.startsWith('data:') || url.startsWith('blob:')) return null;

	const isGoogleUrl =
		url.includes('drive.google.com') ||
		url.includes('googleusercontent.com') ||
		url.includes('docs.google.com');

	if (!isGoogleUrl) return null;

	const matchParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
	if (matchParam && matchParam[1]) return matchParam[1];
	const matchPath = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
	if (matchPath && matchPath[1]) return matchPath[1];
	return null;
}

/**
 * Returns an optimized thumbnail URL for grid view.
 * If the URL points to Google Drive, it routes through Google's dynamic image CDN at target width.
 */
export function getThumbnailUrl(url: string, width = 800): string {
	if (!url) return url;
	const fileId = getGoogleDriveFileId(url);
	if (fileId) {
		return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;
	}
	return url;
}

/**
 * Generates a responsive srcset attribute for Google Drive images.
 */
export function getImageSrcSet(url: string): string | undefined {
	if (!url) return undefined;
	const fileId = getGoogleDriveFileId(url);
	if (fileId) {
		return `https://lh3.googleusercontent.com/d/${fileId}=w400 400w, https://lh3.googleusercontent.com/d/${fileId}=w800 800w, https://lh3.googleusercontent.com/d/${fileId}=w1200 1200w`;
	}
	return undefined;
}
