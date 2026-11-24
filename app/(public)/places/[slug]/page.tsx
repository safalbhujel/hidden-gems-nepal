import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  MapPin,
  Star,
  Lock,
  ArrowLeft,
  Tag as TagIcon,
  CheckCircle2,
  Clock,
  Map as MapIcon,
} from 'lucide-react'
import type { Metadata } from 'next'
import { getPlaceBySlug, getCategories, getDistricts } from '@/lib/queries/places'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth-edge'
import { PlaceGallery } from '@/components/places/PlaceGallery'
import { PlaceMetadata } from '@/components/places/PlaceMetadata'
import { PlaceSocialMediaSources } from '@/components/places/PlaceSocialMediaSources'
import { PlaceEditTrigger } from '@/components/places/PlaceEditTrigger'
import { PlaceLocationMap } from '@/components/places/PlaceLocationMap'
import { PlaceReviewsSection } from '@/components/places/PlaceReviewsSection'
import { HeartReactButton, SaveBookmarkButton } from '@/components/places/PlaceActionButtons'
import { GoogleMapsIcon } from '@/components/places/GoogleMapsIcon'
import { CategoryIcon } from '@/components/icons/CategoryIcon'
import { parseMediaSources } from '@/lib/utils/media'
import { buildGoogleMapsDirectionsUrl } from '@/lib/utils/geo'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface PlaceDetailsPageProps {
  params: Promise<{ slug: string }>
}

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? 'fill-amber-500 text-amber-500'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

