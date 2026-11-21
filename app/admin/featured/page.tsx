// app/admin/featured/page.tsx

import { getAdminGems } from '@/lib/admin/queries';
import { FeaturedGemsClient } from '@/components/admin/FeaturedGemsClient';

export const metadata = {
  title: 'Homepage Spotlight | HiddenGems Nepal Admin',
};

export default async function AdminFeaturedPage() {
  const gems = await getAdminGems();

  return <FeaturedGemsClient initialGems={gems} />;
}
