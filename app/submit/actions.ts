'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SubmitPlaceState {
  error?: string;
  success?: boolean;
}

export async function submitPlace(formData: FormData): Promise<SubmitPlaceState> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to submit a hidden gem.' };
  }

  const name = formData.get('name')?.toString().trim();
  const category_id = formData.get('category_id')?.toString() || null;
  const district_id = formData.get('district_id')?.toString() || null;
  const description = formData.get('description')?.toString().trim();
  const why_special = formData.get('why_special')?.toString().trim();
  const address = formData.get('address')?.toString().trim() || null;
  const latStr = formData.get('latitude')?.toString();
  const lngStr = formData.get('longitude')?.toString();
  const budget = formData.get('budget')?.toString() || null;
  const best_season = formData.get('best_season')?.toString() || null;
  const travel_tips = formData.get('travel_tips')?.toString().trim() || null;

  if (!name || !description || !why_special) {
    return { error: 'Please fill in all required fields (Name, Description, Why Special).' };
  }

  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;

  // Generate URL slug from name
  const slugBase = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const slug = `${slugBase}-${Math.random().toString(36).substring(2, 7)}`;

  // PostGIS location point
  const location =
    longitude !== null && latitude !== null
      ? `POINT(${longitude} ${latitude})`
      : null;

  const { error: insertError } = await supabase.from('places').insert({
    name,
    slug,
    description,
    why_special,
    category_id,
    district_id,
    submitted_by: user.id,
    location,
    latitude,
    longitude,
    map_url: address,
    budget,
    best_season,
    travel_tips,
    status: 'PENDING',
    hidden_score: Math.floor(Math.random() * 20) + 75, // Starting score range for review
  });

  if (insertError) {
    console.error('[submitPlace] Error inserting place:', insertError);
    return { error: insertError.message || 'Failed to submit place. Please try again.' };
  }

  revalidatePath('/explore');
  return { success: true };
}
