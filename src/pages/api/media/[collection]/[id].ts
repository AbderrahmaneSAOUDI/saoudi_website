import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../../../lib/server/firebase-admin';

const DEFAULT_FIELDS = {
	designs: 'imageUrl',
	certificates: 'imageUrl',
	projects: 'imageUrl',
	experience: 'logoUrl',
	services: 'logoUrl',
	configuration: 'previewUrl',
} as const;

const CONFIGURATION_FIELDS = new Set(['previewUrl']);
const MAX_MEDIA_BYTES = 2 * 1024 * 1024;
const CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300';

type MediaCollection = keyof typeof DEFAULT_FIELDS;

function isMediaCollection(value: string | undefined): value is MediaCollection {
	return Boolean(value && value in DEFAULT_FIELDS);
}

function notFound(): Response {
	return new Response('Media not found.', {
		status: 404,
		headers: {
			'Cache-Control': 'private, no-store',
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}

function getProjectBlockMedia(
	data: Record<string, unknown>,
	blockId: string | null,
	imageIndexRaw: string | null,
): string | null {
	if (!blockId || !Array.isArray(data.blocks)) return null;

	const block = data.blocks.find(
		(value): value is Record<string, unknown> =>
			Boolean(value && typeof value === 'object' && (value as Record<string, unknown>).id === blockId),
	);
	if (!block) return null;

	if (block.type === 'single_image') {
		return typeof block.imageUrl === 'string' ? block.imageUrl : null;
	}

	if (block.type === 'carousel' && Array.isArray(block.images)) {
		const imageIndex = Number.parseInt(imageIndexRaw || '', 10);
		if (!Number.isInteger(imageIndex) || imageIndex < 0) return null;
		const imageUrl = block.images[imageIndex];
		return typeof imageUrl === 'string' ? imageUrl : null;
	}

	return null;
}

function resolveRedirectLocation(source: string, requestUrl: string): string | null {
	try {
		const target = new URL(source, requestUrl);
		return target.protocol === 'http:' || target.protocol === 'https:' ? target.href : null;
	} catch {
		return null;
	}
}

export const GET: APIRoute = async ({ params, request, url }) => {
	const collection = params.collection;
	const documentId = params.id;
	if (!isMediaCollection(collection) || !documentId || documentId.includes('/')) return notFound();

	try {
		const snapshot = await getFirebaseAdminDb().collection(collection).doc(documentId).get();
		if (!snapshot.exists) return notFound();

		const data = snapshot.data() || {};
		let source: string | null = null;

		if (collection === 'projects' && url.searchParams.get('asset') === 'block') {
			source = getProjectBlockMedia(
				data,
				url.searchParams.get('blockId'),
				url.searchParams.get('imageIndex'),
			);
		} else {
			const requestedField = url.searchParams.get('field');
			const field = collection === 'configuration' && requestedField
				? requestedField
				: DEFAULT_FIELDS[collection];
			if (collection === 'configuration' && !CONFIGURATION_FIELDS.has(field)) return notFound();
			const value = data[field];
			source = typeof value === 'string' ? value : null;
		}

		if (!source) return notFound();

		const version = snapshot.updateTime?.toMillis() ?? 0;
		const etag = `\"media-${collection}-${documentId}-${version}\"`;
		if (request.headers.get('if-none-match') === etag) {
			return new Response(null, {
				status: 304,
				headers: { 'Cache-Control': CACHE_CONTROL, ETag: etag },
			});
		}

		if (!source.startsWith('data:')) {
			const location = resolveRedirectLocation(source, request.url);
			if (!location) return notFound();
			return new Response(null, {
				status: 302,
				headers: { 'Cache-Control': CACHE_CONTROL, ETag: etag, Location: location },
			});
		}

		const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(source);
		if (!match) return notFound();

		const contentType = match[1].toLowerCase();
		if (!contentType.startsWith('image/') && contentType !== 'application/pdf') return notFound();

		const buffer = Buffer.from(match[2], 'base64');
		if (buffer.byteLength === 0 || buffer.byteLength > MAX_MEDIA_BYTES) {
			return new Response('Media payload is too large.', {
				status: 413,
				headers: { 'Cache-Control': 'private, no-store' },
			});
		}

		return new Response(new Uint8Array(buffer), {
			headers: {
				'Cache-Control': CACHE_CONTROL,
				'Content-Length': String(buffer.byteLength),
				'Content-Type': contentType,
				ETag: etag,
				'X-Content-Type-Options': 'nosniff',
			},
		});
	} catch (error) {
		console.error('Public media endpoint failed:', error);
		return new Response('Media is temporarily unavailable.', {
			status: 503,
			headers: {
				'Cache-Control': 'private, no-store',
				'Content-Type': 'text/plain; charset=utf-8',
			},
		});
	}
};
