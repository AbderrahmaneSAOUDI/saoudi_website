import { z } from 'zod';

/**
 * Firebase Data Schema
 * Canonical type definitions for the multi-collection model.
 *
 * Collections:
 *   - configuration  → single document "static_data" (StaticData)
 *   - experience     → Experience documents
 *   - projects       → Project documents
 *   - designs        → Design documents
 *   - certificates   → Certificate documents
 *   - volunteering   → Volunteering documents
 *
 * See README.md for the single-authoritative schema.
 */

// ─── Collection: configuration (singleton document: static_data) ──────────

/**
 * Stores global site settings, profile info, and persistent admin configurations.
 */
export interface StaticData {
	name: string;
	title: string;
	bio: string;
	skills: {
		languages: string[];
		frameworks: string[];
		tools: string[];
	};
	resumeUrl: string;
	contact: {
		email: string; // stored plain; obfuscated at render time
		telegram?: string;
		whatsapp?: string;
	};
	imageSettings: {
		/** Image quality in the 1-100 range for responsive generation. */
		quality: number;
		/** Maximum image width in pixels. Must be a positive integer. */
		maxWidth: number;
	};
}

export const staticDataSchema = z.object({
	name: z.string().min(1),
	title: z.string().min(1),
	bio: z.string().min(1),
	skills: z.object({
		languages: z.array(z.string().min(1)),
		frameworks: z.array(z.string().min(1)),
		tools: z.array(z.string().min(1)),
	}),
	resumeUrl: z.string().min(1),
	contact: z.object({
		email: z.string().min(1),
		telegram: z.string().min(1).optional(),
		whatsapp: z.string().min(1).optional(),
	}),
	imageSettings: z.object({
		quality: z.number().int().min(1).max(100),
		maxWidth: z.number().int().positive(),
	}),
});

// ─── Collection: experience ───────────────────────────────────────────────

export type EmploymentType =
	| 'Full-time'
	| 'Part-time'
	| 'Contract / Freelance'
	| 'Volunteering / Community'
	| 'Academic / Teaching';

export const EMPLOYMENT_TYPES: EmploymentType[] = [
	'Full-time',
	'Part-time',
	'Contract / Freelance',
	'Volunteering / Community',
	'Academic / Teaching',
];

export interface Experience {
	id: string;
	order: number;
	role: string;
	company: string;
	logoUrl: string | null;
	employmentType: EmploymentType;
	startDate: string; // ISO partial: YYYY-MM or YYYY-MM-DD
	endDate: string | null; // null = Present
	responsibilities: string; // Markdown text
}

export const experienceSchema = z.object({
	id: z.string().min(1),
	order: z.number().int(),
	role: z.string().min(1),
	company: z.string().min(1),
	logoUrl: z.string().nullable(),
	employmentType: z.enum(['Full-time', 'Part-time', 'Contract / Freelance', 'Volunteering / Community', 'Academic / Teaching']),
	startDate: z.string().min(1),
	endDate: z.string().nullable(),
	responsibilities: z.string().min(1),
});

// ─── Collection: projects ─────────────────────────────────────────────────

export interface Project {
	id: string;
	order: number;
	title: string;
	field?: string;
	tagline?: string;
	description?: string;
	imageUrl: string;
	projectUrl?: string;
	githubUrl?: string;
	date: string; // ISO 8601
	technologies: string[];
	blocks?: any[];
	featured: boolean;
}

export const projectSchema = z.object({
	id: z.string().min(1),
	order: z.number().int(),
	title: z.string().min(1),
	field: z.string().optional(),
	tagline: z.string().optional(),
	description: z.string().optional(),
	imageUrl: z.string().min(1),
	projectUrl: z.string().optional(),
	githubUrl: z.string().optional(),
	date: z.string().min(1),
	technologies: z.array(z.string().min(1)),
	blocks: z.array(z.any()).optional(),
	featured: z.boolean(),
});

// ─── Collection: designs ──────────────────────────────────────────────────

export interface Design {
	id: string;
	title?: string;
	description?: string;
	imageUrl: string;
	date?: string; // ISO 8601 or YYYY / YYYY-MM / YYYY-MM-DD (optional)
	company: string;
	tags?: string[];
}

export const designSchema = z.object({
	id: z.string().min(1),
	title: z.string().optional(),
	description: z.string().optional(),
	imageUrl: z.string().min(1),
	date: z.string().optional(),
	company: z.string().min(1),
	tags: z.array(z.string().min(1)).optional(),
});

// ─── Collection: certificates ─────────────────────────────────────────────

