// app/admin/reports/page.tsx

import { getAdminReports } from '@/lib/admin/queries';
import { ReportsClient } from '@/components/admin/ReportsClient';

export const metadata = {
  title: 'Community Flagged Reports | HiddenGems Nepal Admin',
};

export default async function AdminReportsPage() {
  const reports = await getAdminReports();

  return <ReportsClient initialReports={reports} />;
}
