import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { parsePostgisPoint } from '@/lib/utils/geo'
import {
  getHeartIndex,
  getExtraCommentCounts,
  getExtraCommentsForPlace,
} from '@/lib/supabase/interactions'
import type {
  Category,
  District,
  GetPlacesOptions,
  Place,
  PlaceCardData,
  PlaceMapPin,
  Review,
  SortOption,
} from '@/lib/types/places'

// ─────────────────────────────────────────────────────────────────────────────
// getPlacesForCards
// Queries places (both APPROVED and newly submitted PENDING spots) with
// decoded PostGIS location coordinates and real heart/save/comment counts.
// Uses service role server-side strictly scoped to APPROVED/PENDING statuses so
// newly submitted places appear immediately for all viewers.
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
    userId = null,
  } = options

  const supabase = createSupabaseAdminClient()

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
      location,
      map_url,
      categories ( id, name, icon, slug ),
      districts ( id, name, slug ),
      place_images ( image_url, sort_order )
    `
    )
    .in('status', ['APPROVED', 'PENDING'])
    .range(offset, offset + fetchLimit - 1)

  if (search && search.trim().length > 0) {
    const term = search.trim()
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
  }

  const sortMap: Record<SortOption, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    highest_rated: { column: 'average_rating', ascending: false },
    most_hidden: { column: 'hidden_score', ascending: false },
    most_reviewed: { column: 'review_count', ascending: false },
  }

  const { column, ascending } = sortMap[sort]
  query = query.order(column, { ascending })

  const [placesRes, heartsIndex, extraCommentCounts, savedRes] = await Promise.all([
    query,
    getHeartIndex(),
    getExtraCommentCounts(),
    userId
      ? supabase.from('saved_places').select('place_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as Array<{ place_id: string }> }),
  ])

  if (placesRes.error) {
    console.error(
      '[getPlacesForCards] Supabase error:',
      placesRes.error.message,
      placesRes.error.details,
      placesRes.error.hint
    )
    return []
  }

  const savedSet = new Set(
    (savedRes.data ?? []).map((row) => row.place_id)
  )

  let rows = placesRes.data ?? []

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

  rows = rows.slice(0, limit)

  return rows.map((row) => {
    const sortedImages = [...(row.place_images ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )

    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories
    const district = Array.isArray(row.districts) ? row.districts[0] : row.districts
    const coords = parsePostgisPoint(row.location)
    const heartUsers = Array.isArray(heartsIndex[row.id]) ? heartsIndex[row.id] : []
    const extraComments = extraCommentCounts[row.id] ?? 0
    const reviewCount = row.review_count ?? 0

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      status: (row.status as 'APPROVED' | 'PENDING' | string) ?? 'PENDING',
      submitted_by: row.submitted_by ?? null,
      hidden_score: row.hidden_score ?? 0,
      average_rating: row.average_rating ?? 0,
      review_count: reviewCount,
      comment_count: reviewCount + extraComments,
      heart_count: heartUsers.length,
      is_hearted: userId ? heartUsers.includes(userId) : false,
      is_saved: savedSet.has(row.id),
      description: row.description ?? null,
      why_special: row.why_special ?? null,
      category_id: row.category_id ?? null,
      district_id: row.district_id ?? null,
      budget: row.budget ?? null,
      best_season: row.best_season ?? null,
      travel_tips: row.travel_tips ?? null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      map_url: row.map_url ?? null,
      categories: category
        ? { id: category.id, name: category.name, icon: category.icon ?? null, slug: category.slug }
        : null,
      districts: district ? { id: district.id, name: district.name, slug: district.slug } : null,
      cover_image_url: sortedImages[0]?.image_url ?? null,
      image_count: sortedImages.length,
    } satisfies PlaceCardData
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// getPlaceBySlug
// Fetches a single place with ALL related data for the details page.
// Decodes PostGIS `location`, includes reviews + follow-up comments & hearts.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlaceBySlug(
  slug: string,
  userId?: string | null
): Promise<Place | null> {
  const supabase = createSupabaseAdminClient()

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
      location,
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
        profiles ( username, full_name, avatar_url )
      )
    `
    )
    .eq('slug', slug)
    .in('status', ['APPROVED', 'PENDING'])
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[getPlaceBySlug] Supabase error:', error.message)
    return null
  }

  if (!data) return null

  const [heartsIndex, extraComments] = await Promise.all([
    getHeartIndex(),
    getExtraCommentsForPlace(data.id),
  ])

  const place_images = [...(data.place_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  const coords = parsePostgisPoint(data.location)
  const heartUsers = Array.isArray(heartsIndex[data.id]) ? heartsIndex[data.id] : []

  const dbReviews: Review[] = ((data.reviews ?? []) as unknown as Review[]).map((r) => ({
    ...r,
    source: 'review' as const,
    profiles: Array.isArray(r.profiles) ? (r.profiles[0] ?? null) : (r.profiles ?? null),
  }))

  const followUpComments: Review[] = extraComments.map((c) => ({
    id: c.id,
    place_id: c.place_id,
    user_id: c.user_id,
    rating: c.rating ?? 0,
    comment: c.comment,
    created_at: c.created_at,
    source: 'comment' as const,
    profiles: {
      username: c.username,
      full_name: c.full_name,
      avatar_url: c.avatar_url,
    },
  }))

  const mergedReviews = [...dbReviews, ...followUpComments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return {
    ...data,
    location: null,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
    categories: Array.isArray(data.categories) ? (data.categories[0] ?? null) : (data.categories ?? null),
    districts: Array.isArray(data.districts) ? (data.districts[0] ?? null) : (data.districts ?? null),
    place_images,
    place_tags: data.place_tags ?? [],
    reviews: mergedReviews,
    heart_count: heartUsers.length,
    is_hearted: userId ? heartUsers.includes(userId) : false,
  } as unknown as Place
}

// ─────────────────────────────────────────────────────────────────────────────
// getPlacesForMap
// Fetches approved & pending places with valid PostGIS coordinates for Mapbox.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlacesForMap(
  options: GetPlacesOptions = {}
): Promise<PlaceMapPin[]> {
  const { categorySlug, districtSlug, search } = options
  const supabase = createSupabaseAdminClient()

  let query = supabase
    .from('places')
    .select(
      `
      id,
      slug,
      name,
      status,
      location,
      hidden_score,
      average_rating,
      review_count,
      categories ( name, icon, slug ),
      districts ( name, slug ),
      place_images ( image_url, sort_order )
    `
    )
    .in('status', ['APPROVED', 'PENDING'])
    .not('location', 'is', null)

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

  return rows.flatMap((row) => {
    const coords = parsePostgisPoint(row.location)
    if (!coords) return []

    const sortedImages = [...(row.place_images ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )

    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories
    const district = Array.isArray(row.districts) ? row.districts[0] : row.districts

    return [
      {
        id: row.id,
        slug: row.slug,
        name: row.name,
        status: (row.status as 'APPROVED' | 'PENDING' | string) ?? 'PENDING',
        latitude: coords.lat,
        longitude: coords.lng,
        hidden_score: row.hidden_score ?? 0,
        average_rating: row.average_rating ?? 0,
        review_count: row.review_count ?? 0,
        cover_image_url: sortedImages[0]?.image_url ?? null,
        category: category
          ? { name: category.name, icon: category.icon ?? null, slug: category.slug }
          : null,
        district: district ? { name: district.name, slug: district.slug } : null,
      } satisfies PlaceMapPin,
    ]
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