export interface Certificate {
	id: string;
	title: string;
	issuer: string;
	date: string; // ISO 8601 string for chronological sorting (YYYY-MM or YYYY-MM-DD)
	type: 'Online' | 'In-Person' | 'Hybrid';
	credentialUrl?: string | null;
	imageUrl?: string | null;
}

export const certificateSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	issuer: z.string().min(1),
	date: z.string().min(1),
	type: z.enum(['Online', 'In-Person', 'Hybrid']),
	credentialUrl: z.string().nullable().optional(),
	imageUrl: z.string().nullable().optional(),
});

// ─── Collection: volunteering ─────────────────────────────────────────────

export interface Volunteering {
	id: string;
	order: number;
	role: string;
	organization: string;
	date: string; // ISO 8601
	period: string;
	description: string;
	impactMetric?: string;
}

export const volunteeringSchema = z.object({
	id: z.string().min(1),
	order: z.number().int(),
	role: z.string().min(1),
	organization: z.string().min(1),
	date: z.string().min(1),
	period: z.string().min(1),
	description: z.string().min(1),
	impactMetric: z.string().min(1).optional(),
});

// ─── Collection: services ──────────────────────────────────────────────────

export interface Service {
	id: string;
	order: number;
	title: string;
	description: string;
	logoUrl?: string | null;
	features?: string[];
	createdAt?: string;
	updatedAt?: string;
}

export const serviceSchema = z.object({
	id: z.string().min(1),
	order: z.number().int(),
	title: z.string().min(1),
	description: z.string().min(1),
	logoUrl: z.string().nullable().optional(),
	features: z.array(z.string().min(1)).optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

// ─── Collection: accepted_admin_emails ────────────────────────────────────

export interface AcceptedAdminEmail {
	id: string;
	email: string;
	addedAt: string; // ISO 8601
	addedBy: string;
	isPrimary?: boolean;
	notes?: string;
}

export const acceptedAdminEmailSchema = z.object({
	id: z.string().min(1),
	email: z.string().email(),
	addedAt: z.string().min(1),
	addedBy: z.string().min(1),
	isPrimary: z.boolean().optional(),
	notes: z.string().optional(),
});

// ─── Collection: admin_todos ──────────────────────────────────────────────

export type TodoCategory = 'Feature' | 'Bug' | 'Refactor' | 'Idea' | 'Content' | 'General';
export type TodoPriority = 'High' | 'Medium' | 'Low' | '' | undefined;
export type TodoStatus = 'active' | 'completed' | 'archived';

export interface AdminTodo {
	id: string;
	title: string;
	description?: string;
	category: TodoCategory;
	priority?: TodoPriority;
	status: TodoStatus;
	createdAt: string; // ISO 8601
	completedAt?: string | null;
	archivedAt?: string | null;
	createdBy?: string;
}

export const adminTodoSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	description: z.string().optional(),
	category: z.enum(['Feature', 'Bug', 'Refactor', 'Idea', 'Content', 'General']),
	priority: z.enum(['High', 'Medium', 'Low', '']).optional(),
	status: z.enum(['active', 'completed', 'archived']),
	createdAt: z.string().min(1),
	completedAt: z.string().nullable().optional(),
	archivedAt: z.string().nullable().optional(),
	createdBy: z.string().optional(),
});

// ─── Collection: system_logs ───────────────────────────────────────────────

export type LogType =
	| 'auth'
	| 'content'
	| 'admin'
	| 'system'
	| 'security'
	| 'visitor'
	| 'task'
	| 'storage';

export type LogSeverity = 'info' | 'warn' | 'error' | 'critical';

