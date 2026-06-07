import { z } from 'zod';

/**
 * Firebase Data Schema
 * Canonical type definitions for the two-collection model
 * See GEMINI.md for the single-authoritative schema
 */

/**
 * Collection 1: configuration (single document: static_data)
 * Stores global site settings, profile info, and persistent admin configurations.
 */
export interface StaticData {
	name: string;
	title: string;
	bio: string;
	skills: string[];
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

/**
 * Collection 2: entries (dynamic, all portfolio items)
 * Unified collection for all portfolio content, differentiated only by a constrained type literal.
 */
export interface PortfolioEntry {
	id: string;
	type: 'project' | 'experience' | 'volunteering' | 'certificate';
	title: string;
	description: string;
	/**
	 * Expected formats:
	 * - ISO date string (YYYY-MM-DD)
	 * - year range (YYYY-YYYY)
	 * - human-readable period label (e.g. "Jan 2020 - Dec 2022")
	 */
	dateOrPeriod: string;
	imageUrl?: string;
	tags?: string[];
}

export const staticDataSchema = z.object({
	name: z.string().min(1),
	title: z.string().min(1),
	bio: z.string().min(1),
	skills: z.array(z.string().min(1)),
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

export const portfolioEntrySchema = z.object({
	id: z.string().min(1),
	type: z.enum(['project', 'experience', 'volunteering', 'certificate']),
	title: z.string().min(1),
	description: z.string().min(1),
	dateOrPeriod: z.string().min(1),
	imageUrl: z.string().min(1).optional(),
	tags: z.array(z.string().min(1)).optional(),
});

export const parseStaticData = (data: unknown): StaticData => {
	return staticDataSchema.parse(data);
};

export const parsePortfolioEntry = (entry: unknown): PortfolioEntry => {
	return portfolioEntrySchema.parse(entry);
};

export const isValidStaticData = (data: unknown): data is StaticData => {
	return staticDataSchema.safeParse(data).success;
};

export const isValidPortfolioEntry = (entry: unknown): entry is PortfolioEntry => {
	return portfolioEntrySchema.safeParse(entry).success;
};

/**
 * Type guard helpers for PortfolioEntry
 */
export const isProject = (entry: PortfolioEntry): entry is PortfolioEntry & { type: 'project' } => {
	return entry.type === 'project';
};

export const isExperience = (entry: PortfolioEntry): entry is PortfolioEntry & { type: 'experience' } => {
	return entry.type === 'experience';
};

export const isVolunteering = (entry: PortfolioEntry): entry is PortfolioEntry & { type: 'volunteering' } => {
	return entry.type === 'volunteering';
};

export const isCertificate = (entry: PortfolioEntry): entry is PortfolioEntry & { type: 'certificate' } => {
	return entry.type === 'certificate';
};
