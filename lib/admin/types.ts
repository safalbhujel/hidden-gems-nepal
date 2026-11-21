// lib/admin/types.ts

export type GemStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT' | 'ARCHIVED';

export interface AdminPlace {
  id: string;
  name: string;
  slug: string;
  description: string;
  why_special: string;
  category_id: string | null;
  district_id: string | null;
  submitted_by: string | null;
  latitude: number | null;
  longitude: number | null;
  map_url: string | null;
  video_url: string | null;
  budget: string | null;
  best_time: string | null;
  best_season: string | null;
  difficulty: string | null;
  travel_tips: string | null;
  status: GemStatus;
  hidden_score: number;
  average_rating: number;
  review_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  rejection_reason?: string | null;
  
  // Relations
  cover_image_url: string | null;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  district: {
    id: string;
    name: string;
    slug: string;
    province_id?: string;
    province_name?: string;
  } | null;
  submitter: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    email?: string | null;
  } | null;
}

export interface AdminStats {
  totalUsers: number;
  totalGems: number;
  pendingGems: number;
  approvedGems: number;
  rejectedGems: number;
  totalReviews: number;
  savedPlaces: number;
  featuredGems: number;
  recentSubmissions: AdminPlace[];
  recentActivity: AdminActivityItem[];
}

export interface AdminActivityItem {
  id: string;
  timestamp: string;
  admin_name: string;
  action: 'Approved gem' | 'Rejected gem' | 'Created gem' | 'Updated category' | 'Deleted review' | 'Featured gem';
  target: string;
  details?: string;
}

export interface AdminReview {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  place_name: string;
  place_slug: string;
  user_name: string;
  user_avatar: string | null;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  place_count: number;
}

export interface AdminProvinceGroup {
  id: string;
  name: string;
  slug: string;
  place_count: number;
  districts: {
    id: string;
    name: string;
    slug: string;
    is_enabled: boolean;
    place_count: number;
  }[];
}

export interface AdminReport {
  id: string;
  place_id: string;
  place_name: string;
  place_slug: string;
  reported_by: string;
  reason: 'Duplicate' | 'Inaccurate Coordinates' | 'Inappropriate Content' | 'Closed/Inaccessible';
  details: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  created_at: string;
}
