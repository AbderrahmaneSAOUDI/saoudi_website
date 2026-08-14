import { getEnv } from './env';
import { getFirebaseAdminDb } from './firebase-admin';
import { getOrSetCached, CACHE_TTL_MS } from './cache';

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
 * Cached briefly in-memory to prevent repeated Firestore reads on frequent requests.
 */
export async function isAuthorizedAdminEmail(email: string | null | undefined): Promise<boolean> {
	const normalizedEmail = normalizeAdminEmail(email);
	if (!normalizedEmail) return false;
	if (isPrimaryAdminEmail(normalizedEmail)) return true;

	try {
		return await getOrSetCached<boolean>(
			`auth_secondary_${normalizedEmail}`,
			async () => {
				const snapshot = await getFirebaseAdminDb()
					.collection('accepted_admin_emails')
					.doc(normalizedEmail)
					.get();
				return snapshot.exists;
			},
			CACHE_TTL_MS.ADMIN_DATA,
		);
	} catch (error) {
		console.warn('Could not verify current secondary-admin authorization:', error);
		return false;
	}
}
