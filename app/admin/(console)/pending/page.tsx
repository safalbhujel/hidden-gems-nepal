// app/admin/pending/page.tsx

import { getPendingGems } from '@/lib/admin/queries';
import { PendingModerationClient } from '@/components/admin/PendingModerationClient';

export const metadata = {
  title: 'Pending Approvals Queue | HiddenGems Nepal Admin',
};

export default async function AdminPendingPage() {
  const pending = await getPendingGems();

  return <PendingModerationClient initialPending={pending} />;
}