export default async function PlaceDetailsPage({ params }: PlaceDetailsPageProps) {
  const { slug } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const place = await getPlaceBySlug(slug, user?.id ?? null)
  if (!place) notFound()

  const cookieStore = await cookies()
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  const { valid: isAdmin } = await verifyAdminSessionToken(adminCookie)
  const isAuthor = Boolean(user && place.submitted_by === user.id)
  const canEdit = isAuthor || isAdmin

  const [categories, districts] = canEdit
    ? await Promise.all([getCategories(), getDistricts()])
    : [[], []]

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
  const isApproved = place.status === 'APPROVED'
  const isPending = place.status === 'PENDING'
  const hasCoords =
    place.latitude !== null &&
    place.longitude !== null &&
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Back navigation bar ──────────────────────────────────────────── */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-16 z-30">
        <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>

          <div className="flex items-center gap-2">
            <HeartReactButton
              placeId={place.id}
              placeSlug={place.slug}
              initialCount={place.heart_count ?? 0}
              initialLiked={Boolean(place.is_hearted)}
              userId={user?.id ?? null}
              size="sm"
            />
            <SaveBookmarkButton
              placeId={place.id}
              placeName={place.name}
              placeSlug={place.slug}
              initialSaved={initialSaved}
              userId={user?.id ?? null}
              size="sm"
              showLabel
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
          {/* ═══════════════════════════════════════════════════════
              LEFT — Main content column
          ═══════════════════════════════════════════════════════ */}
          <div className="space-y-8 min-w-0">
            {isPending && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex items-start gap-3.5 text-amber-900 dark:text-amber-200">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">
                      Community Submission · Under Review
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">
                      Checking Details
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    A community member shared this spot. Our local team is checking the directions and info to make sure everything is accurate.
                  </p>
                </div>
              </div>
            )}

            {/* Gallery */}
            <PlaceGallery images={place.place_images} placeName={place.name} />

            {/* Title block */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {isApproved && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Verified Place</span>
                    </div>
                  )}
                  {isPending && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>New Community Spot</span>
                    </div>
                  )}
                </div>

                {canEdit && (
                  <PlaceEditTrigger
                    place={place}
                    categories={categories}
                    districts={districts}
                    isAdmin={isAdmin}
                  />
                )}
              </div>

              {/* Breadcrumb */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {place.categories && (
                  <>
                    <Link
                      href={`/explore?category=${place.categories.slug}`}
                      className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
                    >
                      <CategoryIcon
                        name={place.categories.name}
                        icon={place.categories.icon}
                        className="h-3.5 w-3.5 text-primary"
                      />
                      <span>{place.categories.name}</span>
                    </Link>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                {place.districts && (
                  <Link
                    href={`/explore?district=${place.districts.slug}`}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>{place.districts.name}</span>
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

              {/* Rating + Hidden Score + Heart React */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {hasRating ? (
                  <div className="flex items-center gap-2">
                    <StarRating rating={place.average_rating} />
                    <span className="font-bold text-lg tabular-nums">
                      {place.average_rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({place.review_count}{' '}
                      {place.review_count === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No ratings yet</span>
                )}

                <div className="flex items-center gap-1.5 bg-primary/8 border border-primary/20 px-3 py-1.5 rounded-full text-sm font-semibold text-primary">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{place.hidden_score} Hidden Score</span>
                </div>

                <HeartReactButton
                  placeId={place.id}
                  placeSlug={place.slug}
                  initialCount={place.heart_count ?? 0}
                  initialLiked={Boolean(place.is_hearted)}
                  userId={user?.id ?? null}
                  size="sm"
                  showLabel
                />
              </div>

              {/* Tags */}
              {hasTags && (
                <div className="flex flex-wrap items-start gap-2 pt-1">
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

            {/* Community Footage, Videos & Social Redirects */}
            {place.video_url && parseMediaSources(place.video_url).length > 0 && (
              <>
                <Separator />
                <PlaceSocialMediaSources
                  sources={parseMediaSources(place.video_url)}
                  placeName={place.name}
                />
              </>
            )}

            <Separator />

            {/* Live Pinned Location Map & Google Maps Directions */}
            <PlaceLocationMap
              placeName={place.name}
              placeSlug={place.slug}
              latitude={place.latitude}
              longitude={place.longitude}
              districtName={place.districts?.name ?? null}
              landmarkText={place.map_url}
            />

            <Separator />

            {/* Live Ratings & Comments */}
            <PlaceReviewsSection
              placeId={place.id}
              placeSlug={place.slug}
              initialReviews={place.reviews}
              initialAverageRating={place.average_rating}
              initialReviewCount={place.review_count}
              currentUserId={user?.id ?? null}
              isAdmin={isAdmin}
            />
          </div>

          {/* ═══════════════════════════════════════════════════════
              RIGHT — Sticky sidebar
          ═══════════════════════════════════════════════════════ */}
          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start" aria-label="Place actions">
            {/* React & Save Card */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <h3 className="font-bold text-base">React &amp; Save</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <HeartReactButton
                  placeId={place.id}
                  placeSlug={place.slug}
                  initialCount={place.heart_count ?? 0}
                  initialLiked={Boolean(place.is_hearted)}
                  userId={user?.id ?? null}
                  size="md"
                  showLabel
                  className="w-full rounded-xl"
                />
                <SaveBookmarkButton
                  placeId={place.id}
                  placeName={place.name}
                  placeSlug={place.slug}
                  initialSaved={initialSaved}
                  userId={user?.id ?? null}
                  size="md"
                  showLabel
                  className="w-full"
                />
              </div>
            </div>

            {/* Map & Directions Sidebar Card */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <h3 className="font-bold text-base">Get There</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Open the exact pinned spot on our interactive map or get turn-by-turn directions in Google Maps.
              </p>
              <div className="space-y-2">
                <Link
                  href={`/explore?view=map&place=${encodeURIComponent(place.slug)}`}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background hover:border-primary hover:text-primary text-sm font-semibold transition-colors"
                >
                  <MapIcon className="h-4 w-4 text-primary" />
                  <span>View on Map</span>
                </Link>

                {hasCoords && (
                  <a
                    href={buildGoogleMapsDirectionsUrl(place.latitude!, place.longitude!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-[transform,background-color] active:scale-[0.98]"
                  >
                    <GoogleMapsIcon className="h-4 w-4 shrink-0" />
                    <span>Get Directions</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick info */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-base">Quick Info</h3>
              <dl className="space-y-3 text-sm">
                {place.categories && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>
                      <Link
                        href={`/explore?category=${place.categories.slug}`}
                        className="inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors"
                      >
                        <CategoryIcon
                          name={place.categories.name}
                          icon={place.categories.icon}
                          className="h-3.5 w-3.5 text-primary"
                        />
                        <span>{place.categories.name}</span>
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
                        className="h-4 w-4 fill-amber-500 text-amber-500"
                        aria-hidden="true"
                      />
                      {place.average_rating.toFixed(1)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Share */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <h3 className="font-bold text-base">Share</h3>
              <p className="text-xs text-muted-foreground">
                Share this spot with friends who enjoy quiet places in Nepal.
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
                    `Found ${place.name} on HiddenGems Nepal!`
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
