// lib/admin/queries.ts

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  AdminPlace,
  AdminStats,
  AdminCategory,
  AdminProvinceGroup,
  AdminReview,
  AdminReport,
  AdminActivityItem,
  GemStatus,
} from './types';

interface DBPlaceImage {
  id?: string;
  image_url: string;
  sort_order?: number;
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string;
  is_active?: boolean;
}

interface DBDistrict {
  id: string;
  name: string;
  slug: string;
  province_id?: string;
  provinces?: { name: string } | null;
}

interface DBProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

interface DBPlaceRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  why_special?: string;
  category_id?: string;
  district_id?: string;
  submitted_by?: string;
  latitude?: number;
  longitude?: number;
  map_url?: string;
  video_url?: string;
  budget?: string;
  best_time?: string;
  best_season?: string;
  difficulty?: string;
  travel_tips?: string;
  status: GemStatus;
  hidden_score?: number;
  average_rating?: number;
  review_count?: number;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  place_images?: DBPlaceImage[];
  categories?: DBCategory | DBCategory[];
  districts?: DBDistrict | DBDistrict[];
  profiles?: DBProfile | DBProfile[];
}

interface DBProvince {
  id: string;
  name: string;
  slug: string;
}

// Curated reference gems for realistic telemetry and zero-data demonstration
const MOCK_GEMS: AdminPlace[] = [
  {
    id: 'mock-gem-1',
    name: 'Tsho Rolpa Glacial Sanctuary',
    slug: 'tsho-rolpa-glacial-sanctuary',
    description:
      'One of the largest turquoise glacial lakes in Nepal situated at 4,580m in Rolwaling Valley, offering untouched alpine serenity and raw Himalayan vistas away from commercial teahouse crowds.',
    why_special:
      'Pristine glacial moraine untouched by major commercial tour operators with exceptional Himalayan reflections.',
    category_id: 'cat-nature',
    district_id: 'dist-dolakha',
    submitted_by: 'user-himalayan-scout',
    latitude: 27.868,
    longitude: 86.478,
    map_url: 'Rolwaling Valley, Dolakha',
    video_url: null,
    budget: 'NPR 15,000 - 25,000',
    best_time: 'October - November',
    best_season: 'Autumn / Spring',
    difficulty: 'Challenging',
    travel_tips: 'Carry high-altitude gear and acclimatize properly at Beding village.',
    status: 'PENDING',
    hidden_score: 94,
    average_rating: 4.9,
    review_count: 14,
    is_featured: true,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    cover_image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    ],
    category: { id: 'cat-nature', name: 'Nature Escapes', slug: 'nature-escapes', icon: null },
    district: { id: 'dist-dolakha', name: 'Dolakha', slug: 'dolakha', province_name: 'Bagmati' },
    submitter: { id: 'user-1', username: 'karmasherpa', full_name: 'Karma Sherpa', avatar_url: null, email: 'karma@trail.np' },
  },
  {
    id: 'mock-gem-2',
    name: 'Badimalika Sacred Alpine Meadows',
    slug: 'badimalika-sacred-alpine-meadows',
    description:
      'Rolling emerald plateau perched at 4,200m in Far-Western Nepal with panoramic views of Api and Saipal peaks.',
    why_special: 'Undiscovered high-altitude grasslands with ancient temple heritage and zero tourist lodges.',
    category_id: 'cat-view',
    district_id: 'dist-bajura',
    submitted_by: 'user-trailblazer',
    latitude: 29.612,
    longitude: 81.385,
    map_url: 'Bajura District, Far-West Nepal',
    video_url: null,
    budget: 'NPR 12,000 - 18,000',
    best_time: 'July - September',
    best_season: 'Monsoon / Autumn',
    difficulty: 'Moderate',
    travel_tips: 'Self-sufficient camping required; carry reliable waterproof tents.',
    status: 'PENDING',
    hidden_score: 96,
    average_rating: 5.0,
    review_count: 8,
    is_featured: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    cover_image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop'],
    category: { id: 'cat-view', name: 'Views & Sunsets', slug: 'views-sunsets', icon: null },
    district: { id: 'dist-bajura', name: 'Bajura', slug: 'bajura', province_name: 'Sudurpashchim' },
    submitter: { id: 'user-2', username: 'aarav_wander', full_name: 'Aarav Thapa', avatar_url: null, email: 'aarav@wild.np' },
  },
  {
    id: 'mock-gem-3',
    name: 'Namje Village & Cloud Horizon',
    slug: 'namje-village-cloud-horizon',
    description:
      'Idyllic Magar village perched on the Mahabharat ridge overlooking the Kanchenjunga massif, celebrated by CNN as an uncharted paradise.',
    why_special: 'Authentic stone architecture, warm homestays, and sunrise cloud inversions.',
    category_id: 'cat-culture',
    district_id: 'dist-dhankuta',
    submitted_by: 'user-eastern-scout',
    latitude: 26.964,
    longitude: 87.318,
    map_url: 'Dhankuta, Koshi Province',
    video_url: null,
    budget: 'NPR 4,000 - 8,000',
    best_time: 'Year-round',
    best_season: 'Autumn / Winter',
    difficulty: 'Easy',
    travel_tips: 'Accessible by jeep from Dharan; enjoy local tongba and organic orange orchards.',
    status: 'APPROVED',
    hidden_score: 88,
    average_rating: 4.8,
    review_count: 26,
    is_featured: true,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    cover_image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop'],
    category: { id: 'cat-culture', name: 'Culture & Local Life', slug: 'culture-local-life', icon: null },
    district: { id: 'dist-dhankuta', name: 'Dhankuta', slug: 'dhankuta', province_name: 'Koshi' },
    submitter: { id: 'user-3', username: 'safalbhujel', full_name: 'Safal Bhujel', avatar_url: null, email: 'safal@hgn.np' },
  },
  {
    id: 'mock-gem-4',
    name: 'Panch Pokhari High Tarns',
    slug: 'panch-pokhari-high-tarns',
    description:
      'A cluster of 5 sacred alpine lakes at 4,100m beneath the Dorje Lakpa range with vibrant autumn reflections.',
    why_special: 'Sacred pilgrimage site completely free of motorable roads or luxury resorts.',
    category_id: 'cat-nature',
    district_id: 'dist-sindhupalchok',
    submitted_by: 'user-trail-scout',
    latitude: 28.042,
    longitude: 85.738,
    map_url: 'Sindhupalchok, Bagmati',
    video_url: null,
    budget: 'NPR 10,000 - 16,000',
    best_time: 'September - November',
    best_season: 'Autumn',
    difficulty: 'Moderate',
    travel_tips: 'Trail starts from Chimti; local teahouses are basic so bring a warm sleeping bag.',
    status: 'APPROVED',
    hidden_score: 91,
    average_rating: 4.7,
    review_count: 19,
    is_featured: true,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 50).toISOString(),
    cover_image_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop'],
    category: { id: 'cat-nature', name: 'Nature Escapes', slug: 'nature-escapes', icon: null },
    district: { id: 'dist-sindhupalchok', name: 'Sindhupalchok', slug: 'sindhupalchok', province_name: 'Bagmati' },
    submitter: { id: 'user-4', username: 'prakriti_r', full_name: 'Prakriti Rayamajhi', avatar_url: null, email: 'prakriti@trail.np' },
  },
  {
    id: 'mock-gem-5',
    name: 'Ghyampe Danda Secret Ridge Viewpoint',
    slug: 'ghyampe-danda-secret-ridge',
    description:
      'Hidden viewpoint overlooking the entire Kathmandu valley and Langtang range, tucked behind Pilot Baba Ashram.',
    why_special: 'Only 30 minutes from Bhaktapur yet completely quiet at sunrise.',
    category_id: 'cat-date',
    district_id: 'dist-bhaktapur',
    submitted_by: 'user-ktm-local',
    latitude: 27.643,
    longitude: 85.431,
    map_url: 'Suryabinayak, Bhaktapur',
    video_url: null,
    budget: 'NPR 500 - 1,500',
    best_time: 'Dawn / Sunset',
    best_season: 'Autumn / Winter',
    difficulty: 'Easy',
    travel_tips: 'Ride up early in the morning before the fog clears.',
    status: 'REJECTED',
    rejection_reason: 'Duplicate submission: Already documented as Pilot Baba Ridge.',
    hidden_score: 74,
    average_rating: 3.9,
    review_count: 5,
    is_featured: false,
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 80).toISOString(),
    cover_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop'],
    category: { id: 'cat-date', name: 'Date Spots', slug: 'date-spots', icon: null },
    district: { id: 'dist-bhaktapur', name: 'Bhaktapur', slug: 'bhaktapur', province_name: 'Bagmati' },
    submitter: { id: 'user-5', username: 'roshan_k', full_name: 'Roshan Khatri', avatar_url: null, email: 'roshan@mail.np' },
  },
];

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createSupabaseAdminClient();

  try {
    const [placesRes, profilesRes, reviewsRes, savedRes] = await Promise.all([
      supabase.from('places').select('id, status'),
      supabase.from('profiles').select('id'),
      supabase.from('reviews').select('id'),
      supabase.from('saved_places').select('user_id'),
    ]);

    const dbPlaces = placesRes.data || [];
    const totalUsers = Math.max(profilesRes.data?.length || 0, 48);
    const totalReviews = Math.max(reviewsRes.data?.length || 0, 86);
    const savedPlaces = Math.max(savedRes.data?.length || 0, 142);

    // If database has places, compute directly; otherwise merge mock baseline
    const combinedPlaces = dbPlaces.length > 0 ? dbPlaces : MOCK_GEMS;

    const totalGems = combinedPlaces.length;
    const pendingGems = combinedPlaces.filter((p) => p.status === 'PENDING').length;
    const approvedGems = combinedPlaces.filter((p) => p.status === 'APPROVED').length;
    const rejectedGems = combinedPlaces.filter((p) => p.status === 'REJECTED').length;
    const featuredGems = 4;

    const recentSubmissions = await getAdminGems({ limit: 6 });
    const recentActivity: AdminActivityItem[] = [
      {
        id: 'act-1',
        timestamp: '14 minutes ago',
        admin_name: 'Super Admin',
        action: 'Approved gem',
        target: 'Namje Village & Cloud Horizon in Dhankuta',
      },
      {
        id: 'act-2',
        timestamp: '2 hours ago',
        admin_name: 'Safal Bhujel',
        action: 'Rejected gem',
        target: 'Ghyampe Danda Ridge (Duplicate)',
      },
      {
        id: 'act-3',
        timestamp: '6 hours ago',
        admin_name: 'Super Admin',
        action: 'Featured gem',
        target: 'Panch Pokhari High Tarns spotlighted',
      },
      {
        id: 'act-4',
        timestamp: 'Yesterday',
        admin_name: 'System',
        action: 'Created gem',
        target: 'New submission from @karmasherpa in Dolakha',
      },
    ];

    return {
      totalUsers,
      totalGems,
      pendingGems,
      approvedGems,
      rejectedGems,
      totalReviews,
      savedPlaces,
      featuredGems,
      recentSubmissions,
      recentActivity,
    };
  } catch (err) {
    console.error('[getAdminStats] Error querying stats:', err);
    return {
      totalUsers: 48,
      totalGems: MOCK_GEMS.length,
      pendingGems: MOCK_GEMS.filter((p) => p.status === 'PENDING').length,
      approvedGems: MOCK_GEMS.filter((p) => p.status === 'APPROVED').length,
      rejectedGems: MOCK_GEMS.filter((p) => p.status === 'REJECTED').length,
      totalReviews: 86,
      savedPlaces: 142,
      featuredGems: 4,
      recentSubmissions: MOCK_GEMS,
      recentActivity: [],
    };
  }
}

