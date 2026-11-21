// app/admin/layout.tsx

import type { Metadata } from 'next';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import { getPendingGems } from '@/lib/admin/queries';

export const metadata: Metadata = {
  title: 'Admin Console | HiddenGems Nepal',
  description: 'Advanced administration, content moderation, and geospatial management.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingGems = await getPendingGems();

  return (
    <AdminLayoutClient pendingCount={pendingGems.length}>
      {children}
    </AdminLayoutClient>
  );
}
