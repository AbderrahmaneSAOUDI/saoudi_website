const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: JSON_HEADERS,
	});
}

export function getErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback;
}

export function getFormString(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

export function getFormFile(formData: FormData, key: string): File | null {
	const value = formData.get(key);
	return value instanceof File && value.size > 0 ? value : null;
}

export function isFormRequest(request: Request): boolean {
	const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
	return (
		contentType.startsWith('multipart/form-data') ||
		contentType.startsWith('application/x-www-form-urlencoded')
	);
}
