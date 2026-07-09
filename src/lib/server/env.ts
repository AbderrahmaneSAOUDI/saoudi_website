import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads environment variables from the local .env file when process.env
 * or import.meta.env do not contain them (e.g. during local development).
 *
 * @param key The name of the environment variable.
 * @returns The value of the environment variable or undefined.
 */
export function getEnvFallback(key: string): string | undefined {
	try {
		const envPath = path.resolve(process.cwd(), '.env');
		if (fs.existsSync(envPath)) {
			const content = fs.readFileSync(envPath, 'utf8');
			for (const line of content.split('\n')) {
				const parts = line.split('=');
				if (parts.length >= 2) {
					const k = parts[0].trim();
					let v = parts.slice(1).join('=').trim();
					if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
						v = v.slice(1, -1);
					}
					if (k === key) {
						return v.replace(/\\n/g, '\n');
					}
				}
			}
		}
	} catch {
		/* ignore errors */
	}
	return undefined;
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
