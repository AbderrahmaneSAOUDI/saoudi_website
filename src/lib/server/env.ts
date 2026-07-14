import fs from 'node:fs';
import path from 'node:path';

/**
 * Cached parsed .env entries.
 * Parsed once on first access; avoids repeated file I/O per getEnv() call.
 */
let envCache: Map<string, string> | null = null;

/**
 * Parses the .env file into a Map and caches the result.
 * Handles comments, empty lines, quoted values, and multi-segment values.
 */
function loadEnvFile(): Map<string, string> {
	if (envCache) return envCache;
	envCache = new Map();

	try {
		const envPath = path.resolve(process.cwd(), '.env');
		// Read in a single call (avoids TOCTOU race with existsSync + readFileSync)
		const content = fs.readFileSync(envPath, 'utf8');

		for (const line of content.split('\n')) {
			const trimmed = line.trim();
			// Skip empty lines and comments
			if (!trimmed || trimmed.startsWith('#')) continue;

			const eqIndex = trimmed.indexOf('=');
			if (eqIndex === -1) continue;

			const k = trimmed.slice(0, eqIndex).trim();
			if (!k) continue;

			let v = trimmed.slice(eqIndex + 1).trim();
			// Strip surrounding quotes (single or double)
			if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
				v = v.slice(1, -1);
			}
			envCache.set(k, v.replace(/\\n/g, '\n'));
		}
	} catch {
		/* .env file not found or not readable — expected in production */
	}

	return envCache;
}

/**
 * Reads an environment variable from the local .env file (cached).
 *
 * @param key The name of the environment variable.
 * @returns The value of the environment variable or undefined.
 */
export function getEnvFallback(key: string): string | undefined {
	return loadEnvFile().get(key);
}

/**
 * Retrieves the value of an environment variable from process.env,
 * import.meta.env, or a local .env file fallback.
 *
 * @param key The name of the environment variable.
 * @returns The value of the environment variable or undefined.
 */
export function getEnv(key: string): string | undefined {
	return process.env[key] || import.meta.env[key] || getEnvFallback(key);
}
