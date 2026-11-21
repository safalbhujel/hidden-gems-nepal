// components/admin/AdminSidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  Clock,
  Tag,
  Map,
  MessageSquare,
  Flag,
  Star,
  Activity,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminSidebarProps {
  pendingCount?: number;
}

const PRIMARY_NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Gems', href: '/admin/gems', icon: MapPin },
  { label: 'Pending Approvals', href: '/admin/pending', icon: Clock, hasBadge: true },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
  { label: 'Districts', href: '/admin/districts', icon: Map },
  { label: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { label: 'Reports', href: '/admin/reports', icon: Flag },
  { label: 'Featured Gems', href: '/admin/featured', icon: Star },
  { label: 'Activity Log', href: '/admin/activity', icon: Activity },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ pendingCount = 2 }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 md:w-72 shrink-0 border-r border-border/80 bg-card/60 p-4 flex flex-col justify-between overflow-y-auto">
      {/* ── Top Navigation Group ────────────────────────────────────── */}
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Platform Management
          </p>

          <nav className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              // Active if exact match or if dashboard matches /admin root
              const isActive =
                pathname === item.href ||
                (item.href === '/admin/dashboard' && pathname === '/admin');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                      strokeWidth={1.75}
                    />
                    <span>{item.label}</span>
                  </div>

                  {/* Pending Badge */}
                  {item.hasBadge && pendingCount > 0 && (
                    <span
                      className={cn(
                        'flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                        isActive
                          ? 'bg-primary text-white'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      )}
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Links & Documentation */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Support & Logs
          </p>
          <div className="space-y-1 text-xs font-medium">
            <Link
              href="/admin/activity"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            >
              <Shield className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <span>Audit Trail</span>
            </Link>
            <Link
              href="/docs"
              target="_blank"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <span>Developer Specs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer: Admin User Profile Card ─────────────────────────── */}
      <div className="pt-4 border-t border-border/80">
        <div className="flex items-center justify-between rounded-xl bg-background/80 p-2.5 border border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold uppercase">
              SB
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-bold text-foreground">
                Safal Bhujel
              </p>
              <p className="text-[10px] text-muted-foreground">
                safal@hgn.np
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
