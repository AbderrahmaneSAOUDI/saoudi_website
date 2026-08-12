import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../../lib/server/firebase-admin';

const ALLOWED_CONTENT_TYPES = new Set([
	'application/pdf',
	'image/avif',
	'image/gif',
	'image/jpeg',
	'image/png',
	'image/webp',
]);

export const GET: APIRoute = async ({ params, request }) => {
	const id = params.id || '';
	if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Not found', { status: 404 });

	const snapshot = await getFirebaseAdminDb().collection('media_objects').doc(id).get();
	if (!snapshot.exists) return new Response('Not found', { status: 404 });

	const data = snapshot.data() || {};
	const contentType = String(data.contentType || '').toLowerCase();
	const base64 = typeof data.base64 === 'string' ? data.base64 : '';
	if (!ALLOWED_CONTENT_TYPES.has(contentType) || !base64) {
		return new Response('Invalid media', { status: 422 });
	}

	const bytes = Buffer.from(base64, 'base64');
	const etag = `"${id}-${bytes.byteLength}"`;
	const headers = new Headers({
		'Cache-Control': 'public, max-age=31536000, immutable',
		'Content-Type': contentType,
		'Content-Length': String(bytes.byteLength),
		ETag: etag,
		'X-Content-Type-Options': 'nosniff',
	});
	if (contentType === 'application/pdf') {
		headers.set('Content-Disposition', 'attachment; filename="Abderrahmane_SAOUDI_Resume.pdf"');
	}
	if (request.headers.get('if-none-match') === etag) {
		return new Response(null, { status: 304, headers });
	}
	return new Response(bytes, { headers });
};
