// lib/admin/auth-actions.ts

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getActiveAdminCredentials,
  hashString,
  saveAdminCredentials,
  getAdminSession,
} from './auth';

export interface AdminAuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Handle admin login authentication
 */
export async function loginAdminAction(
  prevState: AdminAuthResult | null,
  formData: FormData
): Promise<AdminAuthResult> {
  const username = (formData.get('username') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();
  const redirectedFrom = (formData.get('redirectedFrom') as string || '/admin/dashboard').trim();

  if (!username || !password) {
    return { success: false, error: 'Please enter both Admin ID and Password.' };
  }

  const activeCreds = await getActiveAdminCredentials();
  const inputHash = await hashString(password);

  if (username.toLowerCase() !== activeCreds.username.toLowerCase() || inputHash !== activeCreds.passwordHash) {
    // Artificial slight delay to prevent timing brute-force attacks
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: false, error: 'Invalid administrative credentials. Access denied.' };
  }

  // Create session token and set secure HTTP-only cookie
  const sessionToken = await createAdminSessionToken(activeCreds.username);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  const target = redirectedFrom.startsWith('/admin') ? redirectedFrom : '/admin/dashboard';
  redirect(target);
}

/**
 * Log out of admin console
 */
export async function logoutAdminAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect('/admin/login');
}

/**
 * Change Admin ID and Password from /admin/settings
 */
export async function changeAdminCredentialsAction(
  formData: FormData
): Promise<AdminAuthResult> {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return { success: false, error: 'Unauthorized. You must be logged in as admin.' };
  }

  const currentPassword = (formData.get('currentPassword') as string || '').trim();
  const newUsername = (formData.get('newUsername') as string || '').trim();
  const newPassword = (formData.get('newPassword') as string || '').trim();
  const confirmPassword = (formData.get('confirmPassword') as string || '').trim();

  if (!currentPassword || !newUsername || !newPassword) {
    return { success: false, error: 'All fields are required.' };
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'New password and confirmation do not match.' };
  }

  const activeCreds = await getActiveAdminCredentials();
  const currentInputHash = await hashString(currentPassword);

  if (currentInputHash !== activeCreds.passwordHash) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  const saved = await saveAdminCredentials(newUsername, newPassword);
  if (!saved) {
    return { success: false, error: 'Failed to write updated credentials. Please try again.' };
  }

  // Re-issue updated session token with new username
  const sessionToken = await createAdminSessionToken(newUsername);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return {
    success: true,
    message: `Admin credentials successfully updated! New ID: ${newUsername}`,
  };
}
