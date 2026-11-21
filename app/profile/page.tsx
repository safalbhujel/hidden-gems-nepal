import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ProfileDashboard,
  type SubmittedPlaceItem,
  type SavedPlaceItem,
} from '@/components/profile/ProfileDashboard';

export const metadata = {
  title: 'Explorer Profile | HiddenGems Nepal',
  description: 'Your personal explorer profile, submitted gems, saved wishlist, and Himalayan achievements.',
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  // Validate JWT session with Supabase server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile, submitted places, saved places, and user reviews in parallel
  const [profileRes, placesRes, savedRes, reviewsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, full_name, email, bio, avatar_url, created_at')
      .eq('id', user.id)
      .maybeSingle(),

    supabase
      .from('places')
      .select(`
        id,
        name,
        slug,
        status,
        hidden_score,
        created_at,
        districts ( name ),
        place_images ( image_url, sort_order )
      `)
      .eq('submitted_by', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('saved_places')
      .select(`
        place_id,
        created_at,
        places (
          id,
          name,
          slug,
          hidden_score,
          average_rating,
          review_count,
          districts ( name ),
          place_images ( image_url, sort_order )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id),
  ]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto max-w-6xl px-4 pt-8">
        <ProfileDashboard
          user={user}
          profile={profileRes.data}
          submittedPlaces={(placesRes.data || []) as unknown as SubmittedPlaceItem[]}
          savedPlaces={(savedRes.data || []) as unknown as SavedPlaceItem[]}
          reviewsCount={reviewsRes.data?.length || 0}
        />
      </div>
    </div>
  );
}
