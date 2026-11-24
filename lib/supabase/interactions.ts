// lib/supabase/interactions.ts
// Server-only storage & sync helpers for place heart reactions, follow-up comments,
// and review average recalculation. Uses SUPABASE_SERVICE_ROLE_KEY via admin client.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'place-videos';
const HEARTS_OBJECT_PATH = '_system/place_hearts.json';
const COMMENTS_PREFIX = '_system/comments';
const COMMENT_COUNTS_PATH = '_system/comment_counts.json';

export interface ExtraPlaceComment {
  id: string;
  place_id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  rating: number | null;
  comment: string;
  created_at: string;
}

type HeartsIndex = Record<string, string[]>;
type CommentCountsIndex = Record<string, number>;

async function downloadJsonObject<T>(path: string, fallback: T): Promise<T> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) {
      return fallback;
    }
    const text = await data.text();
    const parsed = JSON.parse(text);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

async function uploadJsonObject(path: string, payload: unknown): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '0',
  });
  if (error) {
    console.error(`[interactions] Failed to write ${path}:`, error.message);
    return false;
  }
  return true;
}

export async function getHeartIndex(): Promise<HeartsIndex> {
  return downloadJsonObject<HeartsIndex>(HEARTS_OBJECT_PATH, {});
}

export async function toggleHeartInStore(
  placeId: string,
  userId: string
): Promise<{ liked: boolean; count: number; ok: boolean }> {
  const index = await getHeartIndex();
  const current = Array.isArray(index[placeId]) ? index[placeId] : [];
  const exists = current.includes(userId);
  const updated = exists
    ? current.filter((id) => id !== userId)
    : Array.from(new Set([...current, userId]));

  index[placeId] = updated;
  const ok = await uploadJsonObject(HEARTS_OBJECT_PATH, index);
  return {
    liked: !exists,
    count: updated.length,
    ok,
  };
}

export async function getExtraCommentCounts(): Promise<CommentCountsIndex> {
  return downloadJsonObject<CommentCountsIndex>(COMMENT_COUNTS_PATH, {});
}

export async function getExtraCommentsForPlace(
  placeId: string
): Promise<ExtraPlaceComment[]> {
  const list = await downloadJsonObject<ExtraPlaceComment[]>(
    `${COMMENTS_PREFIX}/${placeId}.json`,
    []
  );
  return Array.isArray(list) ? list : [];
}

export async function addExtraCommentForPlace(
  commentItem: ExtraPlaceComment
): Promise<boolean> {
  const path = `${COMMENTS_PREFIX}/${commentItem.place_id}.json`;
  const existing = await getExtraCommentsForPlace(commentItem.place_id);
  const updated = [commentItem, ...existing];
  const savedList = await uploadJsonObject(path, updated);
  if (!savedList) return false;

  const counts = await getExtraCommentCounts();
  counts[commentItem.place_id] = updated.length;
  await uploadJsonObject(COMMENT_COUNTS_PATH, counts);
  return true;
}

export async function deleteExtraCommentForPlace(
  placeId: string,
  commentId: string,
  userId: string,
  isAdmin: boolean
): Promise<{ deleted: boolean; remainingCount: number }> {
  const path = `${COMMENTS_PREFIX}/${placeId}.json`;
  const existing = await getExtraCommentsForPlace(placeId);
  const target = existing.find((c) => c.id === commentId);
  if (!target) {
    return { deleted: false, remainingCount: existing.length };
  }
  if (!isAdmin && target.user_id !== userId) {
    return { deleted: false, remainingCount: existing.length };
  }

  const updated = existing.filter((c) => c.id !== commentId);
  const ok = await uploadJsonObject(path, updated);
  if (!ok) {
    return { deleted: false, remainingCount: existing.length };
  }

  const counts = await getExtraCommentCounts();
  counts[placeId] = updated.length;
  await uploadJsonObject(COMMENT_COUNTS_PATH, counts);
  return { deleted: true, remainingCount: updated.length };
}

/**
 * Recomputes average_rating and review_count from the Postgres `reviews` table
 * and updates `places` directly so card & page aggregates always reflect truth.
 */
export async function syncPlaceReviewMetrics(
  placeId: string
): Promise<{ average_rating: number; review_count: number }> {
  const supabase = createSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('place_id', placeId);

  if (error) {
    console.error('[syncPlaceReviewMetrics] Query error:', error.message);
    return { average_rating: 0, review_count: 0 };
  }

  const validRatings = (rows ?? [])
    .map((r) => Number(r.rating))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);

  const review_count = validRatings.length;
  const average_rating =
    review_count > 0
      ? Number(
          (validRatings.reduce((acc, n) => acc + n, 0) / review_count).toFixed(2)
        )
      : 0;

  const { error: updErr } = await supabase
    .from('places')
    .update({
      average_rating,
      review_count,
      updated_at: new Date().toISOString(),
    })
    .eq('id', placeId);

  if (updErr) {
    console.error('[syncPlaceReviewMetrics] Update error:', updErr.message);
  }

  return { average_rating, review_count };
}
