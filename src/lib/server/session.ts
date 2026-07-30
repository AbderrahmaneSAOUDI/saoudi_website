import { z } from 'zod';
import { getEnv } from './env';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Zod schema for session payload to prevent malformed token injection */
const sessionPayloadSchema = z.object({
	email: z.email(),
	exp: z.number().int().positive(),
});

const getSessionSecret = () => {
  const secret = getEnv('SESSION_SECRET') || getEnv('FIREBASE_PRIVATE_KEY');
  if (secret) return secret;
  if (import.meta.env.DEV) return 'saoudi-online-local-development-only';

  throw new Error('SESSION_SECRET is not configured.');
};

const encodeBase64Url = (value: Uint8Array): string => {
  let binary = '';
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const decodeBase64Url = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

/**
 * Imports the HMAC key for both signing and verification.
 * Uses 'sign' + 'verify' extractable=false for security.
 */
let cachedSecret: string | undefined;
let cachedHmacKey: Promise<CryptoKey> | undefined;

const getHmacKey = (secret: string): Promise<CryptoKey> => {
  if (cachedSecret === secret && cachedHmacKey) return cachedHmacKey;

  cachedSecret = secret;
  cachedHmacKey = crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return cachedHmacKey;
};

const signHmac = async (payloadB64: string, secret: string): Promise<string> => {
  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payloadB64));

  return encodeBase64Url(new Uint8Array(signature));
};

/**
 * SECURITY: Constant-time HMAC verification using crypto.subtle.verify().
 * Prevents timing side-channel attacks that string comparison (===) is vulnerable to.
 */
const verifyHmac = async (payloadB64: string, signatureB64: string, secret: string): Promise<boolean> => {
  const key = await getHmacKey(secret);
  const signatureBytes = decodeBase64Url(signatureB64);
  const signature = signatureBytes.buffer.slice(
    signatureBytes.byteOffset,
    signatureBytes.byteOffset + signatureBytes.byteLength,
  ) as ArrayBuffer;
  return crypto.subtle.verify('HMAC', key, signature, textEncoder.encode(payloadB64));
};

export interface SessionPayload {
  email: string;
  exp: number;
}

/**
 * Creates a signed JWT-like session token with a 7-day expiration.
 */
export async function createSessionToken(email: string): Promise<string> {
  const secret = getSessionSecret();
  // 7 days expiration
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload: SessionPayload = { email, exp };
  
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = encodeBase64Url(textEncoder.encode(payloadStr));
  const signature = await signHmac(payloadB64, secret);

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed session token. Returns the payload if valid, or null otherwise.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    // Reject obviously malformed tokens early (must be "payload.signature")
    if (typeof token !== 'string' || token.length > 4096) return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [payloadB64, signature] = parts;
    if (!payloadB64 || !signature) return null;

    const secret = getSessionSecret();

    // SECURITY: Use constant-time verification instead of string comparison.
    // String === comparison leaks information about how many bytes match,
    // allowing an attacker to reconstruct the signature byte-by-byte.
    const isValid = await verifyHmac(payloadB64, signature, secret);
    if (!isValid) {
      return null;
    }
    
    const payloadStr = textDecoder.decode(decodeBase64Url(payloadB64));
    const rawPayload = JSON.parse(payloadStr);

    // SECURITY: Validate payload structure with Zod to prevent injection
    // of unexpected fields or malformed data through crafted tokens.
    const parsed = sessionPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) return null;

    const payload: SessionPayload = parsed.data;
    
    if (Date.now() > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch {
    return null;
  }
}
