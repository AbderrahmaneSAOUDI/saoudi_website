const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getRuntimeEnv = () => globalThis.process?.env as Record<string, string | undefined> | undefined;

const getSessionSecret = () => {
  const runtimeEnv = getRuntimeEnv();
  return (
    runtimeEnv?.FIREBASE_PRIVATE_KEY ||
    import.meta.env.FIREBASE_PRIVATE_KEY ||
    runtimeEnv?.SESSION_SECRET ||
    import.meta.env.SESSION_SECRET ||
    'saoudi-online-dev-secret-key-change-in-production'
  );
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

const signHmac = async (payloadB64: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payloadB64));

  return encodeBase64Url(new Uint8Array(signature));
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
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [payloadB64, signature] = parts;
    const secret = getSessionSecret();
    const expectedSignature = await signHmac(payloadB64, secret);

    if (signature !== expectedSignature) {
      return null;
    }
    
    const payloadStr = textDecoder.decode(decodeBase64Url(payloadB64));
    const payload: SessionPayload = JSON.parse(payloadStr);
    
    if (Date.now() > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}
