'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateAvatar(avatarUrl: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update your avatar.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[updateAvatar] Supabase error:', error);
    return { error: error.message };
  }

  // Update auth metadata
  await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updateProfile(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update your profile.' };
  }

  const rawUsername = formData.get('username')?.toString();
  const fullName = formData.get('fullName')?.toString().trim();
  const bio = formData.get('bio')?.toString().trim();

  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (rawUsername) {
    const cleanUsername = rawUsername.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return {
        error:
          'Username must be 3-20 characters long and contain only lowercase letters, numbers, and underscores (_).',
      };
    }

    // Check if username taken by someone else
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .neq('id', user.id)
      .maybeSingle();

    if (existingUser) {
      return { error: 'This handle is already taken. Please choose another.' };
    }

    updates.username = cleanUsername;
  }

  if (fullName !== undefined) updates.full_name = fullName;
  if (bio !== undefined) updates.bio = bio;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('[updateProfile] Supabase error:', error);
    return { error: error.message };
  }

  // Sync auth user metadata
  await supabase.auth.updateUser({
    data: {
      ...(updates.username ? { username: updates.username } : {}),
      ...(fullName ? { full_name: fullName } : {}),
    },
  });

  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true };
}
