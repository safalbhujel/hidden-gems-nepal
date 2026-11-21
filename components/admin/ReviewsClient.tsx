// components/admin/ReviewsClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Trash2, ExternalLink } from 'lucide-react';
import type { AdminReview } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';
import { deleteReviewAction } from '@/lib/admin/actions';

interface ReviewsClientProps {
  initialReviews: AdminReview[];
}

export function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [reviews, setReviews] = useState(initialReviews);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete and moderate this user review?')) return;
    await deleteReviewAction(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Reviews</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Community Reviews Moderation
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit user reviews, ratings, and field tips for authenticity and guideline compliance.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/80 bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
            <tr>
              <th className="px-4 py-3">Explorer</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Comment & Feedback</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Moderate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No community reviews currently logged.
                </td>
              </tr>
            ) : (
              reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {rev.user_name[0]}
                      </div>
                      <span className="font-bold text-foreground">{rev.user_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/places/${rev.place_slug}`}
                      target="_blank"
                      className="font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      <span>{rev.place_name}</span>
                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-sm text-muted-foreground leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                    {rev.created_at}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rev.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove review"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
