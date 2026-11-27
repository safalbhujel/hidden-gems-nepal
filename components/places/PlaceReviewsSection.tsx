'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  MessageCircle,
  Send,
  Loader2,
  Trash2,
  User,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  submitPlaceReviewAction,
  deletePlaceCommentAction,
} from '@/app/places/actions';
import { resolveUserAvatar } from '@/lib/constants/avatars';
import type { Review } from '@/lib/types/places';
import { cn } from '@/lib/utils';

interface PlaceReviewsSectionProps {
  placeId: string;
  placeSlug: string;
  initialReviews: Review[];
  initialAverageRating: number;
  initialReviewCount: number;
  currentUserId: string | null;
  isAdmin?: boolean;
  compact?: boolean;
  onStatsChange?: (averageRating: number, reviewCount: number, totalComments: number) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Not worth it',
  2: 'Okay',
  3: 'Nice spot',
  4: 'Great place',
  5: 'Must visit',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kathmandu',
  });
}

export function PlaceReviewsSection({
  placeId,
  placeSlug,
  initialReviews,
  initialAverageRating,
  initialReviewCount,
  currentUserId,
  isAdmin = false,
  compact = false,
  onStatsChange,
}: PlaceReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [avgRating, setAvgRating] = useState<number>(initialAverageRating);
  const [reviewCount, setReviewCount] = useState<number>(initialReviewCount);

  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const activeStar = hoveredRating ?? selectedRating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || isPending) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await submitPlaceReviewAction({
        placeId,
        slug: placeSlug,
        rating: selectedRating,
        comment: commentText,
      });

      if (!res.success || !res.review) {
        setFeedback({
          type: 'error',
          text: res.error || 'Could not post your comment. Please try again.',
        });
        return;
      }

      const newEntry = res.review;
      let nextReviews: Review[];
      const existingIdx = reviews.findIndex(
        (r) => r.id === newEntry.id && r.source === newEntry.source
      );
      if (existingIdx >= 0) {
        nextReviews = reviews.map((r, i) => (i === existingIdx ? newEntry : r));
      } else {
        nextReviews = [newEntry, ...reviews];
      }

      const nextAvg = res.average_rating ?? avgRating;
      const nextRevCount = res.review_count ?? reviewCount;
      setReviews(nextReviews);
      setAvgRating(nextAvg);
      setReviewCount(nextRevCount);
      setCommentText('');
      setFeedback({
        type: 'success',
        text: 'Shared! Thanks for helping fellow travelers.',
      });
      onStatsChange?.(nextAvg, nextRevCount, nextReviews.length);
      setTimeout(() => setFeedback(null), 3000);
    });
  };

  const handleDelete = (item: Review) => {
    if (isPending) return;
    startTransition(async () => {
      const res = await deletePlaceCommentAction({
        placeId,
        commentId: item.id,
        source: item.source ?? 'review',
        slug: placeSlug,
      });

      if (res.success) {
        const nextReviews = reviews.filter((r) => r.id !== item.id);
        const nextAvg = res.average_rating ?? avgRating;
        const nextRevCount = res.review_count ?? reviewCount;
        setReviews(nextReviews);
        setAvgRating(nextAvg);
        setReviewCount(nextRevCount);
        onStatsChange?.(nextAvg, nextRevCount, nextReviews.length);
      }
    });
  };

  return (
    <section className={cn('space-y-5', compact && 'space-y-3')} aria-label="Ratings and Comments">
      {!compact && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold">
              Ratings &amp; Comments
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({reviews.length})
              </span>
            </h2>
            {reviewCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>{avgRating.toFixed(1)} avg</span>
                <span className="font-normal text-muted-foreground">
                  from {reviewCount} {reviewCount === 1 ? 'rating' : 'ratings'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Composer Box */}
      {currentUserId ? (
        <form
          onSubmit={handleSubmit}
          className={cn(
            'rounded-2xl border border-border bg-card space-y-3',
            compact ? 'p-3' : 'p-5'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">
              Rate this spot
            </span>

            {/* Interactive Star Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= activeStar;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      aria-label={`Rate ${star} out of 5 stars`}
                      className="p-0.5 transition-transform duration-150 hover:scale-115 active:scale-95 cursor-pointer"
                    >
                      <Star
                        className={cn(
                          compact ? 'h-4 w-4' : 'h-5 w-5',
                          'transition-colors duration-150',
                          filled
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-muted-foreground/35 hover:text-amber-400'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-primary min-w-[76px] text-right">
                {RATING_LABELS[activeStar]}
              </span>
            </div>
          </div>

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={compact ? 2 : 3}
            placeholder="Share how the trail was, road condition, or a quick tip for others..."
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          />

          {feedback && (
            <p
              className={cn(
                'text-xs font-semibold',
                feedback.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              )}
            >
              {feedback.text}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="submit"
              size={compact ? 'sm' : 'default'}
              disabled={isPending}
              className="gap-1.5 rounded-xl font-semibold cursor-pointer active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{commentText.trim() ? 'Post Rating & Comment' : 'Save Rating'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div
          className={cn(
            'rounded-2xl border border-dashed border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
            compact ? 'p-3' : 'p-5'
          )}
        >
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              Visited this spot?
            </p>
            <p className="text-xs text-muted-foreground">
              Sign in to leave a star rating or share a comment.
            </p>
          </div>
          <Link href={`/login?redirectedFrom=${encodeURIComponent(`/places/${placeSlug}`)}`}>
            <Button size="sm" className="rounded-xl font-semibold gap-1.5 shrink-0">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Sign in to Comment</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Comments Feed */}
      {!compact && (
        <>
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center border rounded-2xl bg-muted/30">
              <Star className="h-10 w-10 mb-3 text-muted-foreground/30" aria-hidden="true" />
              <p className="font-semibold mb-1">No comments yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first traveler to rate and share a note about this spot.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {reviews.map((review) => {
                const { avatarUrl } = resolveUserAvatar(review.profiles?.avatar_url, null);
                const displayName = review.profiles?.username
                  ? `@${review.profiles.username}`
                  : review.profiles?.full_name || 'Traveler';
                const canDelete = Boolean(
                  isAdmin || (currentUserId && review.user_id === currentUserId)
                );

                return (
                  <article
                    key={review.id}
                    className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-2.5 animate-in fade-in-0 duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted border border-border/60 flex items-center justify-center">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={displayName}
                              width={36}
                              height={36}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {displayName}
                            </p>
                            {review.rating > 0 && (
                              <div className="flex items-center gap-0.5" aria-label={`${review.rating} stars`}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      'h-3.5 w-3.5',
                                      star <= review.rating
                                        ? 'fill-amber-500 text-amber-500'
                                        : 'text-muted-foreground/25'
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            <time dateTime={review.created_at}>{formatDate(review.created_at)}</time>
                          </div>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(review)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Delete comment"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed pl-12 whitespace-pre-wrap">
                        {review.comment}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
