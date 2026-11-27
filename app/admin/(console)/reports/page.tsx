// app/admin/reports/page.tsx

import { getAdminReports } from '@/lib/admin/queries';
import { ReportsClient } from '@/components/admin/ReportsClient';

export const metadata = {
  title: 'HiddenGems Nepal | Reports',
};

export default async function AdminReportsPage() {
  const reports = await getAdminReports();

  return <ReportsClient initialReports={reports} />;
}
