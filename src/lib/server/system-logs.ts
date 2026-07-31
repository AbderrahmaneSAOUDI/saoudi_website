import { getFirebaseAdminDb } from './firebase-admin';
import { getEnv } from './env';
import type { SystemLog, LogType } from '../../types';

export interface AddLogParams {
	type: LogType;
	action: string;
	title: string;
	details?: string;
	userEmail?: string;
	metadata?: Record<string, any>;
}

/**
 * Appends a new system activity log to the Firestore `system_logs` collection.
 */
export async function addSystemLog(params: AddLogParams): Promise<SystemLog | null> {
	try {
		const db = getFirebaseAdminDb();
		const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
		const userEmail = (params.userEmail || primaryEmail || 'system').toLowerCase().trim();
		const isPrimaryEmail = userEmail === primaryEmail;

		const newLogData = {
			type: params.type,
			action: params.action,
			title: params.title,
			details: params.details || '',
			userEmail,
			isPrimaryEmail,
			timestamp: new Date().toISOString(),
			...(params.metadata ? { metadata: params.metadata } : {}),
		};

		const docRef = await db.collection('system_logs').add(newLogData);
		return {
			id: docRef.id,
			...newLogData,
		};
	} catch (err) {
		console.warn('Failed to record system log in Firestore:', err);
		return null;
	}
}

/**
 * Fetches latest system activity logs from Firestore.
 */
export async function getSystemLogs(limitCount: number = 50, typeFilter?: string): Promise<SystemLog[]> {
	try {
		const db = getFirebaseAdminDb();
		let query: FirebaseFirestore.Query = db.collection('system_logs');

		if (typeFilter && typeFilter !== 'all') {
			query = query.where('type', '==', typeFilter);
		}

		const snap = await query.orderBy('timestamp', 'desc').limit(limitCount).get();
		
		if (snap.empty && (!typeFilter || typeFilter === 'all')) {
			// Return clean default system logs if none exist yet
			return getSeedSystemLogs();
		}

		return snap.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		} as SystemLog));
	} catch (err) {
		console.warn('Failed to retrieve system logs from Firestore:', err);
		return getSeedSystemLogs();
	}
}

/**
 * Initial seed logs for visual demonstration if database collection is brand new.
 */
export function getSeedSystemLogs(): SystemLog[] {
	const primaryEmail = (getEnv('ADMIN_EMAIL') || 'saoudi.dev@gmail.com').toLowerCase().trim();
	const now = new Date();

	return [
		{
			id: 'seed-log-1',
			type: 'auth',
			action: 'ADMIN_LOGIN',
			title: 'Admin Dashboard session active',
			details: `Authorized login for ${primaryEmail}`,
			userEmail: primaryEmail,
			isPrimaryEmail: true,
			timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
		},
		{
			id: 'seed-log-2',
			type: 'content',
			action: 'PROJECT_UPDATED',
			title: 'Card updated: Projects section',
			details: 'Modified project order & technology tags',
			userEmail: primaryEmail,
			isPrimaryEmail: true,
			timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
		},
		{
			id: 'seed-log-3',
			type: 'auth',
			action: 'SECONDARY_ADMIN_LOGIN',
			title: 'Granted admin entered Admin Dashboard',
			details: 'Secondary email collaborator@saoudi.online signed in via Google GSI',
			userEmail: 'collaborator@saoudi.online',
			isPrimaryEmail: false,
			timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
		},
		{
			id: 'seed-log-4',
			type: 'admin',
			action: 'EMAIL_ADDED',
			title: 'Granted new admin email access',
			details: 'Added 	 to accepted admin emails',
			userEmail: primaryEmail,
			isPrimaryEmail: true,
			timestamp: new Date(now.getTime() - 120 * 60 * 1000).toISOString(),
		},
		{
			id: 'seed-log-5',
			type: 'system',
			action: 'SYSTEM_INIT',
			title: 'Middleware & Security rules active',
			details: 'HMAC session token protection & Firestore Security active',
			userEmail: 'system',
			isPrimaryEmail: true,
			timestamp: new Date(now.getTime() - 240 * 60 * 1000).toISOString(),
		},
	];
}
