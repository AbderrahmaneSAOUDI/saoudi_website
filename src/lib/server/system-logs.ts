import { getFirebaseAdminDb } from './firebase-admin';
import { getEnv } from './env';
import type { SystemLog, LogType, LogSeverity, LogAction } from '../../types';

export const LOG_RETENTION_DAYS: Record<LogType, number> = {
	security: 180,
	auth: 90,
	admin: 90,
	content: 45,
	task: 30,
	storage: 30,
	visitor: 15,
	system: 15,
};

export interface AddLogParams {
	type: LogType;
	severity?: LogSeverity;
	action: LogAction;
	title: string;
	details?: string;
	userEmail?: string;

	// Request context
	ip?: string;
	userAgent?: string;
	requestPath?: string;

	// Session correlation
	sessionId?: string;

	// Change tracking
	targetCollection?: string;
	targetDocId?: string;
	changeType?: 'create' | 'update' | 'delete';
	changedFields?: string[];
	previousValues?: Record<string, any>;

	// Structured metadata
	metadata?: Record<string, any>;
}

/**
 * Evaluates access control permissions for viewing a specific system log
 * based on the role (Primary Admin vs Secondary Admin) and log type.
 *
 * Primary Admin: Full access to all log types.
 * Secondary Admin:
 * - Full access: content, visitor, storage
 * - Own only: auth, task (only logs where userEmail matches caller)
 * - Hidden: admin, security, system
 */
export function canUserAccessLog(log: SystemLog, userEmail: string, isPrimaryAdmin: boolean): boolean {
	if (isPrimaryAdmin) return true;

	const callerEmail = (userEmail || '').toLowerCase().trim();
	const logUserEmail = (log.userEmail || '').toLowerCase().trim();

	// Full access for secondary admins
	if (log.type === 'content' || log.type === 'visitor' || log.type === 'storage') {
		return true;
	}

	// Own-only access for secondary admins
	if ((log.type === 'auth' || log.type === 'task') && logUserEmail === callerEmail) {
		return true;
	}

	// Hidden for secondary admins: admin, security, system, and other users' auth/task logs
	return false;
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

		const retentionDays = LOG_RETENTION_DAYS[params.type] || 15;
		const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

		const newLogData = {
			type: params.type,
			severity: params.severity || 'info',
			action: params.action,
			title: params.title,
			details: params.details || '',
			userEmail,
			isPrimaryEmail,
			timestamp: new Date().toISOString(),
			expiresAt,
			...(params.ip ? { ip: params.ip } : {}),
			...(params.userAgent ? { userAgent: params.userAgent } : {}),
			...(params.requestPath ? { requestPath: params.requestPath } : {}),
			...(params.sessionId ? { sessionId: params.sessionId } : {}),
			...(params.targetCollection ? { targetCollection: params.targetCollection } : {}),
			...(params.targetDocId ? { targetDocId: params.targetDocId } : {}),
			...(params.changeType ? { changeType: params.changeType } : {}),
			...(params.changedFields ? { changedFields: params.changedFields } : {}),
			...(params.previousValues ? { previousValues: params.previousValues } : {}),
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
 * Deletes a system log document from Firestore by ID.
 */
export async function deleteSystemLog(logId: string): Promise<boolean> {
	try {
		const db = getFirebaseAdminDb();
		await db.collection('system_logs').doc(logId).delete();
		return true;
	} catch (err) {
		console.warn(`Failed to delete system log ${logId} from Firestore:`, err);
		return false;
	}
}

/**
 * Purges expired system log documents from Firestore based on expiresAt or retention policy thresholds.
 */
export async function purgeExpiredSystemLogs(): Promise<{ success: boolean; deletedCount: number }> {
	try {
		const db = getFirebaseAdminDb();
		const nowIso = new Date().toISOString();
		const nowTime = Date.now();
		let deletedCount = 0;

		// 1. Query logs explicitly marked with expiresAt <= now
		const expiredSnap = await db.collection('system_logs')
			.where('expiresAt', '<=', nowIso)
			.get();

		if (!expiredSnap.empty) {
			const batch = db.batch();
			expiredSnap.docs.forEach(doc => {
				batch.delete(doc.ref);
				deletedCount++;
			});
			await batch.commit();
		}

		// 2. Query legacy logs without expiresAt field and check against retention matrix
		const allLogsSnap = await db.collection('system_logs').get();
		if (!allLogsSnap.empty) {
			const legacyBatch = db.batch();
			let legacyCount = 0;

			allLogsSnap.docs.forEach(doc => {
				const data = doc.data();
				if (!data.expiresAt && data.timestamp) {
					const type: LogType = data.type || 'system';
					const retentionDays = LOG_RETENTION_DAYS[type] || 15;
					const logTime = new Date(data.timestamp).getTime();

					if (!isNaN(logTime) && (nowTime - logTime > retentionDays * 24 * 60 * 60 * 1000)) {
						legacyBatch.delete(doc.ref);
						legacyCount++;
					}
				}
			});

			if (legacyCount > 0) {
				await legacyBatch.commit();
				deletedCount += legacyCount;
			}
		}

		return { success: true, deletedCount };
	} catch (err) {
		console.warn('Failed to purge expired system logs:', err);
		return { success: false, deletedCount: 0 };
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

		return snap.docs.map(doc => {
			const data = doc.data();
			return {
				id: doc.id,
				severity: data.severity || 'info',
				...data,
			} as SystemLog;
		});
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
			severity: 'info',
			action: 'AUTH_LOGIN_PRIMARY',
			title: 'Admin Dashboard session active',
			details: `Authorized login for ${primaryEmail}`,
			userEmail: primaryEmail,
			isPrimaryEmail: true,
			timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
		},
		{
			id: 'seed-log-2',
			type: 'content',
			severity: 'info',
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
			severity: 'info',
			action: 'AUTH_LOGIN_SECONDARY',
			title: 'Granted admin entered Admin Dashboard',
			details: 'Secondary email collaborator@saoudi.online signed in via Google GSI',
			userEmail: 'collaborator@saoudi.online',
			isPrimaryEmail: false,
			timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
		},
		{
			id: 'seed-log-4',
			type: 'admin',
			severity: 'info',
			action: 'ADMIN_EMAIL_ADDED',
			title: 'Granted new admin email access',
			details: 'Added collaborator@saoudi.online to accepted admin emails',
			userEmail: primaryEmail,
			isPrimaryEmail: true,
			timestamp: new Date(now.getTime() - 120 * 60 * 1000).toISOString(),
		},
		{
			id: 'seed-log-5',
			type: 'system',
			severity: 'info',
			action: 'SYSTEM_STARTUP',
			title: 'Middleware & Security rules active',
			details: 'HMAC session token protection & Firestore Security active',
			userEmail: 'system',
			isPrimaryEmail: true,
			timestamp: new Date(now.getTime() - 240 * 60 * 1000).toISOString(),
		},
	];
}
