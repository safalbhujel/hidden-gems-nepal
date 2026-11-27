// app/admin/districts/page.tsx

import { getAdminDistricts } from '@/lib/admin/queries';
import { DistrictsClient } from '@/components/admin/DistrictsClient';

export const metadata = {
  title: 'HiddenGems Nepal | Districts',
};

export default async function AdminDistrictsPage() {
  const provinces = await getAdminDistricts();

  return <DistrictsClient provinces={provinces} />;
}
