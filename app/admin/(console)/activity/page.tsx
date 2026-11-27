// app/admin/activity/page.tsx

import { getAdminStats } from '@/lib/admin/queries';
import { ActivityLogClient } from '@/components/admin/ActivityLogClient';

export const metadata = {
  title: 'HiddenGems Nepal | Activity Log',
};

export default async function AdminActivityPage() {
  const stats = await getAdminStats();

  return <ActivityLogClient initialActivity={stats.recentActivity} />;
}