export type LogAction =
	// Auth events
	| 'AUTH_LOGIN_PRIMARY'
	| 'AUTH_LOGIN_SECONDARY'
	| 'AUTH_LOGIN_FAILED'
	| 'AUTH_LOGIN_UNAUTHORIZED'
	| 'AUTH_LOGOUT'
	| 'AUTH_SESSION_EXPIRED'
	| 'AUTH_SESSION_INVALID'
	// Content — Projects
	| 'PROJECT_CREATED'
	| 'PROJECT_UPDATED'
	| 'PROJECT_DELETED'
	| 'PROJECT_FIELDS_UPDATED'
	// Content — Designs
	| 'DESIGN_CREATED'
	| 'DESIGN_UPDATED'
	| 'DESIGN_DELETED'
	| 'DESIGN_COMPANIES_RENAMED'
	| 'DESIGN_COMPANIES_UPDATED'
	// Content — Certificates
	| 'CERTIFICATE_CREATED'
	| 'CERTIFICATE_UPDATED'
	| 'CERTIFICATE_DELETED'
	// Content — Experience
	| 'EXPERIENCE_CREATED'
	| 'EXPERIENCE_UPDATED'
	| 'EXPERIENCE_DELETED'
	// Content — Services
	| 'SERVICE_CREATED'
	| 'SERVICE_UPDATED'
	| 'SERVICE_DELETED'
	// Admin config
	| 'ADMIN_EMAIL_ADDED'
	| 'ADMIN_EMAIL_REVOKED'
	| 'ADMIN_SETTING_CHANGED'
	| 'ADMIN_DOWNLOADS_EXCLUSION_TOGGLED'
	| 'ADMIN_DOWNLOADS_RESET'
	// Task management
	| 'TODO_CREATED'
	| 'TODO_COMPLETED'
	| 'TODO_UNCOMPLETED'
	| 'TODO_ARCHIVED'
	| 'TODO_RESTORED'
	| 'TODO_DELETED'
	// Storage / Files
	| 'FILE_UPLOADED'
	| 'FILE_REPLACED'
	| 'FILE_DELETED'
	| 'RESUME_PDF_UPLOADED'
	| 'RESUME_PREVIEW_UPLOADED'
	// Visitor events
	| 'VISITOR_RESUME_DOWNLOAD'
	| 'ADMIN_RESUME_DOWNLOAD'
	// Security events
	| 'SECURITY_UNAUTHORIZED_ACCESS'
	| 'SECURITY_SESSION_HIJACK_ATTEMPT'
	| 'SECURITY_RATE_LIMIT_HIT'
	// System events
	| 'SYSTEM_STARTUP'
	| 'SYSTEM_ERROR'
	| 'SYSTEM_CACHE_CLEARED'
	// Legacy / Compatibility
	| 'PRIMARY_ADMIN_LOGIN'
	| 'SECONDARY_ADMIN_LOGIN'
	| 'PROJECT_ADDED'
	| 'DESIGN_ADDED'
	| 'EMAIL_ADDED'
	| 'EMAIL_REVOKED'
	| 'RESUME_DOWNLOAD'
	| 'SYSTEM_INIT'
	| 'DASHBOARD_OPENED'
	| 'CUSTOM_EVENT'
	| (string & {});

export interface SystemLog {
	id: string;
	type: LogType;
	severity: LogSeverity;
	action: LogAction;
	title: string;
	details?: string;
	userEmail: string;
	isPrimaryEmail?: boolean;
	timestamp: string; // ISO 8601

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

	// Expiration & retention
	expiresAt?: string; // ISO 8601

	// Structured metadata
	metadata?: Record<string, any>;
}

export const systemLogSchema = z.object({
	id: z.string().min(1),
	type: z.enum(['auth', 'content', 'admin', 'system', 'security', 'visitor', 'task', 'storage']),
	severity: z.enum(['info', 'warn', 'error', 'critical']).default('info'),
	action: z.string().min(1),
	title: z.string().min(1),
	details: z.string().optional(),
	userEmail: z.string().min(1),
	isPrimaryEmail: z.boolean().optional(),
	timestamp: z.string().min(1),
	expiresAt: z.string().optional(),
	ip: z.string().optional(),
	userAgent: z.string().optional(),
	requestPath: z.string().optional(),
	sessionId: z.string().optional(),
	targetCollection: z.string().optional(),
	targetDocId: z.string().optional(),
	changeType: z.enum(['create', 'update', 'delete']).optional(),
	changedFields: z.array(z.string()).optional(),
	previousValues: z.record(z.string(), z.any()).optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});

// ─── Parse & Validation Helpers ───────────────────────────────────────────

export const parseStaticData = (data: unknown): StaticData => {
	return staticDataSchema.parse(data);
};

export const isValidStaticData = (data: unknown): data is StaticData => {
	return staticDataSchema.safeParse(data).success;
};

export const parseExperience = (data: unknown): Experience => {
	return experienceSchema.parse(data);
};

export const parseProject = (data: unknown): Project => {
	return projectSchema.parse(data);
};

export const parseDesign = (data: unknown): Design => {
	return designSchema.parse(data);
};

export const parseCertificate = (data: unknown): Certificate => {
	return certificateSchema.parse(data);
};

export const parseVolunteering = (data: unknown): Volunteering => {
	return volunteeringSchema.parse(data);
};

export const parseService = (data: unknown): Service => {
	return serviceSchema.parse(data);
};

export const isValidService = (data: unknown): data is Service => {
	return serviceSchema.safeParse(data).success;
};

export const parseAcceptedAdminEmail = (data: unknown): AcceptedAdminEmail => {
	return acceptedAdminEmailSchema.parse(data);
};

export const parseAdminTodo = (data: unknown): AdminTodo => {
	return adminTodoSchema.parse(data);
};

export const parseSystemLog = (data: unknown): SystemLog => {
	return systemLogSchema.parse(data);
};

