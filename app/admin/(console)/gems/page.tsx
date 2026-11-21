// app/admin/gems/page.tsx

import { getAdminGems } from '@/lib/admin/queries';
import { GemsManagementClient } from '@/components/admin/GemsManagementClient';

export const metadata = {
  title: 'Destinations & Gems Management | HiddenGems Nepal Admin',
};

export default async function AdminGemsPage() {
  const gems = await getAdminGems();

  return <GemsManagementClient initialPlaces={gems} />;
}
