import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import { getErrorMessage, getFormString, isFormRequest, jsonResponse } from '../../lib/server/http';
import { getEnv } from '../../lib/server/env';
import { z } from 'zod';

const emailSchema = z.string().email();

export const GET: APIRoute = async ({ locals }) => {
	if (!locals.adminEmail) return jsonResponse({ error: 'Unauthorized' }, 401);

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
			const itemEmail = (item.email || item.id).toLowerCase().trim();
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

		const emails = Array.from(emailsMap.values());
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
	if (!locals.adminEmail) return jsonResponse({ error: 'Unauthorized' }, 401);
	if (!isFormRequest(request)) {
		return jsonResponse({ error: 'Expected a form-encoded or JSON request.' }, 415);
	}

	try {
		const formData = await request.formData();
		const action = getFormString(formData, 'action');
		const email = getFormString(formData, 'email').toLowerCase().trim();
		const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();

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