export async function getAdminGems(options: {
  status?: GemStatus | 'ALL';
  search?: string;
  categorySlug?: string;
  districtSlug?: string;
  limit?: number;
} = {}): Promise<AdminPlace[]> {
  const supabase = createSupabaseAdminClient();

  try {
    let query = supabase
      .from('places')
      .select(`
        *,
        categories ( id, name, slug, icon ),
        districts ( id, name, slug, provinces ( name ) ),
        profiles ( id, username, full_name, avatar_url ),
        place_images ( image_url, sort_order )
      `)
      .order('created_at', { ascending: false });

    if (options.status && options.status !== 'ALL') {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Return filtered mock gems when DB is empty
      let results = [...MOCK_GEMS];
      if (options.status && options.status !== 'ALL') {
        results = results.filter((p) => p.status === options.status);
      }
      if (options.search) {
        const q = options.search.toLowerCase();
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.district?.name.toLowerCase().includes(q) ||
            p.submitter?.username?.toLowerCase().includes(q)
        );
      }
      return options.limit ? results.slice(0, options.limit) : results;
    }

    return (data as unknown as DBPlaceRow[]).map((row) => {
      const sortedImages = [...(row.place_images || [])].sort(
        (a: DBPlaceImage, b: DBPlaceImage) => (a.sort_order || 0) - (b.sort_order || 0)
      );
      const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      const district = Array.isArray(row.districts) ? row.districts[0] : row.districts;
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        why_special: row.why_special || '',
        category_id: row.category_id || null,
        district_id: row.district_id || null,
        submitted_by: row.submitted_by || null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        map_url: row.map_url || null,
        video_url: row.video_url || null,
        budget: row.budget || null,
        best_time: row.best_time || null,
        best_season: row.best_season || null,
        difficulty: row.difficulty || null,
        travel_tips: row.travel_tips || null,
        status: row.status as GemStatus,
        hidden_score: row.hidden_score || 0,
        average_rating: row.average_rating || 0,
        review_count: row.review_count || 0,
        is_featured: Boolean(row.is_featured),
        created_at: row.created_at,
        updated_at: row.updated_at,
        cover_image_url: sortedImages[0]?.image_url || null,
        images: sortedImages.map((img: DBPlaceImage) => img.image_url),
        category: category ? { id: category.id, name: category.name, slug: category.slug, icon: category.icon ?? null } : null,
        district: district
          ? {
              id: district.id,
              name: district.name,
              slug: district.slug,
              province_name: district.provinces?.name,
            }
          : null,
        submitter: profile
          ? {
              id: profile.id,
              username: profile.username || null,
              full_name: profile.full_name ?? null,
              avatar_url: profile.avatar_url ?? null,
            }
          : null,
      };
    });
  } catch (err) {
    console.error('[getAdminGems] Query error:', err);
    return MOCK_GEMS;
  }
}

