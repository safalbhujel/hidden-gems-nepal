'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth-edge';
import { revalidatePath } from 'next/cache';
import {
  toggleHeartInStore,
  syncPlaceReviewMetrics,
  addExtraCommentForPlace,
  deleteExtraCommentForPlace,
} from '@/lib/supabase/interactions';
import { resolveUserAvatar } from '@/lib/constants/avatars';
import type { Review } from '@/lib/types/places';

export interface UpdatePlaceResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface HeartActionResult {
  success: boolean;
  liked?: boolean;
  count?: number;
  requiresAuth?: boolean;
  error?: string;
}

export interface SaveActionResult {
  success: boolean;
  saved?: boolean;
  requiresAuth?: boolean;
  error?: string;
}

export interface ReviewActionResult {
  success: boolean;
  review?: Review;
  average_rating?: number;
  review_count?: number;
  requiresAuth?: boolean;
  error?: string;
}

export interface DeleteCommentResult {
  success: boolean;
  average_rating?: number;
  review_count?: number;
  error?: string;
}

export async function updatePlaceAction(formData: FormData): Promise<UpdatePlaceResult> {
  const placeId = formData.get('placeId')?.toString();
  if (!placeId) {
    return { success: false, error: 'Missing destination ID.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const { valid: isAdmin } = await verifyAdminSessionToken(adminCookie);

  const dbClient = createSupabaseAdminClient();
  const { data: existingPlace, error: fetchErr } = await dbClient
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
      error:
        'You do not have permission to edit this place. Only the person who shared it or an admin can edit it.',
    };
  }

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
    return { success: false, error: 'Place name and description are required.' };
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
  if (
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    updatePayload.location = `POINT(${longitude} ${latitude})`;
  }

  const statusParam = formData.get('status')?.toString();
  if (isAdmin && statusParam && ['APPROVED', 'PENDING', 'REJECTED'].includes(statusParam)) {
    updatePayload.status = statusParam;
  }

  const { error: updateError } = await dbClient
    .from('places')
    .update(updatePayload)
    .eq('id', placeId);

  if (updateError) {
    console.error('[updatePlaceAction] Update error:', updateError);
    return { success: false, error: updateError.message || 'Failed to update place details.' };
  }

  revalidatePath('/explore');
  revalidatePath(`/places/${existingPlace.slug}`);
  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/admin/gems');
  revalidatePath('/admin/pending');

  return {
    success: true,
    message: 'Place details updated.',
  };
}

/**
 * Toggle a heart reaction for the signed-in user on a place.
 */
