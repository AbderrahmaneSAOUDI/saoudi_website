import type { APIRoute } from 'astro';
import { getFirebaseAdminDb } from '../../lib/server/firebase-admin';
import { clearCache } from '../../lib/server/cache';
import { getErrorMessage, getFormString, isFormRequest, jsonResponse } from '../../lib/server/http';
import type { TodoCategory, TodoPriority, TodoStatus } from '../../types';

const VALID_CATEGORIES = new Set<TodoCategory>(['Feature', 'Bug', 'Refactor', 'Idea', 'Content', 'General']);
const VALID_PRIORITIES = new Set<TodoPriority>(['High', 'Medium', 'Low']);

export const GET: APIRoute = async ({ locals }) => {
	if (!locals.adminEmail) return jsonResponse({ error: 'Unauthorized' }, 401);

	try {
		const db = getFirebaseAdminDb();
		const snapshot = await db.collection('admin_todos').orderBy('createdAt', 'desc').get();

		const todos = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

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
	if (!locals.adminEmail) return jsonResponse({ error: 'Unauthorized' }, 401);
	if (!isFormRequest(request)) {
		return jsonResponse({ error: 'Expected a form-encoded or JSON request.' }, 415);
	}

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
			const priority: TodoPriority = VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : 'Medium';
			const newId = todoId || `todo_${crypto.randomUUID().substring(0, 8)}`;
			const now = new Date().toISOString();

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
			};

			await db.collection('admin_todos').doc(newId).set(todoItem);
			clearCache('admin_todos');
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

		if (action === 'toggle_complete') {
			const isCompleted = existing.status === 'completed';
			const newStatus: TodoStatus = isCompleted ? 'active' : 'completed';
			const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

			await docRef.update({
				status: newStatus,
				completedAt,
			});

			clearCache('admin_todos');
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
			return jsonResponse({ success: true, id: todoId, status: 'archived', archivedAt });
		}

		if (action === 'restore') {
			await docRef.update({
				status: 'active',
				archivedAt: null,
			});

			clearCache('admin_todos');
			return jsonResponse({ success: true, id: todoId, status: 'active' });
		}

		if (action === 'delete') {
			await docRef.delete();
			clearCache('admin_todos');
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
