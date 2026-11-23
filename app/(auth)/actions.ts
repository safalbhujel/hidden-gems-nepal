'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { validateEmailDomain } from '@/lib/utils/block-burner-emails';

export interface AuthActionResult {
  success?: boolean;
  error?: string;
  email?: string;
  message?: string;
}

// 1. Login Action
export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user has already set a username
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rawRedirectTo = formData.get('redirectedFrom') as string | null;
  const targetDestination =
    rawRedirectTo &&
    rawRedirectTo.startsWith('/') &&
    !rawRedirectTo.startsWith('//') &&
    rawRedirectTo !== '/' &&
    rawRedirectTo !== '/login' &&
    rawRedirectTo !== '/signup'
      ? rawRedirectTo
      : '/profile';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    const hasUsername = Boolean(profile?.username || user.user_metadata?.username);
    if (!hasUsername) {
      redirect(`/choose-username?next=${encodeURIComponent(targetDestination)}`);
    }
  }

  // Redirect directly to Home page or explicit destination
  redirect(targetDestination);
}

// 2. Signup Action
export async function signup(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If auto-logged in, route directly to choose username
  if (data?.user) {
    redirect('/choose-username');
  }

  redirect('/choose-username?message=Account created successfully!');
}

// 3. Save / Choose Username Action
export async function saveUsername(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const rawUsername = formData.get('username') as string | null;

  if (!rawUsername) {
    return { error: 'Please enter a username.' };
  }

  const cleanUsername = rawUsername.trim().toLowerCase();

  // Validate format: 3-20 characters, lowercase alphanumeric and underscore only
  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    return {
      error:
        'Username must be 3-20 characters long and contain only lowercase letters, numbers, and underscores (_).',
    };
  }

  // Check if username is taken by another account
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', cleanUsername)
    .neq('id', user.id)
    .maybeSingle();

  if (existingUser) {
    return { error: 'This handle is already taken. Please pick another one.' };
  }

  // Upsert profile record
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      username: cleanUsername,
      email: user.email,
      full_name: user.user_metadata?.full_name || cleanUsername,
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    console.error('[saveUsername] Profile upsert error:', profileError);
    // If table schema doesn't have an email column or similar, attempt direct update
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: cleanUsername,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return { error: updateError.message };
    }
  }

  // Update auth metadata so session is immediately up to date
  await supabase.auth.updateUser({
    data: { username: cleanUsername },
  });

  // Redirect to requested next page or directly to Profile
  const rawNext = (formData.get('next') as string | null) || '/profile';
  const safeNext =
    rawNext &&
    rawNext.startsWith('/') &&
    !rawNext.startsWith('//') &&
    rawNext !== '/' &&
    rawNext !== '/login' &&
    rawNext !== '/signup'
      ? rawNext
      : '/profile';
  redirect(safeNext);
}

// 4. Logout Action
export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}

// 5. Request Password Reset — sends email with magic link
export async function requestPasswordReset(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    }
  );

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// 6. Reset Password — updates password after user clicks email link
export async function resetPassword(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect('/profile');
}

// ─────────────────────────────────────────────────────────────────────────────
// Passwordless 6-Digit Email OTP System
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 7. Send OTP Action: Validates syntax, blocks disposable burner domains,
 * and requests a 6-digit OTP from Supabase.
 */
export async function sendOtpAction(formData: FormData): Promise<AuthActionResult> {
  const rawEmail = formData.get('email')?.toString();
  const validation = validateEmailDomain(rawEmail || '');

  if (!validation.isValid || !validation.sanitizedEmail) {
    return { error: validation.error || 'Please enter a valid email address.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: validation.sanitizedEmail,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('[sendOtpAction] Supabase error:', error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
      return { error: 'Please wait before requesting another code.' };
    }
    if (msg.includes('error sending')) {
      return { error: 'Unable to deliver verification email. Please verify your email address or check your SMTP settings.' };
    }
    return { error: error.message };
  }

  return { success: true, email: validation.sanitizedEmail };
}

/**
 * 7b. Send Signup OTP Action:
 * - Validates email, blocks disposable burner domains.
 * - Enforces unique email: checks profiles table AND auth.users.
 *   If registered: returns "This email is already registered. Please sign in with your password or use forgot password."
 * - Validates username and checks uniqueness.
 * - Validates password length (>= 6) and matching confirmation.
 * - Dispatches 6-digit OTP from Supabase.
 */
