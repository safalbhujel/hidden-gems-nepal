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

export async function uploadAvatar(
  formData: FormData
): Promise<{ success?: boolean; error?: string; avatarUrl?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update your avatar.' };
  }

  const file = formData.get('avatar_file') as File | null;
  if (!file || typeof file.size !== 'number' || file.size === 0) {
    return { error: 'Please choose an image file to upload.' };
  }

  // Max 8MB
  if (file.size > 8 * 1024 * 1024) {
    return { error: 'Image size must be less than 8MB.' };
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-avatars')
    .upload(cleanName, file, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('[uploadAvatar] Storage upload error:', uploadError);
    return { error: uploadError.message || 'Failed to upload image. Please try again.' };
  }

  const { data: pubData } = supabase.storage
    .from('profile-avatars')
    .getPublicUrl(cleanName);

  if (!pubData?.publicUrl) {
    return { error: 'Failed to generate public URL for uploaded photo.' };
  }

  const publicUrl = pubData.publicUrl;

  const { error: dbError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (dbError) {
    console.error('[uploadAvatar] Database update error:', dbError);
    return { error: dbError.message };
  }

  // Sync auth user metadata
  await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });

  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true, avatarUrl: publicUrl };
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
