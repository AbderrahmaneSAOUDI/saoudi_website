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
	if (/^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/=\s]+$/i.test(candidate)) {
		return candidate;
	}
	return getSafePublicHref(candidate);
}