export async function sendSignupOtpAction(formData: FormData): Promise<AuthActionResult> {
  const rawEmail = formData.get('email')?.toString();
  const rawUsername = formData.get('username')?.toString();
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();

  const validation = validateEmailDomain(rawEmail || '');
  if (!validation.isValid || !validation.sanitizedEmail) {
    return { error: validation.error || 'Please enter a valid email address.' };
  }

  const sanitizedEmail = validation.sanitizedEmail;

  // Validate username if provided
  if (rawUsername) {
    const cleanUsername = rawUsername.trim().toLowerCase().replace(/^@/, '');
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return {
        error:
          'Username must be 3-20 characters long and contain only lowercase letters, numbers, and underscores (_).',
      };
    }
  }

  // Validate password if provided
  if (password !== undefined) {
    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { error: 'Passwords do not match.' };
    }
  }

  // Enforce one account per email & check handle uniqueness using privileged admin
  try {
    const admin = createSupabaseAdminClient();

    // 1. Check profiles table for duplicate email
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, email')
      .ilike('email', sanitizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return {
        error:
          'This email is already registered. Please sign in with your password or use forgot password.',
      };
    }

    // 2. Check auth.users directly via admin API
    try {
      const { data: usersData } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const authUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === sanitizedEmail.toLowerCase()
      );
      if (authUser) {
        return {
          error:
            'This email is already registered. Please sign in with your password or use forgot password.',
        };
      }
    } catch (listErr) {
      console.warn('[sendSignupOtpAction] admin.listUsers notice:', listErr);
    }

    // 3. Check username uniqueness in profiles
    if (rawUsername) {
      const cleanUsername = rawUsername.trim().toLowerCase().replace(/^@/, '');
      const { data: existingUsername } = await admin
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (existingUsername) {
        return {
          error: `This explorer handle (@${cleanUsername}) is already taken. Please choose another.`,
        };
      }
    }
  } catch (err) {
    console.warn('[sendSignupOtpAction] Uniqueness check warning:', err);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: sanitizedEmail,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('[sendSignupOtpAction] Supabase error:', error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
      return { error: 'Please wait before requesting another code.' };
    }
    if (msg.includes('error sending')) {
      return {
        error:
          'Unable to deliver verification email. Please verify your email address or check your SMTP settings.',
      };
    }
    return { error: error.message };
  }

  return { success: true, email: sanitizedEmail };
}

/**
 * 7c. Verify and Complete Signup Action:
 * - Validates the 6-digit OTP token and establishes authenticated session.
 * - Sets the user's permanent password.
 * - Saves unique handle (@username) and profile details.
 */
export async function verifyAndCompleteSignupAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const token = formData.get('token')?.toString().trim();
  const password = formData.get('password')?.toString();
  const rawUsername = formData.get('username')?.toString();
  const fullName = formData.get('fullName')?.toString()?.trim();

  if (!email || !token) {
    return { error: 'Enter your 6-digit verification code.' };
  }

  if (token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { error: 'Enter your 6-digit verification code.' };
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const cleanUsername = (rawUsername || email.split('@')[0])
    .trim()
    .toLowerCase()
    .replace(/^@/, '');

  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    return {
      error:
        'Username must be 3-20 characters long and contain only lowercase letters, numbers, and underscores (_).',
    };
  }

  const supabase = await createSupabaseServerClient();

  // 1. Verify OTP token to establish session
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error || !data.user) {
    console.error('[verifyAndCompleteSignupAction] Verification failed:', error?.message);
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('expired')) {
      return { error: 'This code has expired. Request a new one.' };
    }
    if (msg.includes('invalid') || msg.includes('token') || msg.includes('incorrect')) {
      return { error: "That code doesn't look right. Please try again." };
    }
    return { error: error?.message || "That code doesn't look right. Please try again." };
  }

  const user = data.user;

  // 2. Set permanent password and auth metadata
  const { error: authError } = await supabase.auth.updateUser({
    password,
    data: {
      username: cleanUsername,
      full_name: fullName || cleanUsername,
    },
  });

  if (authError) {
    console.error('[verifyAndCompleteSignupAction] Password set error:', authError.message);
    return { error: authError.message };
  }

  // 3. Upsert profile record
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    username: cleanUsername,
    email: user.email || email,
    full_name: fullName || cleanUsername,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.warn('[verifyAndCompleteSignupAction] Profile upsert notice:', profileError.message);
    await supabase
      .from('profiles')
      .update({
        username: cleanUsername,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  }

  return { success: true, email };
}

/**
 * 8b. Verify Signup OTP Action: Validates the 6-digit token and establishes
 * an authenticated session, but does NOT redirect yet, letting the user complete
 * password setup and handle creation.
 */
export async function verifySignupOtpAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const token = formData.get('token')?.toString().trim();

  if (!email || !token) {
    return { error: 'Enter your 6-digit verification code.' };
  }

  if (token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { error: 'Enter your 6-digit verification code.' };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error || !data.user) {
    console.error('[verifySignupOtpAction] Verification failed:', error?.message);
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('expired')) {
      return { error: 'This code has expired. Request a new one.' };
    }
    if (msg.includes('invalid') || msg.includes('token') || msg.includes('incorrect')) {
      return { error: "That code doesn't look right. Please try again." };
    }
    return { error: error?.message || "That code doesn't look right. Please try again." };
  }

  return { success: true, email };
}

/**
 * 8c. Complete Signup Action: Sets the permanent password and unique explorer handle (@username).
 * Next time the user logs in, they log in directly via email & password without needing OTP!
 */
