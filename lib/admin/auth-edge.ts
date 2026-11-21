// lib/admin/auth-edge.ts
// Pure Web-Crypto Edge-compatible token verification (no Node fs/path dependencies)

export const ADMIN_COOKIE_NAME = 'hgn_admin_session';

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'hgn_vault_master_key_nepal_32_chars_long';

/**
 * Generate HMAC signature using Web Crypto (100% Edge & Node compatible)
 */
async function generateHmac(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const hashArray = Array.from(new Uint8Array(sig));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify an admin session token in Edge runtime (Middleware)
 */
export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<{ valid: boolean; username?: string }> {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false };
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return { valid: false };
  }

  try {
    const expectedSignature = await generateHmac(encodedPayload, SESSION_SECRET);
    if (signature !== expectedSignature) {
      return { valid: false };
    }

    // Decode base64url payload
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);

    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false }; // Expired
    }

    if (payload.role !== 'admin') {
      return { valid: false };
    }

    return { valid: true, username: payload.sub };
  } catch {
    return { valid: false };
  }
}
