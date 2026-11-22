'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth-edge';
import { revalidatePath } from 'next/cache';

export interface UpdatePlaceResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function updatePlaceAction(formData: FormData): Promise<UpdatePlaceResult> {
  const placeId = formData.get('placeId')?.toString();
  if (!placeId) {
    return { success: false, error: 'Missing destination ID.' };
  }

  // 1. Identify User Session
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Identify Admin Session
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const { valid: isAdmin } = await verifyAdminSessionToken(adminCookie);

  // 3. Check existing place
  const { data: existingPlace, error: fetchErr } = await supabase
    .from('places')
    .select('id, slug, submitted_by, status')
    .eq('id', placeId)
    .single();

  if (fetchErr || !existingPlace) {
    return { success: false, error: 'Destination not found or unavailable.' };
  }

  const isAuthor = Boolean(user && user.id === existingPlace.submitted_by);
  if (!isAuthor && !isAdmin) {
    return {
      success: false,
      error: 'You do not have authorization to edit this destination. Only the contributor or an administrator may modify it.',
    };
  }

  // 4. Parse Form Inputs
  const name = formData.get('name')?.toString().trim();
  const category_id = formData.get('category_id')?.toString() || null;
  const district_id = formData.get('district_id')?.toString() || null;
  const description = formData.get('description')?.toString().trim();
  const why_special = formData.get('why_special')?.toString().trim();
  const hidden_score_raw = formData.get('hidden_score')?.toString();
  const best_season = formData.get('best_season')?.toString().trim() || null;
  const budget = formData.get('budget')?.toString().trim() || null;
  const travel_tips = formData.get('travel_tips')?.toString().trim() || null;
  const map_url = formData.get('map_url')?.toString().trim() || null;
  const latStr = formData.get('latitude')?.toString();
  const lngStr = formData.get('longitude')?.toString();

  if (!name || !description) {
    return { success: false, error: 'Destination name and description are required.' };
  }

  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;
  const hidden_score = hidden_score_raw ? parseInt(hidden_score_raw, 10) : undefined;

  const updatePayload: Record<string, unknown> = {
    name,
    description,
    why_special: why_special || null,
    category_id,
    district_id,
    best_season,
    budget,
    travel_tips,
    map_url,
    updated_at: new Date().toISOString(),
  };

  if (hidden_score !== undefined && !isNaN(hidden_score)) {
    updatePayload.hidden_score = Math.min(100, Math.max(1, hidden_score));
  }
  if (latitude !== null && !isNaN(latitude)) {
    updatePayload.latitude = latitude;
  }
  if (longitude !== null && !isNaN(longitude)) {
    updatePayload.longitude = longitude;
  }
  if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
    updatePayload.location = `POINT(${longitude} ${latitude})`;
  }

  // If edited by admin, allow updating status if passed
  const statusParam = formData.get('status')?.toString();
  if (isAdmin && statusParam && ['APPROVED', 'PENDING', 'REJECTED'].includes(statusParam)) {
    updatePayload.status = statusParam;
  }

  // 5. Commit Update using Admin Client to bypass RLS policies safely
  const dbClient = createSupabaseAdminClient();
  const { error: updateError } = await dbClient
    .from('places')
    .update(updatePayload)
    .eq('id', placeId);

  if (updateError) {
    console.error('[updatePlaceAction] Update error:', updateError);
    return { success: false, error: updateError.message || 'Failed to update place details.' };
  }

  // 6. Revalidate all cached views
  revalidatePath('/explore');
  revalidatePath(`/places/${existingPlace.slug}`);
  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/admin/gems');
  revalidatePath('/admin/pending');

  return {
    success: true,
    message: 'Destination details updated successfully.',
  };
}
