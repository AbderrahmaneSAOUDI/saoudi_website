const INLINE_MEDIA_PREFIX = 'data:';

export type PublicMediaCollection =
	| 'designs'
	| 'certificates'
	| 'projects'
	| 'experience'
	| 'services'
	| 'configuration';

/**
 * Builds a stable media endpoint without loading the stored media field first.
 * This lets list queries project out legacy Base64 fields entirely.
 */
export function getMediaProxyUrl(
	collection: PublicMediaCollection,
	documentId: string,
	field?: string,
	version?: string | number,
): string {
	const path = `/api/media/${collection}/${encodeURIComponent(documentId)}`;
	const params = new URLSearchParams();
	if (field) params.set('field', field);
	if (version !== undefined) params.set('v', String(version));
	const query = params.toString();
	return query ? `${path}?${query}` : path;
}

/**
 * Keeps remotely hosted and local files direct, but replaces inline data URLs
 * with a short, cacheable endpoint. This prevents base64 media from being
 * repeated in server-rendered HTML attributes and serialized component props.
 */
export function getPublicMediaUrl(
	url: string | null | undefined,
	collection: PublicMediaCollection,
	documentId: string,
	field?: string,
	version?: string | number,
): string | null | undefined {
	if (!url?.startsWith(INLINE_MEDIA_PREFIX)) return url;

	return getMediaProxyUrl(collection, documentId, field, version);
}

/** Creates a short URL for an inline image stored inside a project block. */
export function getProjectBlockMediaUrl(
	url: string | null | undefined,
	projectId: string,
	blockId: string,
	imageIndex?: number,
): string | null | undefined {
	if (!url?.startsWith(INLINE_MEDIA_PREFIX)) return url;

	const params = new URLSearchParams({ asset: 'block', blockId });
	if (imageIndex !== undefined) params.set('imageIndex', String(imageIndex));

	return `/api/media/projects/${encodeURIComponent(projectId)}?${params.toString()}`;
}
