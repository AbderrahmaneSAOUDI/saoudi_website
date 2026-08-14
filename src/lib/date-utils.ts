/**
 * Shared date formatting and manipulation utilities for public pages and admin panel.
 */

const SHORT_MONTHS = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

/**
 * Formats a YYYY-MM-DD or YYYY-MM date string into a human-readable format.
 * Examples:
 * - "2026-08-10" -> "Aug 10, 2026"
 * - "2026-08"    -> "Aug 2026"
 */
export function formatAdminDate(dateStr?: string | null): string {
	if (!dateStr) return '';
	try {
		const parts = dateStr.split('-');
		if (parts.length >= 2) {
			const year = parseInt(parts[0], 10);
			const monthIdx = parseInt(parts[1], 10) - 1;
			if (monthIdx >= 0 && monthIdx < 12 && !isNaN(year)) {
				const monthName = SHORT_MONTHS[monthIdx];
				if (parts.length >= 3) {
					const day = parseInt(parts[2], 10);
					if (!isNaN(day)) {
						return `${monthName} ${day}, ${year}`;
					}
				}
				return `${monthName} ${year}`;
			}
		}
		const date = new Date(dateStr);
		if (!isNaN(date.getTime())) {
			return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
		}
	} catch (e) {
		console.warn('Date parsing fallback for:', dateStr, e);
	}
	return dateStr;
}

/**
 * Extracts unique years from a list of date strings (YYYY-MM-DD or YYYY-MM format)
 * sorted in descending order.
 */
export function extractUniqueYears(dates: (string | null | undefined)[]): string[] {
	const yearsSet = new Set<string>();
	for (const d of dates) {
		if (typeof d === 'string' && d.includes('-')) {
			const year = d.split('-')[0];
			if (year && year.length === 4 && !isNaN(Number(year))) {
				yearsSet.add(year);
			}
		}
	}
	return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
}

/**
 * Returns current month in YYYY-MM format.
 */
export function getCurrentMonthString(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	return `${now.getFullYear()}-${month}`;
}

/**
 * Strips "@gmail.com" suffix from user email strings for clean UI display.
 */
export function stripGmailDomain(email?: string | null): string {
	if (!email) return '';
	return email.replace(/@gmail\.com$/i, '');
}
