// app/admin/reviews/page.tsx

import { getAdminReviews } from '@/lib/admin/queries';
import { ReviewsClient } from '@/components/admin/ReviewsClient';

export const metadata = {
  title: 'HiddenGems Nepal | Reviews',
};

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return <ReviewsClient initialReviews={reviews} />;
}
