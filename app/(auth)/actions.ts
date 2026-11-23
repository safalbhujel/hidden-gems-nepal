'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
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
    rawRedirectTo && rawRedirectTo !== '/profile' ? rawRedirectTo : '/';

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
  const next = (formData.get('next') as string | null) || '/';

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

  // Redirect to requested next page or directly to Home
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
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

  redirect('/');
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
      return { error: 'Please wait 60 seconds before requesting another verification code.' };
    }
    if (msg.includes('error sending')) {
      return { error: 'Unable to deliver verification email. Please verify your email address or check your SMTP settings.' };
    }
    return { error: error.message };
  }

  return { success: true, email: validation.sanitizedEmail };
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
    return { error: 'Email and 6-digit code are required.' };
  }

  if (token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { error: 'Please enter a valid 6-digit verification code.' };
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
      return { error: 'This verification code has expired. Please tap resend below for a fresh code.' };
    }
    if (msg.includes('invalid') || msg.includes('token')) {
      return { error: 'Incorrect verification code. Please check your email and try again.' };
    }
    return { error: error?.message || 'Verification could not be completed. Please try again.' };
  }

  // Check username profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .maybeSingle();

  const hasUsername = Boolean(profile?.username || data.user.user_metadata?.username);
  const targetDestination =
    redirectedFrom !== '/profile' && redirectedFrom.startsWith('/') ? redirectedFrom : '/';

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

  redirect('/');
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
