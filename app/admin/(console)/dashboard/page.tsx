// app/admin/dashboard/page.tsx

import { getAdminStats } from '@/lib/admin/queries';
import { DashboardClient } from '@/components/admin/DashboardClient';

export const metadata = {
  title: 'HiddenGems Nepal | Admin Dashboard',
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return <DashboardClient stats={stats} />;
}