export async function completeSignupAction(formData: FormData): Promise<AuthActionResult> {
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();
  const rawUsername = formData.get('username')?.toString();
  const redirectedFrom = formData.get('redirectedFrom')?.toString() || '/';

  if (!password || !confirmPassword || !rawUsername) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const cleanUsername = rawUsername.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    return {
      error: 'Username must be 3-20 characters long and contain only lowercase letters, numbers, and underscores (_).',
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Session expired. Please restart registration.' };
  }

  // Check if username is already taken by another account
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', cleanUsername)
    .neq('id', user.id)
    .maybeSingle();

  if (existingUser) {
    return { error: 'This handle is already taken. Please choose another.' };
  }

  // 1. Update user password and metadata in Supabase Auth
  const { error: authError } = await supabase.auth.updateUser({
    password,
    data: { username: cleanUsername },
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Upsert profile with clean unique username and email
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    username: cleanUsername,
    email: user.email,
    full_name: cleanUsername,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.warn('[completeSignupAction] Profile upsert warning:', profileError.message);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: cleanUsername,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[completeSignupAction] Profile update error:', updateError.message);
    }
  }

  const targetDestination =
    redirectedFrom &&
    redirectedFrom.startsWith('/') &&
    !redirectedFrom.startsWith('//') &&
    redirectedFrom !== '/' &&
    redirectedFrom !== '/login' &&
    redirectedFrom !== '/signup'
      ? redirectedFrom
      : '/profile';

  redirect(targetDestination);
}

/**
 * 8. Verify OTP Action: Validates the 6-digit token, signs the user in,
 * verifies username state, and redirects accordingly.
 */
export async function verifyOtpAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const token = formData.get('token')?.toString().trim();
  const redirectedFrom = formData.get('redirectedFrom')?.toString() || '/';

  if (!email || !token) {
    return { error: 'Enter your 6-digit verification code.' };
  }

  if (token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { error: 'Enter your 6-digit verification code.' };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error || !data.user) {
    console.error('[verifyOtpAction] Verification failed:', error?.message);
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('expired')) {
      return { error: 'This code has expired. Request a new one.' };
    }
    if (msg.includes('invalid') || msg.includes('token') || msg.includes('incorrect')) {
      return { error: "That code doesn't look right. Please try again." };
    }
    return { error: error?.message || "That code doesn't look right. Please try again." };
  }

  // Check username profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .maybeSingle();

  const hasUsername = Boolean(profile?.username || data.user.user_metadata?.username);
  const targetDestination =
    redirectedFrom &&
    redirectedFrom.startsWith('/') &&
    !redirectedFrom.startsWith('//') &&
    redirectedFrom !== '/' &&
    redirectedFrom !== '/login' &&
    redirectedFrom !== '/signup'
      ? redirectedFrom
      : '/profile';

  if (!hasUsername) {
    redirect(`/choose-username?next=${encodeURIComponent(targetDestination)}`);
  }

  redirect(targetDestination);
}

/**
 * 9. Send Password Reset OTP: Requests a 6-digit code for password recovery.
 */
export async function sendPasswordResetOtpAction(formData: FormData): Promise<AuthActionResult> {
  const rawEmail = formData.get('email')?.toString();
  const validation = validateEmailDomain(rawEmail || '');

  if (!validation.isValid || !validation.sanitizedEmail) {
    return { error: validation.error || 'Please enter a valid email address.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: validation.sanitizedEmail,
    options: {
      shouldCreateUser: false, // Don't create account on password reset
    },
  });

  if (error) {
    console.error('[sendPasswordResetOtpAction] Error:', error.message);
    return { error: error.message };
  }

  return { success: true, email: validation.sanitizedEmail };
}

/**
 * 10. Verify OTP & Set Password: Confirms the 6-digit token and updates password in one step.
 */
export async function verifyOtpAndSetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const token = formData.get('token')?.toString().trim();
  const newPassword = formData.get('newPassword')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();

  if (!email || !token || !newPassword) {
    return { error: 'All fields are required.' };
  }

  if (token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { error: 'Please enter the 6-digit code sent to your email.' };
  }

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const supabase = await createSupabaseServerClient();
  // 1. Verify OTP token
  const { error: otpError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (otpError) {
    console.error('[verifyOtpAndSetPasswordAction] OTP error:', otpError.message);
    return { error: 'Invalid or expired 6-digit code. Please verify the code or request a new one.' };
  }

  // 2. Update password for authenticated session
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  redirect('/profile');
}

/**
 * 11. Send Profile Password OTP: For an active signed-in user wishing to change password
 */
export async function sendProfilePasswordOtpAction(): Promise<AuthActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: 'You must be logged in to update your password.' };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, email: user.email };
}

/**
 * 12. Verify Profile Password OTP & Update Password:
 */
export async function verifyProfilePasswordOtpAction(formData: FormData): Promise<AuthActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: 'You must be logged in to update your password.' };
  }

  const token = formData.get('token')?.toString().trim();
  const newPassword = formData.get('newPassword')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();

  if (!token || !newPassword) {
    return { error: 'Verification code and new password are required.' };
  }

  if (token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { error: 'Please enter the 6-digit code sent to your email.' };
  }

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const { error: otpError } = await supabase.auth.verifyOtp({
    email: user.email,
    token,
    type: 'email',
  });

  if (otpError) {
    return { error: 'Invalid or expired verification code.' };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true, message: 'Password updated successfully.' };
}
