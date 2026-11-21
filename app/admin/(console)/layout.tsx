// app/admin/(console)/layout.tsx

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/auth';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import { getPendingGems } from '@/lib/admin/queries';

export const metadata: Metadata = {
  title: 'Admin Console | HiddenGems Nepal',
  description: 'Advanced administration, content moderation, and geospatial management.',
};

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side defense-in-depth session verification
  const session = await getAdminSession();
  if (!session.authenticated) {
    redirect('/admin/login');
  }

  const pendingGems = await getPendingGems();

  return (
    <AdminLayoutClient pendingCount={pendingGems.length}>
      {children}
    </AdminLayoutClient>
  );
}