export async function togglePlaceHeartAction(
  placeId: string,
  slug?: string
): Promise<HeartActionResult> {
  if (!placeId) {
    return { success: false, error: 'Missing place ID.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, requiresAuth: true, error: 'Sign in to react with a heart.' };
  }

  const res = await toggleHeartInStore(placeId, user.id);
  if (!res.ok) {
    return { success: false, error: 'Could not save your reaction. Please try again.' };
  }

  revalidatePath('/');
  revalidatePath('/explore');
  if (slug) revalidatePath(`/places/${slug}`);

  return {
    success: true,
    liked: res.liked,
    count: res.count,
  };
}

/**
 * Toggle saved bookmark for the signed-in user in `saved_places`.
 */
export async function togglePlaceSaveAction(
  placeId: string,
  slug?: string
): Promise<SaveActionResult> {
  if (!placeId) {
    return { success: false, error: 'Missing place ID.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, requiresAuth: true, error: 'Sign in to save places.' };
  }

  const dbClient = createSupabaseAdminClient();
  const { data: existing } = await dbClient
    .from('saved_places')
    .select('place_id')
    .eq('place_id', placeId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await dbClient
      .from('saved_places')
      .delete()
      .eq('place_id', placeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[togglePlaceSaveAction] delete error:', error.message);
      return { success: false, error: 'Could not remove saved spot.' };
    }

    revalidatePath('/');
    revalidatePath('/explore');
    revalidatePath('/profile');
    if (slug) revalidatePath(`/places/${slug}`);
    return { success: true, saved: false };
  }

  const { error } = await dbClient
    .from('saved_places')
    .insert({ place_id: placeId, user_id: user.id });

  if (error) {
    console.error('[togglePlaceSaveAction] insert error:', error.message);
    return { success: false, error: 'Could not save spot right now.' };
  }

  revalidatePath('/');
  revalidatePath('/explore');
  revalidatePath('/profile');
  if (slug) revalidatePath(`/places/${slug}`);
  return { success: true, saved: true };
}

/**
 * Submit or update a star rating and/or comment on a place.
 * Handles Postgres `reviews` (1 rating+review per user per place, syncing
 * `places.average_rating` and `places.review_count`) AND follow-up community
 * comments so travelers can both rate and continue commenting smoothly.
 */
export async function submitPlaceReviewAction(input: {
  placeId: string;
  slug?: string;
  rating: number;
  comment: string;
}): Promise<ReviewActionResult> {
  const { placeId, slug, rating, comment } = input;
  if (!placeId) {
    return { success: false, error: 'Missing place ID.' };
  }

  const cleanComment = comment.trim();
  const safeRating = Math.min(5, Math.max(1, Math.round(rating || 5)));

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      requiresAuth: true,
      error: 'Please sign in to rate or leave a comment.',
    };
  }

  const dbClient = createSupabaseAdminClient();

  // Fetch user profile for accurate avatar & display handle
  const { data: profileRow } = await dbClient
    .from('profiles')
    .select('username, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const displayUsername =
    profileRow?.username ||
    (typeof user.user_metadata?.username === 'string' ? user.user_metadata.username : null) ||
    user.email?.split('@')[0] ||
    'traveler';
  const displayFullName =
    profileRow?.full_name ||
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
    displayUsername;
  const { avatarUrl } = resolveUserAvatar(profileRow?.avatar_url, user.user_metadata);

  // Check if user already has a Postgres review row for this place
  const { data: existingReview } = await dbClient
    .from('reviews')
    .select('id, rating, comment')
    .eq('place_id', placeId)
    .eq('user_id', user.id)
    .maybeSingle();

  // Case 1: First review/rating for this user -> write directly to `reviews`
  if (!existingReview) {
    const { data: inserted, error: insertErr } = await dbClient
      .from('reviews')
      .insert({
        place_id: placeId,
        user_id: user.id,
        rating: safeRating,
        comment: cleanComment || null,
      })
      .select('id, place_id, user_id, rating, comment, created_at')
      .single();

    if (insertErr || !inserted) {
      console.error('[submitPlaceReviewAction] insert error:', insertErr?.message);
      return { success: false, error: 'Could not save your review. Please try again.' };
    }

    const metrics = await syncPlaceReviewMetrics(placeId);

    revalidatePath('/');
    revalidatePath('/explore');
    revalidatePath('/profile');
    if (slug) revalidatePath(`/places/${slug}`);

    return {
      success: true,
      review: {
        ...inserted,
        source: 'review',
        profiles: {
          username: displayUsername,
          full_name: displayFullName,
          avatar_url: avatarUrl,
        },
      },
      average_rating: metrics.average_rating,
      review_count: metrics.review_count,
    };
  }

  // Case 2: Existing review row — if comment is empty or updating existing review without new text,
  // update the Postgres review rating; if posting a new distinct comment text, update rating if valid
  // AND add a follow-up comment so nothing gets overwritten silently.
  if (!cleanComment || existingReview.comment === cleanComment || !existingReview.comment) {
    const { data: updated, error: updErr } = await dbClient
      .from('reviews')
      .update({
        rating: safeRating,
        comment: cleanComment || existingReview.comment || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingReview.id)
      .select('id, place_id, user_id, rating, comment, created_at')
      .single();

    if (updErr || !updated) {
      console.error('[submitPlaceReviewAction] update error:', updErr?.message);
      return { success: false, error: 'Could not update your rating.' };
    }

    const metrics = await syncPlaceReviewMetrics(placeId);

    revalidatePath('/');
    revalidatePath('/explore');
    revalidatePath('/profile');
    if (slug) revalidatePath(`/places/${slug}`);

    return {
      success: true,
      review: {
        ...updated,
        source: 'review',
        profiles: {
          username: displayUsername,
          full_name: displayFullName,
          avatar_url: avatarUrl,
        },
      },
      average_rating: metrics.average_rating,
      review_count: metrics.review_count,
    };
  }

  // User already wrote a review previously AND is now adding another comment!
  if (rating >= 1 && rating <= 5 && rating !== existingReview.rating) {
    await dbClient
      .from('reviews')
      .update({ rating: safeRating, updated_at: new Date().toISOString() })
      .eq('id', existingReview.id);
  }
  const metrics = await syncPlaceReviewMetrics(placeId);

  const extraId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const saved = await addExtraCommentForPlace({
    id: extraId,
    place_id: placeId,
    user_id: user.id,
    username: displayUsername,
    full_name: displayFullName,
    avatar_url: avatarUrl,
    rating: rating >= 1 && rating <= 5 ? safeRating : null,
    comment: cleanComment,
    created_at: createdAt,
  });

  if (!saved) {
    return { success: false, error: 'Could not post comment right now. Please try again.' };
  }

  revalidatePath('/');
  revalidatePath('/explore');
  if (slug) revalidatePath(`/places/${slug}`);

  return {
    success: true,
    review: {
      id: extraId,
      place_id: placeId,
      user_id: user.id,
      rating: rating >= 1 && rating <= 5 ? safeRating : 0,
      comment: cleanComment,
      created_at: createdAt,
      source: 'comment',
      profiles: {
        username: displayUsername,
        full_name: displayFullName,
        avatar_url: avatarUrl,
      },
    },
    average_rating: metrics.average_rating,
    review_count: metrics.review_count,
  };
}

/**
 * Delete own review or follow-up comment (or admin delete).
 */
export async function deletePlaceCommentAction(input: {
  placeId: string;
  commentId: string;
  source?: 'review' | 'comment';
  slug?: string;
}): Promise<DeleteCommentResult> {
  const { placeId, commentId, source = 'review', slug } = input;
  if (!placeId || !commentId) {
    return { success: false, error: 'Missing identifiers.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const { valid: isAdmin } = await verifyAdminSessionToken(adminCookie);

  if (!user && !isAdmin) {
    return { success: false, error: 'Sign in required.' };
  }

  const userId = user?.id || '';

  if (source === 'comment') {
    const res = await deleteExtraCommentForPlace(placeId, commentId, userId, isAdmin);
    if (!res.deleted) {
      return { success: false, error: 'Could not delete comment.' };
    }
    revalidatePath('/');
    revalidatePath('/explore');
    if (slug) revalidatePath(`/places/${slug}`);
    return { success: true };
  }

  const dbClient = createSupabaseAdminClient();
  const { data: revRow } = await dbClient
    .from('reviews')
    .select('id, user_id')
    .eq('id', commentId)
    .maybeSingle();

  if (!revRow) {
    return { success: false, error: 'Review not found.' };
  }

  if (!isAdmin && revRow.user_id !== userId) {
    return { success: false, error: 'You can only delete your own review.' };
  }

  const { error: delErr } = await dbClient.from('reviews').delete().eq('id', commentId);
  if (delErr) {
    return { success: false, error: 'Failed to delete review.' };
  }

  const metrics = await syncPlaceReviewMetrics(placeId);

  revalidatePath('/');
  revalidatePath('/explore');
  revalidatePath('/profile');
  if (slug) revalidatePath(`/places/${slug}`);

  return {
    success: true,
    average_rating: metrics.average_rating,
    review_count: metrics.review_count,
  };
}
