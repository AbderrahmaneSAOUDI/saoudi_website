import crypto from 'node:crypto';

// Use FIREBASE_PRIVATE_KEY as the HMAC secret, falling back to a session secret or developer secret
const getSessionSecret = () => {
  const secret = process.env.FIREBASE_PRIVATE_KEY || import.meta.env.FIREBASE_PRIVATE_KEY || process.env.SESSION_SECRET || import.meta.env.SESSION_SECRET || 'saoudi-online-dev-secret-key-change-in-production';
  return secret;
};

export interface SessionPayload {
  email: string;
  exp: number;
}

/**
 * Creates a signed JWT-like session token with a 7-day expiration.
 */
export function createSessionToken(email: string): string {
  const secret = getSessionSecret();
  // 7 days expiration
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload: SessionPayload = { email, exp };
  
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
    
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed session token. Returns the payload if valid, or null otherwise.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [payloadB64, signature] = parts;
    const secret = getSessionSecret();
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(payloadStr);
    
    if (Date.now() > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}
