// lib/admin/auth.ts

import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from './auth-edge';

export { ADMIN_COOKIE_NAME, verifyAdminSessionToken };

// Default initial credentials (changeable via /admin/settings or environment variables)
export const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminNepal2026!';
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'hgn_vault_master_key_nepal_32_chars_long';

const CREDENTIALS_FILE_PATH = path.join(process.cwd(), 'lib', 'admin', 'admin-credentials.json');

export interface AdminCredentials {
  username: string;
  passwordHash: string;
  updatedAt: string;
}

/**
 * SHA-256 hash helper using Web Crypto (Edge + Node compatible)
 */
export async function hashString(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate HMAC signature for session token
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
 * Read current active admin credentials
 */
export async function getActiveAdminCredentials(): Promise<{ username: string; passwordHash: string }> {
  try {
    if (fs.existsSync(CREDENTIALS_FILE_PATH)) {
      const fileData = fs.readFileSync(CREDENTIALS_FILE_PATH, 'utf-8');
      const parsed: AdminCredentials = JSON.parse(fileData);
      if (parsed.username && parsed.passwordHash) {
        return { username: parsed.username, passwordHash: parsed.passwordHash };
      }
    }
  } catch (err) {
    console.warn('[auth] Could not read credentials file, falling back to defaults:', err);
  }

  // Fallback to defaults / environment variables
  const defaultHash = await hashString(DEFAULT_ADMIN_PASSWORD);
  return {
    username: DEFAULT_ADMIN_USERNAME,
    passwordHash: defaultHash,
  };
}

/**
 * Save new admin credentials (changeable ID and password)
 */
export async function saveAdminCredentials(newUsername: string, newPasswordPlain: string): Promise<boolean> {
  try {
    const passwordHash = await hashString(newPasswordPlain);
    const data: AdminCredentials = {
      username: newUsername.trim(),
      passwordHash,
      updatedAt: new Date().toISOString(),
    };

    const dir = path.dirname(CREDENTIALS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(CREDENTIALS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[auth] Failed to save updated admin credentials:', err);
    return false;
  }
}

/**
 * Create a signed admin session token: base64(payload).signature
 */
export async function createAdminSessionToken(username: string): Promise<string> {
  const payload = {
    sub: username,
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payloadStr = JSON.stringify(payload);
  const encodedPayload = Buffer.from(payloadStr, 'utf-8').toString('base64url');
  const signature = await generateHmac(encodedPayload, SESSION_SECRET);

  return `${encodedPayload}.${signature}`;
}

/**
 * Check admin session in Server Components and Layouts
 */
export async function getAdminSession(): Promise<{ authenticated: boolean; username?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!sessionCookie?.value) {
      return { authenticated: false };
    }

    const verification = await verifyAdminSessionToken(sessionCookie.value);
    return { authenticated: verification.valid, username: verification.username };
  } catch {
    return { authenticated: false };
  }
}
