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

export interface Experience {
	id: string;
	order: number;
	role: string;
	company: string;
	location: string;
	date: string; // ISO 8601 string for sorting
	period: string; // Human readable label (e.g. "Jan 2024 - Present")
	descriptionPoints: string[];
	technologies: string[];
}

export const experienceSchema = z.object({
	id: z.string().min(1),
	order: z.number().int(),
	role: z.string().min(1),
	company: z.string().min(1),
	location: z.string().min(1),
	date: z.string().min(1),
	period: z.string().min(1),
	descriptionPoints: z.array(z.string().min(1)),
	technologies: z.array(z.string().min(1)),
});

// ─── Collection: projects ─────────────────────────────────────────────────

export interface Project {
	id: string;
	order: number;
	title: string;
	tagline: string;
	description: string;
	imageUrl: string;
	projectUrl: string;
	githubUrl: string;
	date: string; // ISO 8601
	technologies: string[];
	featured: boolean;
}

export const projectSchema = z.object({
	id: z.string().min(1),
	order: z.number().int(),
	title: z.string().min(1),
	tagline: z.string().min(1),
	description: z.string().min(1),
	imageUrl: z.string().min(1),
	projectUrl: z.string().min(1),
	githubUrl: z.string().min(1),
	date: z.string().min(1),
	technologies: z.array(z.string().min(1)),
	featured: z.boolean(),
});

// ─── Collection: designs ──────────────────────────────────────────────────

export interface Design {
	id: string;
	title: string;
	description?: string;
	imageUrl: string;
	date: string; // ISO 8601
	company: string;
	tags: string[];
}

export const designSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	description: z.string().optional(),
	imageUrl: z.string().min(1),
	date: z.string().min(1),
	company: z.string().min(1),
	tags: z.array(z.string().min(1)),
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
