'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Lock, CheckCircle2, Clock, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import type { PlaceCardData, Category, District } from '@/lib/types/places';
import { cn } from '@/lib/utils';
import { EditPlaceModal } from '@/components/places/EditPlaceModal';

interface PlaceCardProps {
  place: PlaceCardData;
  className?: string;
  currentUserId?: string | null;
  isAdmin?: boolean;
  categories?: Category[];
  districts?: District[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PlaceCard
//
// Reusable across Explore, Home, Profile, and Saved pages.
// Supports verified tickmark badges, community pending states, and
// direct inline editing for authors & admins.
// ─────────────────────────────────────────────────────────────────────────────
export function PlaceCard({
  place,
  className,
  currentUserId,
  isAdmin = false,
  categories = [],
  districts = [],
}: PlaceCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const hasCover = Boolean(place.cover_image_url);
  const rating = place.average_rating.toFixed(1);
  const hasRating = place.average_rating > 0;
  const isApproved = place.status === 'APPROVED';
  const isPending = place.status === 'PENDING';
  const canEdit = Boolean((currentUserId && place.submitted_by === currentUserId) || isAdmin);

  return (
    <>
      <div className={cn('relative group', className)}>
        <Link
          href={`/places/${place.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl h-full"
          aria-label={`View ${place.name}`}
        >
          <article className="h-full overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 flex flex-col justify-between">
            {/* ── Cover image ───────────────────────────────────────────────── */}
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              {hasCover ? (
                <Image
                  src={place.cover_image_url!}
                  alt={place.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <CategoryIcon
                    name={place.categories?.name}
                    icon={place.categories?.icon}
                    className="h-12 w-12 text-primary opacity-30"
                  />
                </div>
              )}

              {/* Legibility gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Status / Verification Badge (Top Left) */}
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                {isApproved && (
                  <div className="inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/40 backdrop-blur-xs shadow-xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>Verified</span>
                  </div>
                )}

                {isPending && (
                  <div className="inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/40 backdrop-blur-xs shadow-xs">
                    <Clock className="h-3 w-3 text-amber-400 animate-pulse" />
                    <span>Pending Review</span>
                  </div>
                )}
              </div>

              {/* Hidden Score badge (Top Right) */}
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-black/75 px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/20 text-[#FF8500] backdrop-blur-xs shadow-xs">
                <Lock className="h-3 w-3" aria-hidden="true" />
                <span>{place.hidden_score}</span>
              </div>

              {/* Category badge (Bottom Left) */}
              {place.categories && (
                <div className="absolute bottom-2.5 left-2.5 z-10">
                  <Badge className="bg-background/90 text-foreground border-0 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 backdrop-blur-xs">
                    <CategoryIcon
                      name={place.categories.name}
                      icon={place.categories.icon}
                      className="h-3 w-3 text-primary"
                    />
                    <span>{place.categories.name}</span>
                  </Badge>
                </div>
              )}
            </div>

            {/* ── Card body ─────────────────────────────────────────────────── */}
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                {/* District */}
                {place.districts && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" aria-hidden="true" />
                    <span>{place.districts.name}</span>
                  </div>
                )}

                {/* Place name */}
                <h3 className="font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
                  {place.name}
                </h3>
              </div>

              {/* Bottom Row: Rating + Edit Trigger */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-sm">
                  {hasRating ? (
                    <>
                      <Star
                        className="h-3.5 w-3.5 fill-amber-500 text-amber-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-semibold tabular-nums text-xs">{rating}</span>
                      <span className="text-muted-foreground text-[11px]">
                        ({place.review_count})
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">No reviews yet</span>
                  )}
                </div>

                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/60 hover:bg-primary hover:text-white hover:border-primary px-2.5 py-1 text-[11px] font-semibold text-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Edit destination details"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          </article>
        </Link>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <EditPlaceModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          place={place}
          categories={categories}
          districts={districts}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlaceCardSkeleton — loading placeholder used in Suspense boundaries
// ─────────────────────────────────────────────────────────────────────────────
export function PlaceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card" aria-hidden="true">
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        <div className="h-5 w-full bg-muted rounded animate-pulse" />
        <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
