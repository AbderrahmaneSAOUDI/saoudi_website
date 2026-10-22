const HTML_ESCAPE_MAP: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
};

/** Escape untrusted data before inserting it into an HTML template string. */
export function escapeHtml(value: unknown): string {
	return String(value ?? '').replace(/[&<>"']/g, character => HTML_ESCAPE_MAP[character]);
}

/** Escape a value used in a quoted HTML attribute. */
export const escapeAttribute = escapeHtml;

export function getSafePublicHref(value: unknown): string {
	const candidate = String(value ?? '').trim();
	if (!candidate) return '';
	if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate;
	try {
		const parsed = new URL(candidate);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? candidate : '';
	} catch {
		return '';
	}
}

export function getSafeImageSrc(value: unknown): string {
	const candidate = String(value ?? '').trim();
	if (/^data:image\/(?:avif|gif|jpe?g|png|webp|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(candidate)) {
		return candidate;
	}
	return getSafePublicHref(candidate);
}

/** Generates a collision-resistant 8-character alphanumeric string for newly drafted CMS items. */
export function generateShortId(): string {
	return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
		? crypto.randomUUID().substring(0, 8)
		: Math.random().toString(36).substring(2, 10);
}
