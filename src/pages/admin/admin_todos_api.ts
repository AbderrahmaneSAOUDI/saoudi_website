import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import { getErrorMessage, getFormString, jsonResponse } from '../../lib/server/http';
import { getEnv } from '../../lib/server/env';
import type { TodoCategory, TodoPriority, TodoStatus } from '../../types';
import {
	safeSystemLog,
	validateAdminSession,
	validateFormRequest,
	validateOwnerPermission,
} from '../../lib/server/api-guards';

const VALID_CATEGORIES = new Set<TodoCategory>(['Feature', 'Bug', 'Refactor', 'Idea', 'Content', 'General']);
const VALID_PRIORITIES = new Set<TodoPriority>(['High', 'Medium', 'Low']);

export const GET: APIRoute = async ({ locals }) => {
	const authErr = validateAdminSession(locals);
	if (authErr) return authErr;

	try {
		const primaryEmail = (getEnv('ADMIN_EMAIL') || '').toLowerCase().trim();
		const callerEmail = (locals.adminEmail || '').toLowerCase().trim();
		const isPrimaryAdmin = callerEmail === primaryEmail && primaryEmail !== '';

		const db = getFirebaseAdminDb();
		const snapshot = await db.collection('admin_todos').orderBy('createdAt', 'desc').get();

		let todos = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				createdBy: data.createdBy || primaryEmail,
			};
		});

		if (!isPrimaryAdmin) {
			todos = todos.filter((t) => (t.createdBy || '').toLowerCase() === callerEmail);
		}

		return jsonResponse({ success: true, todos });
	} catch (error) {
		console.error('Admin Todos GET error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Failed to fetch admin todo list.') },
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
		const todoId = getFormString(formData, 'id').trim();

		const db = getFirebaseAdminDb();

		if (action === 'create') {
			const title = getFormString(formData, 'title').trim();
			const description = getFormString(formData, 'description').trim();
			const categoryRaw = getFormString(formData, 'category').trim() as TodoCategory;
			const priorityRaw = getFormString(formData, 'priority').trim() as TodoPriority;

			if (!title) {
				return jsonResponse({ error: 'Task title is required.' }, 400);
			}

			const category: TodoCategory = VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : 'General';
			const priority: TodoPriority = VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : '';
			const newId = todoId || `todo_${crypto.randomUUID().substring(0, 8)}`;
			const now = new Date().toISOString();
			const creatorEmail = (locals.adminEmail || '').toLowerCase().trim();

			const todoItem = {
				id: newId,
				title,
				description,
				category,
				priority,
				status: 'active' as TodoStatus,
				createdAt: now,
				completedAt: null,
				archivedAt: null,
				createdBy: creatorEmail,
			};

			await db.collection('admin_todos').doc(newId).set(todoItem);
			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'info',
				action: 'TODO_CREATED',
				title: `Created admin task: "${title}"`,
				details: `Category: ${category}, Priority: ${priority}`,
				userEmail: creatorEmail,
				targetCollection: 'admin_todos',
				targetDocId: newId,
				changeType: 'create',
			});

			return jsonResponse({ success: true, todo: todoItem });
		}

		if (!todoId) {
			return jsonResponse({ error: 'Missing Todo ID for action.' }, 400);
		}

		const docRef = db.collection('admin_todos').doc(todoId);
		const docSnap = await docRef.get();
		if (!docSnap.exists) {
			return jsonResponse({ error: 'Todo task not found.' }, 404);
		}

		const existing = docSnap.data() || {};
		const todoTitle = existing.title || todoId;

		if (action === 'toggle_complete') {
			const isCompleted = existing.status === 'completed';
			const newStatus: TodoStatus = isCompleted ? 'active' : 'completed';
			const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

			await docRef.update({
				status: newStatus,
				completedAt,
			});

			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'info',
				action: newStatus === 'completed' ? 'TODO_COMPLETED' : 'TODO_UNCOMPLETED',
				title: `${newStatus === 'completed' ? 'Completed' : 'Reopened'} admin task: "${todoTitle}"`,
				details: `Task status set to ${newStatus} by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'admin_todos',
				targetDocId: todoId,
				changeType: 'update',
			});

			return jsonResponse({
				success: true,
				id: todoId,
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

			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'info',
				action: 'TODO_ARCHIVED',
				title: `Archived admin task: "${todoTitle}"`,
				details: `Task archived by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'admin_todos',
				targetDocId: todoId,
				changeType: 'update',
			});

			return jsonResponse({ success: true, id: todoId, status: 'archived', archivedAt });
		}

		if (action === 'restore') {
			await docRef.update({
				status: 'active',
				archivedAt: null,
			});

			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'info',
				action: 'TODO_RESTORED',
				title: `Restored admin task: "${todoTitle}"`,
				details: `Task restored to active status by ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'admin_todos',
				targetDocId: todoId,
				changeType: 'update',
			});

			return jsonResponse({ success: true, id: todoId, status: 'active' });
		}

		if (action === 'delete') {
			const ownerErr = validateOwnerPermission(locals.adminEmail);
			if (ownerErr) return ownerErr;

			await docRef.delete();
			clearCache('admin_todos');

			await safeSystemLog({
				type: 'task',
				severity: 'warn',
				action: 'TODO_DELETED',
				title: `Permanently deleted admin task: "${todoTitle}"`,
				details: `Task deleted by primary admin ${locals.adminEmail}`,
				userEmail: locals.adminEmail,
				targetCollection: 'admin_todos',
				targetDocId: todoId,
				changeType: 'delete',
			});

			return jsonResponse({ success: true, id: todoId, deleted: true });
		}

		return jsonResponse({ error: 'Invalid todo action specified.' }, 400);
	} catch (error) {
		console.error('Admin Todos API POST error:', error);
		return jsonResponse(
			{ error: getErrorMessage(error, 'Server error occurred during todo operation.') },
			500,
		);
	}
};