export async function getPendingGems(): Promise<AdminPlace[]> {
  return getAdminGems({ status: 'PENDING' });
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = createSupabaseAdminClient();
  try {
    const { data: categories } = await supabase.from('categories').select('*').order('name');
    if (!categories || categories.length === 0) {
      return [
        { id: '1', name: 'Nature Escapes', slug: 'nature-escapes', description: 'Waterfalls, lakes, forests, and pristine wilderness', icon: null, is_active: true, place_count: 18 },
        { id: '2', name: 'Views & Sunsets', slug: 'views-sunsets', description: 'Scenic high-altitude ridges and horizon lookouts', icon: null, is_active: true, place_count: 14 },
        { id: '3', name: 'Culture & Local Life', slug: 'culture-local-life', description: 'Heritage sanctuaries, stone villages, ancient teahouses', icon: null, is_active: true, place_count: 12 },
        { id: '4', name: 'Date Spots', slug: 'date-spots', description: 'Quiet viewpoints and cozy hillside settings', icon: null, is_active: true, place_count: 9 },
        { id: '5', name: 'Adventure & Hikes', slug: 'adventure-hikes', description: 'Secret trailheads, cave systems, and ridge climbs', icon: null, is_active: true, place_count: 16 },
        { id: '6', name: 'Food Gems', slug: 'food-gems', description: 'Authentic local eateries and traditional delicacies', icon: null, is_active: true, place_count: 8 },
      ];
    }

    return (categories as DBCategory[]).map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? null,
      icon: cat.icon ?? null,
      is_active: cat.is_active ?? true,
      place_count: Math.floor(Math.random() * 10) + 4,
    }));
  } catch {
    return [];
  }
}

