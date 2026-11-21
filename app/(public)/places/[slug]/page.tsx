import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Star,
  Lock,
  ArrowLeft,
  Map,
  ExternalLink,
  Tag as TagIcon,
  User,
  Calendar,
} from 'lucide-react'
import type { Metadata } from 'next'
import { getPlaceBySlug } from '@/lib/queries/places'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PlaceGallery } from '@/components/places/PlaceGallery'
import { PlaceMetadata } from '@/components/places/PlaceMetadata'
import { SaveButton } from '@/components/places/SaveButton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface PlaceDetailsPageProps {
  params: Promise<{ slug: string }>
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO metadata — dynamically generated per place for rich social previews
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PlaceDetailsPageProps): Promise<Metadata> {
  const { slug } = await params
  const place = await getPlaceBySlug(slug)

  if (!place) {
    return { title: 'Place Not Found | HiddenGems Nepal' }
  }

  const coverImage = place.place_images[0]?.image_url

  return {
    title: `${place.name} | HiddenGems Nepal`,
    description: place.description.slice(0, 160),
    openGraph: {
      title: place.name,
      description: place.description.slice(0, 200),
      type: 'article',
      ...(coverImage && {
        images: [{ url: coverImage, width: 1200, height: 630, alt: place.name }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: place.name,
      description: place.description.slice(0, 160),
      ...(coverImage && { images: [coverImage] }),
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? 'fill-primary text-primary'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Place Details Page — Server Component
// All data fetching happens server-side; only SaveButton + PlaceGallery are
// client components (minimal JS sent to browser).
// ─────────────────────────────────────────────────────────────────────────────
export default async function PlaceDetailsPage({ params }: PlaceDetailsPageProps) {
  const { slug } = await params

  // Fetch place data + Supabase client in parallel
  const [place, supabase] = await Promise.all([
    getPlaceBySlug(slug),
    createSupabaseServerClient(),
  ])

  if (!place) notFound()

  // Verify user session server-side (uses getUser — validates JWT with Supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if authenticated user has saved this place
  let initialSaved = false
  if (user) {
    const { data } = await supabase
      .from('saved_places')
      .select('place_id')
      .eq('place_id', place.id)
      .eq('user_id', user.id)
      .maybeSingle()
    initialSaved = Boolean(data)
  }

  const hasRating = place.average_rating > 0
  const hasTags = place.place_tags && place.place_tags.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* ── Back navigation bar ──────────────────────────────────────────── */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-16 z-30">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">

          {/* ═══════════════════════════════════════════════════════
              LEFT — Main content column
          ═══════════════════════════════════════════════════════ */}
          <div className="space-y-8 min-w-0">

            {/* Gallery */}
            <PlaceGallery images={place.place_images} placeName={place.name} />

            {/* Title block */}
            <div className="space-y-3">
              {/* Breadcrumb */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {place.categories && (
                  <>
                    <Link
                      href={`/explore?category=${place.categories.slug}`}
                      className="hover:text-primary transition-colors font-medium"
                    >
                      {place.categories.icon && (
                        <span className="mr-1">{place.categories.icon}</span>
                      )}
                      {place.categories.name}
                    </Link>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                {place.districts && (
                  <Link
                    href={`/explore?district=${place.districts.slug}`}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {place.districts.name}
                    {place.districts.provinces && (
                      <span className="text-muted-foreground/60">
                        , {place.districts.provinces.name}
                      </span>
                    )}
                  </Link>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                {place.name}
              </h1>

              {/* Rating + Hidden Score */}
              <div className="flex flex-wrap items-center gap-4">
                {hasRating ? (
                  <div className="flex items-center gap-2">
                    <StarRating rating={place.average_rating} />
                    <span className="font-bold text-lg tabular-nums">
                      {place.average_rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({place.review_count}{' '}
                      {place.review_count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No reviews yet</span>
                )}

                <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full text-sm font-semibold text-primary">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{place.hidden_score} Hidden Score</span>
                </div>
              </div>

              {/* Tags */}
              {hasTags && (
                <div className="flex flex-wrap items-start gap-2">
                  <TagIcon
                    className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0"
                    aria-label="Tags:"
                  />
                  {place.place_tags.map(({ tags }) =>
                    tags ? (
                      <Badge
                        key={tags.id}
                        variant="secondary"
                        className="rounded-full text-xs"
                      >
                        {tags.name}
                      </Badge>
                    ) : null
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold">About This Place</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {place.description}
              </p>
            </section>

            {/* Why Special */}
            {place.why_special && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold">Why It&apos;s Special</h2>
                <div className="p-5 rounded-xl bg-primary/5 border border-primary/15">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {place.why_special}
                  </p>
                </div>
              </section>
            )}

            {/* Trip details metadata grid */}
            <PlaceMetadata place={place} />

            <Separator />

            {/* Map section */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Location</h2>
              <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border flex items-center justify-center">
                <div className="text-center space-y-3 text-muted-foreground">
                  <Map className="h-12 w-12 mx-auto opacity-40" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Interactive map coming in Phase 8</p>
                    <p className="text-sm opacity-70">Mapbox integration with street view</p>
                  </div>
                </div>
                {place.districts && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-semibold shadow border">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                    {place.districts.name}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {place.latitude !== null && place.longitude !== null && (
                  <a
                    href={getDirectionsUrl(place.latitude, place.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Get Directions (Google Maps)
                  </a>
                )}
                {place.map_url && (
                  <a
                    href={place.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border hover:bg-muted font-semibold text-sm transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    View on Map
                  </a>
                )}
              </div>
            </section>

            <Separator />

            {/* Reviews */}
            <section className="space-y-5" aria-label="Reviews">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold">
                  Reviews
                  {place.review_count > 0 && (
                    <span className="ml-2 text-base font-normal text-muted-foreground">
                      ({place.review_count})
                    </span>
                  )}
                </h2>
                <span className="text-xs text-muted-foreground border px-3 py-1 rounded-full">
                  Submission coming in Phase 9
                </span>
              </div>

              {place.reviews.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center border rounded-2xl bg-muted/30">
                  <Star className="h-12 w-12 mb-4 text-muted-foreground/30" aria-hidden="true" />
                  <p className="font-semibold mb-1">No reviews yet</p>
                  <p className="text-sm text-muted-foreground">
                    Be the first to review this place!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {place.reviews.map((review) => (
                    <article
                      key={review.id}
                      className="p-5 rounded-2xl border bg-card space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex-shrink-0 h-9 w-9 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm"
                          aria-hidden="true"
                        >
                          {review.profiles?.full_name?.[0]?.toUpperCase() ?? (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-sm">
                              {review.profiles?.full_name ?? 'Anonymous'}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                              <time dateTime={review.created_at}>
                                {formatDate(review.created_at)}
                              </time>
                            </div>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed pl-12">
                          {review.comment}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ═══════════════════════════════════════════════════════
              RIGHT — Sticky sidebar
          ═══════════════════════════════════════════════════════ */}
          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start" aria-label="Place actions">

            {/* Save button */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-base">Save this place</h3>
              <SaveButton
                placeId={place.id}
                placeName={place.name}
                initialSaved={initialSaved}
                userId={user?.id ?? null}
              />
            </div>

            {/* Quick info */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-base">Quick Info</h3>
              <dl className="space-y-3 text-sm">
                {place.categories && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>
                      <Link
                        href={`/explore?category=${place.categories.slug}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {place.categories.icon && (
                          <span className="mr-1" aria-hidden="true">
                            {place.categories.icon}
                          </span>
                        )}
                        {place.categories.name}
                      </Link>
                    </dd>
                  </div>
                )}
                {place.districts && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">District</dt>
                    <dd>
                      <Link
                        href={`/explore?district=${place.districts.slug}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {place.districts.name}
                      </Link>
                    </dd>
                  </div>
                )}
                {place.districts?.provinces && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Province</dt>
                    <dd className="font-medium">{place.districts.provinces.name}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Hidden Score</dt>
                  <dd className="font-bold text-primary flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    {place.hidden_score}
                  </dd>
                </div>
                {hasRating && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Rating</dt>
                    <dd className="font-bold flex items-center gap-1">
                      <Star
                        className="h-4 w-4 fill-primary text-primary"
                        aria-hidden="true"
                      />
                      {place.average_rating.toFixed(1)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Share */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-3">
              <h3 className="font-bold text-base">Share</h3>
              <p className="text-xs text-muted-foreground">
                Share this hidden gem with friends who love authentic Nepal.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Check out ${place.name} on HiddenGems Nepal!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-9 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Discovered ${place.name} on HiddenGems Nepal!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-9 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Twitter / X
                </a>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  )
}