import { Suspense } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cookies } from 'next/headers'
import { getPlacesForCards, getPlacesForMap, getCategories, getDistricts } from '@/lib/queries/places'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth-edge'
import { PlaceCardSkeleton } from '@/components/places/PlaceCard'
import { ExploreViewSwitcher } from '@/components/places/ExploreViewSwitcher'
import { CategoryIcon } from '@/components/icons/CategoryIcon'
import type { SortOption, Category, District } from '@/lib/types/places'

// ─────────────────────────────────────────────────────────────────────────────
// Explore Page
//
// Server Component — all data fetching happens server-side.
// Filters are URL-param based so views are shareable + bookmarkable.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata = {
  title: 'Explore Places | HiddenGems Nepal',
  description:
    'Find quiet waterfalls, small tea shops, hilltop viewpoints, and peaceful spots across all 77 districts of Nepal.',
}

interface ExplorePageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    district?: string
    sort?: string
    view?: string
    place?: string
  }>
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'most_hidden', label: 'Most Hidden' },
  { value: 'most_reviewed', label: 'Most Reviewed' },
]

const VALID_SORTS: SortOption[] = ['newest', 'highest_rated', 'most_hidden', 'most_reviewed']

function isValidSort(s: string | undefined): s is SortOption {
  return VALID_SORTS.includes(s as SortOption)
}

// ─── Skeleton grid shown during initial Suspense ─────────────────────────────
function PlacesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <PlaceCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ─── The actual results component (can be wrapped in Suspense) ────────────────
async function PlacesResults({
  search,
  categorySlug,
  districtSlug,
  sort,
  currentUserId,
  isAdmin,
  categories,
  districts,
  initialViewMode,
  initialSelectedSlug,
}: {
  search?: string
  categorySlug?: string
  districtSlug?: string
  sort: SortOption
  currentUserId?: string | null
  isAdmin?: boolean
  categories?: Category[]
  districts?: District[]
  initialViewMode?: 'grid' | 'map'
  initialSelectedSlug?: string
}) {
  const [places, mapPins] = await Promise.all([
    getPlacesForCards({
      search,
      categorySlug,
      districtSlug,
      sort,
      limit: 24,
      userId: currentUserId ?? null,
    }),
    getPlacesForMap({
      search,
      categorySlug,
      districtSlug,
    }),
  ])

  return (
    <ExploreViewSwitcher
      key={`${initialViewMode ?? 'grid'}-${initialSelectedSlug ?? ''}`}
      places={places}
      mapPins={mapPins}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      categories={categories}
      districts={districts}
      initialViewMode={initialViewMode}
      initialSelectedSlug={initialSelectedSlug}
    />
  )
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams
  const search = params.search?.trim() || undefined
  const categorySlug = params.category || undefined
  const districtSlug = params.district || undefined
  const sort: SortOption = isValidSort(params.sort) ? params.sort : 'newest'
  const initialViewMode: 'grid' | 'map' = params.view === 'map' ? 'map' : 'grid'
  const initialSelectedSlug = params.place || undefined

  // Fetch auth session & admin credentials
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  const { valid: isAdmin } = await verifyAdminSessionToken(adminCookie)

  // Fetch filter data in parallel
  const [categories, districts] = await Promise.all([getCategories(), getDistricts()])

  const hasActiveFilters = Boolean(search || categorySlug || districtSlug)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page header ──────────────────────────────────────────────── */}
      {/*
        Flat-By-Default: removed gradient tint. The border-b provides the
        section boundary. Clean cream-on-cream with the border as structure.
      */}
      <div className="border-b bg-background py-10 md:py-14">
        <div className="container mx-auto max-w-7xl px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Explore Places in Nepal
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Find quiet waterfalls, peaceful trails, and small local spots across all 77 districts.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">

        {/* ── Search & filters bar ─────────────────────────────────── */}
        <form
          method="GET"
          className="space-y-4"
          aria-label="Search and filter places"
        >
          {/* Search input — flat, no shadow; border + focus ring provides feedback */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
            <input
              id="explore-search"
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by name or description…"
              autoComplete="off"
              className="w-full pl-12 pr-4 h-12 text-sm rounded-xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-colors"
            />
          </div>

          {/* Filter chips row */}
          <div className="flex flex-wrap gap-3 items-center">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />

            {/* Category select */}
            <select
              id="explore-category"
              name="category"
              defaultValue={categorySlug ?? ''}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* District select */}
            <select
              id="explore-district"
              name="district"
              defaultValue={districtSlug ?? ''}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors"
            >
              <option value="">All Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Sort select */}
            <select
              id="explore-sort"
              name="sort"
              defaultValue={sort}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer ml-auto transition-colors"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Apply button — uses bg-primary token, no shadow */}
            <button
              type="submit"
              className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
            >
              Apply
            </button>

            {/* Clear filters — only visible when filters are active */}
            {hasActiveFilters && (
              <a
                href="/explore"
                className="h-10 px-4 rounded-lg border border-border text-sm font-medium flex items-center hover:bg-muted transition-colors"
              >
                Clear
              </a>
            )}
          </div>
        </form>

        {/* ── Category quick-chips (horizontal scroll on mobile) ──── */}
        {categories.length > 0 && !categorySlug && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mt-2">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/explore?category=${cat.slug}${sort !== 'newest' ? `&sort=${sort}` : ''}`}
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm font-medium hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
              >
                <CategoryIcon slug={cat.slug} name={cat.name} className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{cat.name}</span>
              </a>
            ))}
          </div>
        )}

        {/* ── Results count (contextual) ────────────────────────────── */}
        {hasActiveFilters && (
          <p className="text-sm text-muted-foreground">
            Showing results
            {search && <> for &ldquo;<strong>{search}</strong>&rdquo;</>}
            {categorySlug && (
              <> in <strong>{categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug}</strong></>
            )}
            {districtSlug && (
              <>, <strong>{districts.find((d) => d.slug === districtSlug)?.name ?? districtSlug}</strong></>
            )}
          </p>
        )}

        {/* ── Place grid ───────────────────────────────────────────── */}
        <Suspense fallback={<PlacesGridSkeleton />}>
          <PlacesResults
            search={search}
            categorySlug={categorySlug}
            districtSlug={districtSlug}
            sort={sort}
            currentUserId={user?.id ?? null}
            isAdmin={isAdmin}
            categories={categories}
            districts={districts}
            initialViewMode={initialViewMode}
            initialSelectedSlug={initialSelectedSlug}
          />
        </Suspense>

      </div>
    </div>
  )
}
