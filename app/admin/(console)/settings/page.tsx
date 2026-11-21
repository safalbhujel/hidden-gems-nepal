// app/admin/settings/page.tsx

import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient';

export const metadata = {
  title: 'Platform Configuration & Settings | HiddenGems Nepal Admin',
};

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
