import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CategoryIcon } from '@/components/icons/CategoryIcon'
import type { PlaceCardData } from '@/lib/types/places'
import { cn } from '@/lib/utils'

interface PlaceCardProps {
  place: PlaceCardData
  className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// PlaceCard
//
// Pure, presentational component — no data fetching.
// Reusable across Explore, Home, Profile, and Saved pages.
//
// Authentic Trailguide ruleset applied:
//  • Flat-By-Default: shadow-sm and hover:shadow-lg replaced with a
//    structural border + subtle translate-only hover lift. Elevation is
//    conveyed by the white card sitting on the cream canvas, not a shadow.
//  • All colours reference CSS custom-property tokens (text-primary, etc.)
//    rather than hard-coded hex values.
// ─────────────────────────────────────────────────────────────────────────────
export function PlaceCard({ place, className }: PlaceCardProps) {
  const hasCover = Boolean(place.cover_image_url)
  const rating = place.average_rating.toFixed(1)
  const hasRating = place.average_rating > 0

  return (
    <Link
      href={`/places/${place.slug}`}
      className={cn('group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl', className)}
      aria-label={`View ${place.name}`}
    >
      {/*
        Flat card: white bg on cream canvas provides natural lift without a
        shadow. border-border creates the structural separation.
        hover:-translate-y-0.5 gives a subtle physical feedback without elevation.
      */}
      <article className="h-full overflow-hidden rounded-xl border border-border bg-card transition-transform duration-200 hover:-translate-y-0.5">

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
            /* Fallback: flat earthy gradient, no heavy shadows */
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <CategoryIcon
                name={place.categories?.name}
                icon={place.categories?.icon}
                className="h-12 w-12 text-primary opacity-30"
              />
            </div>
          )}

          {/* Legibility gradient — kept because it aids text on photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Hidden Score badge — top right. Uses bg-background/90 for flat frosted look */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 px-2.5 py-1 rounded-lg text-xs font-bold border border-border text-primary">
            <Lock className="h-3 w-3" aria-hidden="true" />
            <span>{place.hidden_score}</span>
          </div>

          {/* Category badge — bottom left */}
          {place.categories && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-background/90 text-foreground border-0 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <CategoryIcon name={place.categories.name} icon={place.categories.icon} className="h-3 w-3 text-primary" />
                <span>{place.categories.name}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* ── Card body ─────────────────────────────────────────────────── */}
        <div className="p-4 space-y-2">

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

          {/* Rating row */}
          <div className="flex items-center gap-1.5 text-sm">
            {hasRating ? (
              <>
                <Star
                  className="h-4 w-4 fill-primary text-primary flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="font-semibold tabular-nums">{rating}</span>
                <span className="text-muted-foreground text-xs">
                  ({place.review_count} {place.review_count === 1 ? 'review' : 'reviews'})
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground italic">No reviews yet</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
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
  )
}
