import { createSupabaseServerClient } from '@/lib/supabase/server'
import type {
  Category,
  District,
  GetPlacesOptions,
  Place,
  PlaceCardData,
  PlaceMapPin,
  SortOption,
} from '@/lib/types/places'

// ─────────────────────────────────────────────────────────────────────────────
// getPlacesForCards
// Single optimised query — left joins so places without category/district
// are still returned. Category/district slug filters applied in JS after fetch
// for maximum PostgREST compatibility.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlacesForCards(
  options: GetPlacesOptions = {}
): Promise<PlaceCardData[]> {
  const {
    categorySlug,
    districtSlug,
    search,
    sort = 'newest',
    limit = 20,
    offset = 0,
  } = options

  const supabase = await createSupabaseServerClient()

  // Use a generous page size when slug filters are active so the JS post-filter
  // still returns `limit` results; fall back gracefully if DB is sparse.
  const fetchLimit = (categorySlug || districtSlug) ? Math.min(limit * 10, 200) : limit

  let query = supabase
    .from('places')
    .select(
      `
      id,
      slug,
      name,
      status,
      submitted_by,
      hidden_score,
      average_rating,
      review_count,
      description,
      why_special,
      category_id,
      district_id,
      budget,
      best_season,
      travel_tips,
      latitude,
      longitude,
      map_url,
      categories ( id, name, icon, slug ),
      districts ( id, name, slug ),
      place_images ( image_url, sort_order )
    `
    )
    .in('status', ['APPROVED', 'PENDING'])
    .range(offset, offset + fetchLimit - 1)

  // ── Text search ───────────────────────────────────────────────────────────
  if (search && search.trim().length > 0) {
    const term = search.trim()
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sortMap: Record<SortOption, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    highest_rated: { column: 'average_rating', ascending: false },
    most_hidden: { column: 'hidden_score', ascending: false },
    most_reviewed: { column: 'review_count', ascending: false },
  }

  const { column, ascending } = sortMap[sort]
  query = query.order(column, { ascending })

  const { data, error } = await query

  if (error) {
    console.error('[getPlacesForCards] Supabase error:', error.message, error.details, error.hint)
    return []
  }

  // ── JS-side slug filters (PostgREST nested .eq not universally reliable) ──
  let rows = data ?? []

  if (categorySlug) {
    rows = rows.filter((row) => {
      const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
      return cat?.slug === categorySlug
    })
  }

  if (districtSlug) {
    rows = rows.filter((row) => {
      const dist = Array.isArray(row.districts) ? row.districts[0] : row.districts
      return dist?.slug === districtSlug
    })
  }

  // Trim to the requested limit after JS filtering
  rows = rows.slice(0, limit)

  return rows.map((row) => {
    const sortedImages = [...(row.place_images ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )

    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories
    const district = Array.isArray(row.districts) ? row.districts[0] : row.districts

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      status: (row.status as 'APPROVED' | 'PENDING' | string) ?? 'PENDING',
      submitted_by: row.submitted_by ?? null,
      hidden_score: row.hidden_score ?? 0,
      average_rating: row.average_rating ?? 0,
      review_count: row.review_count ?? 0,
      description: row.description ?? null,
      why_special: row.why_special ?? null,
      category_id: row.category_id ?? null,
      district_id: row.district_id ?? null,
      budget: row.budget ?? null,
      best_season: row.best_season ?? null,
      travel_tips: row.travel_tips ?? null,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      map_url: row.map_url ?? null,
      categories: category
        ? { id: category.id, name: category.name, icon: category.icon ?? null, slug: category.slug }
        : null,
      districts: district ? { id: district.id, name: district.name, slug: district.slug } : null,
      cover_image_url: sortedImages[0]?.image_url ?? null,
    } satisfies PlaceCardData
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// getPlaceBySlug
// Fetches a single place with ALL related data for the details page.
// Returns null when not found (caller shows 404).
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('places')
    .select(
      `
      id,
      name,
      slug,
      description,
      why_special,
      category_id,
      district_id,
      submitted_by,
      latitude,
      longitude,
      map_url,
      video_url,
      budget,
      best_time,
      best_season,
      difficulty,
      travel_tips,
      status,
      hidden_score,
      average_rating,
      review_count,
      created_at,
      updated_at,
      categories ( id, name, slug, description, icon, is_active ),
      districts ( id, name, slug, province_id, provinces ( id, name ) ),
      place_images ( id, place_id, image_url, sort_order, created_at ),
      place_tags ( place_id, tag_id, tags ( id, name, slug ) ),
      reviews (
        id,
        place_id,
        user_id,
        rating,
        comment,
        created_at,
        profiles ( full_name, avatar_url )
      )
    `
    )
    .eq('slug', slug)
    .in('status', ['APPROVED', 'PENDING'])
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No row found — not a real error
      return null
    }
    console.error('[getPlaceBySlug] Supabase error:', error.message)
    return null
  }

  if (!data) return null

  // ── Normalise images ──────────────────────────────────────────────────────
  const place_images = [...(data.place_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  // ── Parse lat/lng from data ──────────────────────────────────────────────
  const latitude: number | null =
    data.latitude !== null && data.latitude !== undefined ? Number(data.latitude) : null
  const longitude: number | null =
    data.longitude !== null && data.longitude !== undefined ? Number(data.longitude) : null

  return {
    ...data,
    location: null,
    latitude,
    longitude,
    categories: Array.isArray(data.categories) ? (data.categories[0] ?? null) : (data.categories ?? null),
    districts: Array.isArray(data.districts) ? (data.districts[0] ?? null) : (data.districts ?? null),
    place_images,
    place_tags: data.place_tags ?? [],
    reviews: data.reviews ?? [],
  } as unknown as Place
}

// ─────────────────────────────────────────────────────────────────────────────
// getPlacesForMap
// Fetches approved places with valid latitude/longitude coordinates for Mapbox.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlacesForMap(
  options: GetPlacesOptions = {}
): Promise<PlaceMapPin[]> {
  const { categorySlug, districtSlug, search } = options
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('places')
    .select(
      `
      id,
      slug,
      name,
      status,
      latitude,
      longitude,
      hidden_score,
      average_rating,
      review_count,
      categories ( name, icon, slug ),
      districts ( name, slug ),
      place_images ( image_url, sort_order )
    `
    )
    .in('status', ['APPROVED', 'PENDING'])
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (search && search.trim().length > 0) {
    const term = search.trim()
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getPlacesForMap] Supabase error:', error.message)
    return []
  }

  let rows = data ?? []

  if (categorySlug) {
    rows = rows.filter((row) => {
      const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
      return cat?.slug === categorySlug
    })
  }

  if (districtSlug) {
    rows = rows.filter((row) => {
      const dist = Array.isArray(row.districts) ? row.districts[0] : row.districts
      return dist?.slug === districtSlug
    })
  }

  return rows.map((row) => {
    const sortedImages = [...(row.place_images ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )

    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories
    const district = Array.isArray(row.districts) ? row.districts[0] : row.districts

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      status: (row.status as 'APPROVED' | 'PENDING' | string) ?? 'PENDING',
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      hidden_score: row.hidden_score ?? 0,
      average_rating: row.average_rating ?? 0,
      review_count: row.review_count ?? 0,
      cover_image_url: sortedImages[0]?.image_url ?? null,
      category: category
        ? { name: category.name, icon: category.icon ?? null, slug: category.slug }
        : null,
      district: district ? { name: district.name, slug: district.slug } : null,
    } satisfies PlaceMapPin
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// getCategories
// Fetches all active categories (for filter chips on Explore page).
// ─────────────────────────────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon, is_active')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('[getCategories] Supabase error:', error.message)
    return []
  }

  return (data ?? []) as Category[]
}

// ─────────────────────────────────────────────────────────────────────────────
// getDistricts
// Fetches all districts with their province names (for filter dropdown).
// ─────────────────────────────────────────────────────────────────────────────
export async function getDistricts(): Promise<District[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('districts')
    .select('id, name, slug, province_id, provinces ( id, name )')
    .order('name')

  if (error) {
    console.error('[getDistricts] Supabase error:', error.message)
    return []
  }

  return (data ?? []) as unknown as District[]
}
