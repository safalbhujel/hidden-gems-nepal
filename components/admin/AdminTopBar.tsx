// components/admin/AdminTopBar.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Bell,
  ExternalLink,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminTopBarProps {
  onOpenCommandPalette: () => void;
  pendingCount?: number;
}

export function AdminTopBar({ onOpenCommandPalette, pendingCount = 2 }: AdminTopBarProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur-md sm:px-6">
      {/* ── Left: Brand & Admin Console Identifier ────────────────────── */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image
            src="/icons/HiddenGemsNepal_Affinity.svg"
            alt="HiddenGems Nepal"
            width={120}
            height={90}
            className="h-8 w-auto object-contain dark:hidden"
            priority
          />
          <Image
            src="/icons/HiddenGemsNepal_Affinityy.svg"
            alt="HiddenGems Nepal"
            width={120}
            height={90}
            className="hidden h-8 w-auto object-contain dark:block"
            priority
          />
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border/80">
            <span className="text-xs font-bold tracking-tight text-foreground">
              Admin Console
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              v1.2.0
            </span>
          </div>
        </Link>
      </div>

      {/* ── Center: Global ⌘K Search Bar ──────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 max-w-lg">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="group flex h-9 w-full items-center justify-between rounded-xl border border-border/80 bg-muted/40 px-3.5 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted/70 hover:text-foreground"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.75} />
            <span className="truncate">Search gems, submitters, districts, or actions...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-2xs">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* ── Right: Notifications, Live Site Link, Admin Profile ────────── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Public Site Shortcut */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          title="Open consumer website in new tab"
        >
          <span>Live Site</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!notificationsRead) setNotificationsRead(true);
            }}
            className="relative h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            {!notificationsRead && pendingCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/80 bg-background/98 p-3 shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 z-50">
              <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2 px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Notifications
                </p>
                <span className="text-[10px] text-muted-foreground">Recent</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <Link
                  href="/admin/pending"
                  onClick={() => setShowNotifications(false)}
                  className="block rounded-lg p-2 hover:bg-muted/60 transition-colors"
                >
                  <p className="font-semibold text-foreground">
                    {pendingCount} Pending Gem Submissions
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Requires admin verification before map publishing.
                  </p>
                </Link>
                <div className="rounded-lg p-2 hover:bg-muted/60 transition-colors">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Spatial Registry Sync Active</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    PostGIS 77 districts telemetry verified.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-2 border-l border-border/80 pl-2 sm:pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary font-bold text-white text-xs shadow-xs">
            S
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-foreground leading-tight">
              Safal Bhujel
            </p>
            <p className="text-[10px] text-primary font-semibold tracking-wide uppercase">
              Super Admin
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
