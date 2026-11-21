// app/admin/activity/page.tsx

import { getAdminStats } from '@/lib/admin/queries';
import { ActivityLogClient } from '@/components/admin/ActivityLogClient';

export const metadata = {
  title: 'Audit Trail & Activity Log | HiddenGems Nepal Admin',
};

export default async function AdminActivityPage() {
  const stats = await getAdminStats();

  return <ActivityLogClient initialActivity={stats.recentActivity} />;
}
