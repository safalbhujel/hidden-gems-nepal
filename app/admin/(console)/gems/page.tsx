// app/admin/gems/page.tsx

import { getAdminGems } from '@/lib/admin/queries';
import { GemsManagementClient } from '@/components/admin/GemsManagementClient';

export const metadata = {
  title: 'HiddenGems Nepal | Manage Gems',
};

export default async function AdminGemsPage() {
  const gems = await getAdminGems();

  return <GemsManagementClient initialPlaces={gems} />;
}
