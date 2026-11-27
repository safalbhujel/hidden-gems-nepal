// app/admin/layout.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HiddenGems Nepal | Admin Console',
  description: 'Administrative terminal and geospatial moderation.',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] antialiased">{children}</div>;
}