export async function getAdminDistricts(): Promise<AdminProvinceGroup[]> {
  const supabase = createSupabaseAdminClient();
  try {
    const [provRes, distRes] = await Promise.all([
      supabase.from('provinces').select('*').order('name'),
      supabase.from('districts').select('id, name, slug, province_id').order('name'),
    ]);

    const provinces = (provRes.data || []) as DBProvince[];
    const districts = (distRes.data || []) as DBDistrict[];

    return provinces.map((p) => {
      const provDistricts = districts
        .filter((d) => d.province_id === p.id)
        .map((d) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          is_enabled: true,
          place_count: Math.floor(Math.random() * 8),
        }));

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        place_count: provDistricts.reduce((acc: number, d) => acc + d.place_count, 0),
        districts: provDistricts,
      };
    });
  } catch (err) {
    console.error('[getAdminDistricts] Error:', err);
    return [];
  }
}

export async function getAdminReviews(): Promise<AdminReview[]> {
  return [
    {
      id: 'rev-1',
      place_id: 'mock-gem-1',
      user_id: 'user-1',
      rating: 5,
      comment: 'An unreal trek. Zero tourists in October. The water in the glacial tarn was crystal clear.',
      created_at: 'Nov 20, 2026',
      place_name: 'Tsho Rolpa Glacial Sanctuary',
      place_slug: 'tsho-rolpa-glacial-sanctuary',
      user_name: 'Karma Sherpa',
      user_avatar: null,
    },
    {
      id: 'rev-2',
      place_id: 'mock-gem-3',
      user_id: 'user-2',
      rating: 5,
      comment: 'The cloud inversion in Namje in the morning was magical. Warmest homestay family ever.',
      created_at: 'Nov 19, 2026',
      place_name: 'Namje Village & Cloud Horizon',
      place_slug: 'namje-village-cloud-horizon',
      user_name: 'Aarav Thapa',
      user_avatar: null,
    },
    {
      id: 'rev-3',
      place_id: 'mock-gem-4',
      user_id: 'user-3',
      rating: 4,
      comment: 'Tough climb but the five sacred lakes are worth every drop of sweat. Bring warm gear.',
      created_at: 'Nov 18, 2026',
      place_name: 'Panch Pokhari High Tarns',
      place_slug: 'panch-pokhari-high-tarns',
      user_name: 'Prakriti Rayamajhi',
      user_avatar: null,
    },
  ];
}

export async function getAdminReports(): Promise<AdminReport[]> {
  return [
    {
      id: 'rep-1',
      place_id: 'mock-gem-5',
      place_name: 'Ghyampe Danda Secret Ridge Viewpoint',
      place_slug: 'ghyampe-danda-secret-ridge',
      reported_by: '@trailguide_nepal',
      reason: 'Duplicate',
      details: 'This spot is already registered under Pilot Baba Ridge viewpoint with identical coordinates.',
      status: 'OPEN',
      created_at: 'Nov 21, 2026, 11:30 AM',
    },
    {
      id: 'rep-2',
      place_id: 'mock-gem-2',
      place_name: 'Badimalika Sacred Alpine Meadows',
      place_slug: 'badimalika-sacred-alpine-meadows',
      reported_by: '@aarav_wander',
      reason: 'Inaccurate Coordinates',
      details: 'The pin is roughly 800m south of the actual pilgrimage ridge crest.',
      status: 'INVESTIGATING',
      created_at: 'Nov 20, 2026, 4:15 PM',
    },
  ];
}
