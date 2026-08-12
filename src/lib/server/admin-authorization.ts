import { getEnv } from './env';

export function normalizeAdminEmail(email: string | null | undefined): string {
	return (email || '').toLowerCase().trim();
}

export function isPrimaryAdminEmail(email: string | null | undefined): boolean {
	const primaryEmail = normalizeAdminEmail(getEnv('ADMIN_EMAIL'));
	return Boolean(primaryEmail && normalizeAdminEmail(email) === primaryEmail);
}

/**
 * Re-checks secondary-admin membership so removing an accepted email revokes
 * existing signed sessions instead of leaving them active until token expiry.
 */
export async function isAuthorizedAdminEmail(email: string | null | undefined): Promise<boolean> {
	const normalizedEmail = normalizeAdminEmail(email);
	if (!normalizedEmail) return false;
	if (isPrimaryAdminEmail(normalizedEmail)) return true;

	try {
		const { getFirebaseAdminDb } = await import('./firebase-admin');
		const snapshot = await getFirebaseAdminDb()
			.collection('accepted_admin_emails')
			.doc(normalizedEmail)
			.get();
		return snapshot.exists;
	} catch (error) {
		console.warn('Could not verify current secondary-admin authorization:', error);
		return false;
	}
}
