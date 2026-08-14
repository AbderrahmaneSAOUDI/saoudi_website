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
	const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
	const logUserEmail = String(log.userEmail || '').toLowerCase().trim();
	const isLogOwner = log.isPrimaryEmail || (primaryEmail !== '' && logUserEmail === primaryEmail);

	// Do not display [Task] and [Content] logs performed by the owner
	if (isLogOwner && (log.type === 'task' || log.type === 'content')) {
		return false;
	}

	if (isPrimaryAdmin) return true;

	const callerEmail = String(userEmail || '').toLowerCase().trim();

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

		// Do not track [Task] and [Content] logs performed by the website owner
		if (isPrimaryEmail && (params.type === 'task' || params.type === 'content')) {
			return null;
		}

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
			for (let offset = 0; offset < expiredSnap.docs.length; offset += 450) {
				const batch = db.batch();
				const chunk = expiredSnap.docs.slice(offset, offset + 450);
				chunk.forEach((doc) => batch.delete(doc.ref));
				await batch.commit();
				deletedCount += chunk.length;
			}
		}

		// 2. Query legacy logs with a batch limit to avoid unbounded collection scan
		const legacySnap = await db.collection('system_logs')
			.orderBy('timestamp', 'asc')
			.limit(200)
			.get();

		if (!legacySnap.empty) {
			const legacyRefs: FirebaseFirestore.DocumentReference[] = [];

			legacySnap.docs.forEach(doc => {
				const data = doc.data();
				if (!data.expiresAt && data.timestamp) {
					const type: LogType = data.type || 'system';
					const retentionDays = LOG_RETENTION_DAYS[type] || 15;
					const logTime = new Date(data.timestamp).getTime();

					if (!isNaN(logTime) && (nowTime - logTime > retentionDays * 24 * 60 * 60 * 1000)) {
						legacyRefs.push(doc.ref);
					}
				}
			});

			for (let offset = 0; offset < legacyRefs.length; offset += 450) {
				const batch = db.batch();
				const chunk = legacyRefs.slice(offset, offset + 450);
				chunk.forEach((ref) => batch.delete(ref));
				await batch.commit();
				deletedCount += chunk.length;
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
 * Includes resilience fallback if Firestore composite index is missing.
 */
export async function getSystemLogs(limitCount: number = 50, typeFilter?: string): Promise<SystemLog[]> {
	try {
		const db = getFirebaseAdminDb();
		let snap: FirebaseFirestore.QuerySnapshot;

		try {
			let query: FirebaseFirestore.Query = db.collection('system_logs');
			if (typeFilter && typeFilter !== 'all') {
				query = query.where('type', '==', typeFilter);
			}
			snap = await query.orderBy('timestamp', 'desc').limit(limitCount).get();
		} catch (queryErr: any) {
			// Fallback: If composite index is missing for where + orderBy, fetch by timestamp and filter in memory
			if (typeFilter && typeFilter !== 'all') {
				const fallbackSnap = await db.collection('system_logs')
					.orderBy('timestamp', 'desc')
					.limit(limitCount * 4)
					.get();
				const filteredDocs = fallbackSnap.docs.filter(d => (d.data().type || 'system') === typeFilter).slice(0, limitCount);
				return filteredDocs.map(doc => {
					const data = doc.data();
					return {
						...data,
						id: doc.id,
						type: typeof data.type === 'string' ? data.type : 'system',
						severity: typeof data.severity === 'string' ? data.severity : 'info',
						action: typeof data.action === 'string' ? data.action : 'SYSTEM_ERROR',
						title: typeof data.title === 'string' ? data.title : 'Untitled system event',
						details: typeof data.details === 'string' ? data.details : '',
						userEmail: typeof data.userEmail === 'string' ? data.userEmail : 'system',
					} as SystemLog;
				});
			}
			throw queryErr;
		}
		
		return snap.docs.map(doc => {
			const data = doc.data();
			return {
				...data,
				id: doc.id,
				type: typeof data.type === 'string' ? data.type : 'system',
				severity: typeof data.severity === 'string' ? data.severity : 'info',
				action: typeof data.action === 'string' ? data.action : 'SYSTEM_ERROR',
				title: typeof data.title === 'string' ? data.title : 'Untitled system event',
				details: typeof data.details === 'string' ? data.details : '',
				userEmail: typeof data.userEmail === 'string' ? data.userEmail : 'system',
			} as SystemLog;
		});
	} catch (err) {
		console.warn('Failed to retrieve system logs from Firestore:', err);
		throw err;
	}
}
