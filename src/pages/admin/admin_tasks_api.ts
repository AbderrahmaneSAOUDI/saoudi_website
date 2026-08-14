import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import { getErrorMessage, getFormString, jsonResponse } from '../../lib/server/http';
import { getEnv } from '../../lib/server/env';
import type { TaskCategory, TaskPriority, TaskStatus } from '../../types';
import {
	safeSystemLog,
	validateAdminSession,
	validateFormRequest,
	validateOwnerPermission,
} from '../../lib/server/api-guards';

const VALID_CATEGORIES = new Set<TaskCategory>(['Feature', 'Bug', 'Refactor', 'Idea', 'Content', 'General']);
const VALID_PRIORITIES = new Set<TaskPriority>(['High', 'Medium', 'Low']);

export const GET: APIRoute = async ({ locals }) => {
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;

	try {
		const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
		const callerEmail = (locals.adminEmail || '').toLowerCase().trim();
		const isPrimaryAdmin = callerEmail === primaryEmail && primaryEmail !== '';

		const db = getFirebaseAdminDb();
		const snapshot = await db.collection('admin_todos').orderBy('createdAt', 'desc').get();

		let tasks = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				createdBy: typeof data.createdBy === 'string' ? data.createdBy : primaryEmail,
			};
		});

		if (!isPrimaryAdmin) {
			tasks = tasks.filter((t) => String(t.createdBy || '').toLowerCase() === callerEmail);
		}

		return jsonResponse({ success: true, tasks, todos: tasks });
	} catch (error) {
		console.error('Admin Tasks GET error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Failed to fetch admin task list.') },
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
		const taskId = (getFormString(formData, 'id') || getFormString(formData, 'taskId')).trim();

		const db = getFirebaseAdminDb();

		if (action === 'create') {
			const title = getFormString(formData, 'title').trim();
			const description = getFormString(formData, 'description').trim();
			const categoryRaw = getFormString(formData, 'category').trim() as TaskCategory;
			const priorityRaw = getFormString(formData, 'priority').trim() as TaskPriority;

			if (!title) {
				return jsonResponse({ error: 'Task title is required.' }, 400);
			}

			const category: TaskCategory = VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : 'General';
			const priority: TaskPriority = VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : '';
			const newId = `task_${crypto.randomUUID()}`;
			const now = new Date().toISOString();
			const creatorEmail = (locals.adminEmail || '').toLowerCase().trim();

			const taskItem = {
				id: newId,
				title,
				description,
				category,
				priority,
				status: 'active' as TaskStatus,
				createdAt: now,
				completedAt: null,
				archivedAt: null,
				createdBy: creatorEmail,
			};

			await db.collection('admin_todos').doc(newId).create(taskItem);
			clearCache('admin_tasks');
			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'info',
				action: 'TASK_CREATED',
				title: `Created admin task: "${title}"`,
				details: `Category: ${category}, Priority: ${priority}`,
				userEmail: creatorEmail,
				targetCollection: 'admin_todos',
				targetDocId: newId,
				changeType: 'create',
			});

			return jsonResponse({ success: true, task: taskItem, todo: taskItem });
		}

		if (!taskId) {
			return jsonResponse({ error: 'Missing Task ID for action.' }, 400);
		}

		const docRef = db.collection('admin_todos').doc(taskId);
		const docSnap = await docRef.get();
		if (!docSnap.exists) {
			return jsonResponse({ error: 'Task not found.' }, 404);
		}

		const existing = docSnap.data() || {};
		const taskTitle = existing.title || taskId;
		const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
		const callerEmail = (locals.adminEmail || '').toLowerCase().trim();
		const creatorEmail = String(existing.createdBy || primaryEmail).toLowerCase().trim();
		const isPrimaryAdmin = Boolean(primaryEmail && callerEmail === primaryEmail);

		if (!isPrimaryAdmin && creatorEmail !== callerEmail) {
			return jsonResponse({ error: 'Permission denied for this task.' }, 403);
		}

		if (action === 'toggle_complete') {
			const isCompleted = existing.status === 'completed';
			const newStatus: TaskStatus = isCompleted ? 'active' : 'completed';
			const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

			await docRef.update({
				status: newStatus,
				completedAt,
			});

			clearCache('admin_tasks');
			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'info',
				action: newStatus === 'completed' ? 'TASK_COMPLETED' : 'TASK_UNCOMPLETED',
				title: `${newStatus === 'completed' ? 'Completed' : 'Reopened'} admin task: "${taskTitle}"`,
				details: `Task status set to ${newStatus} by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'admin_todos',
				targetDocId: taskId,
				changeType: 'update',
			});

			return jsonResponse({
				success: true,
				id: taskId,
				status: newStatus,
				completedAt,
			});
		}

		if (action === 'archive') {
			const archivedAt = new Date().toISOString();
			await docRef.update({
				status: 'archived',
				archivedAt,
			});

			clearCache('admin_tasks');
			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'info',
				action: 'TASK_ARCHIVED',
				title: `Archived admin task: "${taskTitle}"`,
				details: `Task archived by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'admin_todos',
				targetDocId: taskId,
				changeType: 'update',
			});

			return jsonResponse({ success: true, id: taskId, status: 'archived', archivedAt });
		}

		if (action === 'restore') {
			await docRef.update({
				status: 'active',
				archivedAt: null,
			});

			clearCache('admin_tasks');
			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'info',
				action: 'TASK_RESTORED',
				title: `Restored admin task: "${taskTitle}"`,
				details: `Task restored to active status by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'admin_todos',
				targetDocId: taskId,
				changeType: 'update',
			});

			return jsonResponse({ success: true, id: taskId, status: 'active' });
		}

		if (action === 'delete') {
			const ownerErr = validateOwnerPermission(locals.adminEmail);
			if (ownerErr) return ownerErr;

			await docRef.delete();
			clearCache('admin_tasks');
			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'warn',
				action: 'TASK_DELETED',
				title: `Permanently deleted admin task: "${taskTitle}"`,
				details: `Task deleted by primary admin ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'admin_todos',
				targetDocId: taskId,
				changeType: 'delete',
			});

			return jsonResponse({ success: true, id: taskId, deleted: true });
		}

		return jsonResponse({ error: 'Invalid task action specified.' }, 400);
	} catch (error) {
		console.error('Admin Tasks API POST error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Server error occurred during task operation.') },
			500,
		);
	}
};
