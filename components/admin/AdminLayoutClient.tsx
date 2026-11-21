// components/admin/AdminLayoutClient.tsx

'use client';

import { useState } from 'react';
import { AdminTopBar } from './AdminTopBar';
import { AdminSidebar } from './AdminSidebar';
import { AdminCommandPalette } from './AdminCommandPalette';

interface AdminLayoutClientProps {
  pendingCount: number;
  children: React.ReactNode;
}

export function AdminLayoutClient({ pendingCount, children }: AdminLayoutClientProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* ── Fixed TopBar ─────────────────────────────────────────────── */}
      <AdminTopBar
        pendingCount={pendingCount}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Fixed Sidebar ───────────────────────────────────────────── */}
        <AdminSidebar pendingCount={pendingCount} />

        {/* ── Main Scrollable Content Area ────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>

      {/* ── Global ⌘K Command Palette ─────────────────────────────────── */}
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
