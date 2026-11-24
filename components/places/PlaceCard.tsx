'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Star,
  Lock,
  CheckCircle2,
  Clock,
  Pencil,
  MessageCircle,
  ChevronDown,
  ArrowUpRight,
  Map as MapIcon,
  Camera,
  Calendar,
  Wallet,
  Compass,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import type { PlaceCardData, Category, District } from '@/lib/types/places';
import { cn } from '@/lib/utils';
import { EditPlaceModal } from '@/components/places/EditPlaceModal';
import {
  HeartReactButton,
  SaveBookmarkButton,
} from '@/components/places/PlaceActionButtons';
import { GoogleMapsIcon } from '@/components/places/GoogleMapsIcon';
import { PlaceReviewsSection } from '@/components/places/PlaceReviewsSection';
import { buildGoogleMapsDirectionsUrl, isHttpUrl } from '@/lib/utils/geo';

interface PlaceCardProps {
  place: PlaceCardData;
  className?: string;
  currentUserId?: string | null;
  isAdmin?: boolean;
  categories?: Category[];
  districts?: District[];
  defaultExpanded?: boolean;
}

export function PlaceCard({
  place,
  className,
  currentUserId = null,
  isAdmin = false,
  categories = [],
  districts = [],
  defaultExpanded = false,
}: PlaceCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [avgRating, setAvgRating] = useState(place.average_rating ?? 0);
  const [reviewCount, setReviewCount] = useState(place.review_count ?? 0);
  const [commentCount, setCommentCount] = useState(
    place.comment_count ?? place.review_count ?? 0
  );

  const hasCover = Boolean(place.cover_image_url);
  const hasRating = avgRating > 0;
  const isApproved = place.status === 'APPROVED';
  const isPending = place.status === 'PENDING';
  const canEdit = Boolean((currentUserId && place.submitted_by === currentUserId) || isAdmin);

  const hasCoords =
    place.latitude !== null &&
    place.latitude !== undefined &&
    place.longitude !== null &&
    place.longitude !== undefined &&
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude);

  const curiosityLine =
    place.why_special?.trim() ||
    place.description?.trim() ||
    'A quiet spot shared by locals. Open the guide to see the trail and directions.';

  const displayAddress = !isHttpUrl(place.map_url) ? place.map_url : null;

  return (
    <>
      <article
        className={cn(
          'gem-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/90 bg-card transition-[transform,border-color,box-shadow] duration-200 hover:border-primary/55 hover:shadow-[0_14px_34px_-14px_rgba(255,133,0,0.22)]',
          className
        )}
      >
        <div>
          {/* ── Interactive Media Frame (Clickable -> /places/[slug]) ─────── */}
          <div className="relative aspect-[16/11] overflow-hidden bg-muted">
            <Link
              href={`/places/${place.slug}`}
              className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Uncover ${place.name}`}
            >
              {hasCover ? (
                <Image
                  src={place.cover_image_url!}
                  alt={place.name}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="gem-card-image object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/60">
                  <CategoryIcon
                    name={place.categories?.name}
                    icon={place.categories?.icon}
                    className="h-12 w-12 text-primary/40"
                  />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Tap to see spot details
                  </span>
                </div>
              )}

              {/* Legibility vignette for badges and bottom curiosity teaser */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
            </Link>

            {/* Top Left: Verification + Photo Count */}
            <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
              {isApproved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/40 backdrop-blur-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>Verified</span>
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/40 backdrop-blur-xs">
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span>New Spot · In Review</span>
                </span>
              )}
              {typeof place.image_count === 'number' && place.image_count > 1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white/90 border border-white/15 backdrop-blur-xs">
                  <Camera className="h-2.5 w-2.5" />
                  <span>{place.image_count}</span>
                </span>
              )}
            </div>

            {/* Top Right: Hidden Score + Quick Save Bookmark */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              <div
                className="pointer-events-none flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold border border-white/20 text-[#FF8500] backdrop-blur-xs"
                title={`Hidden Score: ${place.hidden_score} out of 100`}
              >
                <Lock className="h-3 w-3" aria-hidden="true" />
                <span className="tabular-nums">{place.hidden_score}</span>
              </div>

              <SaveBookmarkButton
                placeId={place.id}
                placeName={place.name}
                placeSlug={place.slug}
                initialSaved={Boolean(place.is_saved)}
                userId={currentUserId}
                size="sm"
                showLabel={false}
                className="h-7 w-7 p-0 rounded-full bg-black/70 border-white/20 text-white hover:border-primary hover:bg-primary hover:text-white backdrop-blur-xs"
              />
            </div>

            {/* Bottom Overlay: Category Pill + Insider Curiosity Hook */}
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                {place.categories && (
                  <Badge className="bg-background/92 text-foreground border-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 backdrop-blur-xs shadow-xs">
                    <CategoryIcon
                      name={place.categories.name}
                      icon={place.categories.icon}
                      className="h-3 w-3 text-primary"
                    />
                    <span>{place.categories.name}</span>
                  </Badge>
                )}

                {hasCoords && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white/90 border border-white/15 backdrop-blur-xs">
                    <MapPin className="h-2.5 w-2.5 text-[#FF8500]" />
                    <span>Pinned</span>
                  </span>
                )}
              </div>

              {place.why_special && (
                <p className="line-clamp-1 text-xs font-medium text-white/90 drop-shadow-xs">
                  &ldquo;{place.why_special}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* ── Card Header & Curiosity Teaser ────────────────────────────── */}
          <div className="p-4 pb-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              {place.districts ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="font-semibold text-foreground/85 truncate">
                    {place.districts.name}
                  </span>
                  {displayAddress && (
                    <span className="truncate text-muted-foreground/75">
                      · {displayAddress}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Nepal</span>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/50 hover:bg-primary hover:text-white hover:border-primary px-2 py-0.5 text-[11px] font-semibold text-foreground transition-colors cursor-pointer shrink-0"
                  title="Edit place details"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <Link
              href={`/places/${place.slug}`}
              className="block focus-visible:outline-none focus-visible:underline"
            >
              <h3 className="text-lg font-extrabold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {place.name}
              </h3>
            </Link>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {curiosityLine}
            </p>

            {/* ── Social & Reaction Bar (Heart React, Rating, Comment, Save) ── */}
            <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 flex-wrap">
                <HeartReactButton
                  placeId={place.id}
                  placeSlug={place.slug}
                  initialCount={place.heart_count ?? 0}
                  initialLiked={Boolean(place.is_hearted)}
                  userId={currentUserId}
                  size="sm"
                />

                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2.5 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer"
                  title="Read or add a comment"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                  <span className="tabular-nums font-bold">{commentCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2.5 text-xs font-semibold text-foreground hover:border-amber-500/50 transition-colors cursor-pointer"
                  title="View or add rating"
                >
                  <Star
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      hasRating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/60'
                    )}
                  />
                  <span className="tabular-nums font-bold">
                    {hasRating ? avgRating.toFixed(1) : 'Rate'}
                  </span>
                  {hasRating && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({reviewCount})
                    </span>
                  )}
                </button>
              </div>

              <SaveBookmarkButton
                placeId={place.id}
                placeName={place.name}
                placeSlug={place.slug}
                initialSaved={Boolean(place.is_saved)}
                userId={currentUserId}
                size="sm"
                showLabel
              />
            </div>
          </div>
        </div>

        {/* ── Expandable Quick Peek Drawer (Map Pin, Google Directions, Notes, Quick Review) ── */}
        <div className="gem-expand-grid" data-open={isExpanded}>
          <div className="gem-expand-inner">
            <div className="border-t border-border/70 bg-muted/25 p-4 space-y-3.5">
              {/* Highlight quote */}
              {place.why_special && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">
                    What Makes It Special
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">
                    {place.why_special}
                  </p>
                </div>
              )}

              {/* Quick Trip Metadata */}
              {(place.best_season || place.budget || place.travel_tips) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {place.best_season && (
                    <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/80 p-2.5">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Best Time
                        </p>
                        <p className="font-medium text-foreground truncate">{place.best_season}</p>
                      </div>
                    </div>
                  )}
                  {place.budget && (
                    <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/80 p-2.5">
                      <Wallet className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Estimated Cost
                        </p>
                        <p className="font-medium text-foreground truncate">{place.budget}</p>
                      </div>
                    </div>
                  )}
                  {place.travel_tips && (
                    <div className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 p-2.5">
                      <Compass className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground leading-relaxed">
                        {place.travel_tips}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pinned Location Quick Actions: View on Map + Google Maps Directions */}
              <div className="space-y-2 rounded-xl border border-border/70 bg-background p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>Exact Location</span>
                  </span>
                  {hasCoords && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {place.latitude!.toFixed(4)}° N, {place.longitude!.toFixed(4)}° E
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/explore?view=map&place=${encodeURIComponent(place.slug)}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card hover:border-primary hover:text-primary px-3 text-xs font-semibold transition-colors"
                  >
                    <MapIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="whitespace-nowrap">View on Map</span>
                  </Link>

                  {hasCoords ? (
                    <a
                      href={buildGoogleMapsDirectionsUrl(place.latitude!, place.longitude!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 px-3 text-xs font-semibold text-foreground transition-colors"
                      title="Opens Google Maps directions from your starting point"
                    >
                      <GoogleMapsIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Directions</span>
                    </a>
                  ) : (
                    <Link
                      href={`/places/${place.slug}#location-map`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card hover:border-primary px-3 text-xs font-semibold text-foreground transition-colors"
                    >
                      <GoogleMapsIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Map Details</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Inline Compact Rating & Comment Composer */}
              <PlaceReviewsSection
                placeId={place.id}
                placeSlug={place.slug}
                initialReviews={[]}
                initialAverageRating={avgRating}
                initialReviewCount={reviewCount}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                compact
                onStatsChange={(nextAvg, nextRevCount) => {
                  setAvgRating(nextAvg);
                  setReviewCount(nextRevCount);
                  setCommentCount((c) => Math.max(nextRevCount, c + 1));
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Bottom Action Footer: Quick Details Toggle + Uncover This Gem CTA ── */}
        <div className="px-4 py-3 bg-muted/20 border-t border-border/70 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted px-3 text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0"
          >
            <span>{isExpanded ? 'Less' : 'Quick Peek'}</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                isExpanded && 'rotate-180 text-primary'
              )}
            />
          </button>

          <Link
            href={`/places/${place.slug}`}
            className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 text-xs sm:text-sm font-bold transition-[transform,background-color] duration-150 active:scale-[0.98] shadow-xs whitespace-nowrap"
          >
            <span>Uncover This Gem</span>
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </article>

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
    <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden="true">
      <div className="aspect-[16/11] bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        <div className="h-5 w-4/5 bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-14 bg-muted rounded-full animate-pulse" />
          <div className="h-8 w-14 bg-muted rounded-full animate-pulse" />
          <div className="h-8 flex-1 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
