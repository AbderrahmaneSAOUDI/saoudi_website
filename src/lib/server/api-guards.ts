import type { APIContext } from 'astro';
import { getEnv } from './env';
import { isFormRequest, jsonResponse } from './http';
import { addSystemLog, type AddLogParams } from './system-logs';

/**
 * Validates that an active admin session is present on Astro.locals.
 * Returns an HTTP 401 Response if unauthenticated, or null if valid.
 */
export function validateAdminSession(locals: APIContext['locals']): Response | null {
	if (!locals.adminEmail) {
		return jsonResponse({ error: 'Unauthorized' }, 401);
	}
	return null;
}

/**
 * Validates that the request content-type is multipart/form-data or application/x-www-form-urlencoded.
 * Returns an HTTP 415 Response if invalid, or null if valid.
 */
export function validateFormRequest(request: Request): Response | null {
	if (!isFormRequest(request)) {
		return jsonResponse({ error: 'Expected a form-encoded request.' }, 415);
	}
	return null;
}

/**
 * Returns true if caller email matches the primary owner ADMIN_EMAIL environment variable.
 */
export function isOwnerAdmin(adminEmail: string | undefined): boolean {
	const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
	const callerEmail = (adminEmail || '').toLowerCase().trim();
	return Boolean(primaryEmail && callerEmail === primaryEmail);
}

/**
 * Enforces primary owner authorization.
 * Returns an HTTP 403 Response if caller is not the primary owner, or null if authorized.
 */
export function validateOwnerPermission(adminEmail: string | undefined): Response | null {
	if (!isOwnerAdmin(adminEmail)) {
		return jsonResponse(
			{ error: 'Permission denied. Only the website owner can perform this operation.' },
			403,
		);
	}
	return null;
}

/**
 * Validates WebP image format and file size limit (default 800KB).
 * Returns an HTTP 400 Response if invalid, or null if valid.
 */
export function validateWebpImage(
	file: File,
	maxBytes = 800 * 1024,
	typeErrorMsg?: string,
	sizeErrorMsg?: string,
): Response | null {
	if (file.type !== 'image/webp') {
		return jsonResponse({ error: typeErrorMsg || 'Image must be a WebP file.' }, 400);
	}
	if (file.size > maxBytes) {
		return jsonResponse(
			{ error: sizeErrorMsg || `Image file size must be under ${Math.round(maxBytes / 1024)}KB.` },
			400,
		);
	}
	return null;
}

/**
 * Safely adds a system log entry without throwing unhandled exceptions if logging fails.
 */
export async function safeSystemLog(logPayload: AddLogParams): Promise<void> {
	try {
		await addSystemLog(logPayload);
	} catch (logErr) {
		console.warn('Could not record system log event:', logErr);
	}
}
