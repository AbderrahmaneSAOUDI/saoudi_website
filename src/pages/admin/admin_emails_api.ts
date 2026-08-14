import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache, clearCacheByPrefix } from '../../lib/server/cache';
import { getErrorMessage, getFormString, jsonResponse } from '../../lib/server/http';
import { getEnv } from '../../lib/server/env';
import { z } from 'zod';
import {
	safeSystemLog,
	isOwnerAdmin,
	validateAdminSession,
	validateFormRequest,
	validateOwnerPermission,
} from '../../lib/server/api-guards';

const emailSchema = z.email();

export const GET: APIRoute = async ({ locals }) => {
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;

	try {
		const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
		const db = getFirebaseAdminDb();
		const snapshot = await db.collection('accepted_admin_emails').orderBy('addedAt', 'desc').get();

		const dbEmails: Array<Record<string, any>> = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		// Build final list guaranteeing primary ADMIN_EMAIL is present
		const emailsMap = new Map<string, any>();

		if (primaryEmail) {
			emailsMap.set(primaryEmail, {
				id: primaryEmail,
				email: primaryEmail,
				addedAt: new Date(0).toISOString(),
				addedBy: 'System Environment',
				isPrimary: true,
				notes: 'Primary Administrator (env)',
			});
		}

		for (const item of dbEmails) {
			const itemEmail = String(item.email || item.id).toLowerCase().trim();
			if (!emailsMap.has(itemEmail)) {
				emailsMap.set(itemEmail, {
					id: item.id,
					email: itemEmail,
					addedAt: item.addedAt || new Date().toISOString(),
					addedBy: item.addedBy || 'Admin',
					isPrimary: itemEmail === primaryEmail,
					notes: item.notes || '',
				});
			}
		}

		let emails = Array.from(emailsMap.values());
		if (!isOwnerAdmin(locals.adminEmail)) {
			const callerEmail = (locals.adminEmail || '').toLowerCase().trim();
			emails = emails.filter((item) => item.email === callerEmail);
		}
		return jsonResponse({ success: true, emails });
	} catch (error) {
		console.error('Admin Emails GET API error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Failed to fetch accepted emails list.') },
			500,
		);
	}
};

export const POST: APIRoute = async ({ locals, request }) => {
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;
	const formErr = validateFormRequest(request);
	if (formErr) return formErr;

	try {
		const formData = await request.formData();
		const action = getFormString(formData, 'action');
		const email = getFormString(formData, 'email').toLowerCase().trim();
		const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();

		const ownerErr = validateOwnerPermission(locals.adminEmail);
		if (ownerErr) return ownerErr;

		if (!email) {
			return jsonResponse({ error: 'Email address is required.' }, 400);
		}

		const db = getFirebaseAdminDb();
		const docRef = db.collection('accepted_admin_emails').doc(email);

		if (action === 'delete') {
			if (email === primaryEmail) {
				return jsonResponse({ error: 'Cannot remove the primary environment admin email.' }, 400);
			}

			const docSnap = await docRef.get();
			if (docSnap.exists) {
				await docRef.delete();
			}

			clearCache('admin_accepted_emails');
			clearCacheByPrefix('auth_secondary_');

			await safeSystemLog({
				type: 'system',
				severity: 'warn',
				action: 'ADMIN_EMAIL_REVOKED',
				title: `Revoked admin email access: ${email}`,
				details: `Email access revoked by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'accepted_admin_emails',
				targetDocId: email,
				changeType: 'delete',
			});

			return jsonResponse({ success: true, deletedEmail: email });
		}

		if (action === 'add') {
			const validation = emailSchema.safeParse(email);
			if (!validation.success) {
				return jsonResponse({ error: 'Please enter a valid email address.' }, 400);
			}

			const notes = getFormString(formData, 'notes').trim();
			const now = new Date().toISOString();

			const newRecord = {
				id: email,
				email,
				addedAt: now,
				addedBy: locals.adminEmail,
				isPrimary: email === primaryEmail,
				notes: notes || 'Accepted Admin User',
			};

			await docRef.set(newRecord, { merge: true });
			clearCache('admin_accepted_emails');
			clearCacheByPrefix('auth_secondary_');

			await safeSystemLog({
				type: 'system',
				severity: 'info',
				action: 'ADMIN_EMAIL_ADDED',
				title: `Added authorized admin email: ${email}`,
				details: `Email granted access by ${locals.adminEmail}. Notes: ${notes || 'Accepted Admin User'}`,
				userEmail: locals.adminEmail,
				targetCollection: 'accepted_admin_emails',
				targetDocId: email,
				changeType: 'create',
			});

			return jsonResponse({ success: true, email: newRecord });
		}

		return jsonResponse({ error: 'Invalid action specified.' }, 400);
	} catch (error) {
		console.error('Admin Emails API POST error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Server error occurred during email update.') },
			500,
		);
	}
};
