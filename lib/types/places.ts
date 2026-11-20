// ─────────────────────────────────────────────────────────────────────────────
// Core domain types for the HiddenGems Nepal place system
// ───────────────────────────
// ──────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  is_active: boolean
}

export interface Province {
  id: string
  name: string
}

export interface District {
  id: string
  name: string
  slug: string
  province_id: string
  provinces?: Province | null
}

export interface PlaceImage {
  id: string
  place_id: string
  image_url: string
  sort_order: number
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface PlaceTag {
  place_id: string
  tag_id: string
  tags?: Tag
}

export interface Review {
  id: string
  place_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// PlaceCardData — lightweight, minimal shape used on grids/lists.
// Only fetches the fields PlaceCard needs (prevents over-fetching).
// ─────────────────────────────────────────────────────────────────────────────
export interface PlaceCardData {
  slug: string
  name: string
  hidden_score: number
  average_rating: number
  review_count: number
  categories: {
    name: string
    icon: string | null
  } | null
  districts: {
    name: string
  } | null
  // Only the first (cover) image
  cover_image_url: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// PlaceMapPin — data shape for interactive Mapbox pins
// ─────────────────────────────────────────────────────────────────────────────
export interface PlaceMapPin {
  id: string
  slug: string
  name: string
  latitude: number
  longitude: number
  hidden_score: number
  average_rating: number
  review_count: number
  cover_image_url: string | null
  category: {
    name: string
    icon: string | null
    slug: string
  } | null
  district: {
    name: string
    slug: string
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Place — full data shape used on the /places/[slug] details page.
// ─────────────────────────────────────────────────────────────────────────────
export interface Place {
  id: string
  name: string
  slug: string
  description: string
  why_special: string
  category_id: string | null
  district_id: string | null
  submitted_by: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  map_url: string | null
  video_url: string | null
  budget: string | null
  best_time: string | null
  best_season: string | null
  difficulty: string | null
  travel_tips: string | null
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'
  hidden_score: number
  average_rating: number
  review_count: number
  created_at: string
  updated_at: string
  categories: Category | null
  districts: (District & { provinces?: Province | null }) | null
  place_images: PlaceImage[]
  place_tags: PlaceTag[]
  reviews: Review[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Query options for the explore page
// ─────────────────────────────────────────────────────────────────────────────
export type SortOption = 'newest' | 'highest_rated' | 'most_hidden' | 'most_reviewed'

export interface GetPlacesOptions {
  categorySlug?: string
  districtSlug?: string
  search?: string
  sort?: SortOption
  limit?: number
  offset?: number
}
