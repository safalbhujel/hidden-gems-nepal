'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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
