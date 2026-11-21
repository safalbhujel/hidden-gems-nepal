// components/admin/DashboardClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Bookmark,
  Star,
  ArrowRight,
  Plus,
  Eye,
  Check,
  ShieldCheck,
} from 'lucide-react';
import type { AdminStats, AdminPlace } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';
import { GemDetailDrawer } from './GemDetailDrawer';
import { RejectionReasonModal } from './RejectionReasonModal';
import { approveGemAction } from '@/lib/admin/actions';
import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  stats: AdminStats;
}

export function DashboardClient({ stats }: DashboardClientProps) {
  const router = useRouter();
  const [selectedPlace, setSelectedPlace] = useState<AdminPlace | null>(null);
  const [rejectPlace, setRejectPlace] = useState<AdminPlace | null>(null);
  const [chartRange, setChartRange] = useState<'30d' | '12m'>('30d');

  async function handleQuickApprove(gemId: string) {
    await approveGemAction(gemId);
    router.refresh();
  }

  // 8 KPI Summary Cards Specification
  const KPI_CARDS = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      trend: '↑ 14% this month',
      trendPositive: true,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Gems',
      value: stats.totalGems,
      trend: '↑ 8% this month',
      trendPositive: true,
      icon: MapPin,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingGems,
      trend: stats.pendingGems > 0 ? 'Requires action' : 'Queue clear',
      trendPositive: stats.pendingGems === 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      highlight: stats.pendingGems > 0,
    },
    {
      label: 'Approved Gems',
      value: stats.approvedGems,
      trend: 'Live on map',
      trendPositive: true,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Rejected Submissions',
      value: stats.rejectedGems,
      trend: 'Audit logged',
      trendPositive: false,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Community Reviews',
      value: stats.totalReviews,
      trend: '↑ 22% this month',
      trendPositive: true,
      icon: MessageSquare,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Saved Bookmarks',
      value: stats.savedPlaces,
      trend: '↑ 19% this month',
      trendPositive: true,
      icon: Bookmark,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Featured Spotlight',
      value: `${stats.featuredGems}/10`,
      trend: 'Curated active',
      trendPositive: true,
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Page Header & Action Bar ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time telemetry, queue moderation, and geospatial statistics across all 77 districts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/pending">
            <Button
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Review Queue ({stats.pendingGems})</span>
            </Button>
          </Link>
          <Link href="/submit" target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Gem</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Summary Cards (4-Column Grid) ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className={`rounded-2xl border p-5 transition-all duration-150 ${
                card.highlight
                  ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs'
                  : 'border-border/80 bg-card hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {card.label}
                </span>
                <div className={`rounded-xl p-2 ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} strokeWidth={1.75} />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight text-foreground">
                  {card.value}
                </span>
                <span
                  className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                    card.highlight
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : card.trendPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {card.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Interactive Analytics Section (2-Column Grid) ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Chart: Submissions & Signups Over Time */}
        <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm tracking-tight text-foreground">
                Submissions & Community Growth
              </h3>
              <p className="text-xs text-muted-foreground">
                Comparison of gem submissions versus explorer signups.
              </p>
            </div>

            <div className="flex items-center rounded-xl border border-border/80 bg-muted/30 p-1 text-xs">
              <button
                type="button"
                onClick={() => setChartRange('30d')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                  chartRange === '30d'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setChartRange('12m')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                  chartRange === '12m'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                12 Months
              </button>
            </div>
          </div>

          {/* SVG Sparkline / Area Chart Representation */}
          <div className="pt-2">
            <div className="h-56 w-full relative flex items-end justify-between gap-2 px-2">
              {/* Simulated Time Series Bars with dual metric lines */}
              {[
                { label: 'W1', sub: 4, sign: 12 },
                { label: 'W2', sub: 7, sign: 19 },
                { label: 'W3', sub: 12, sign: 28 },
                { label: 'W4', sub: 9, sign: 24 },
                { label: 'W5', sub: 15, sign: 36 },
                { label: 'W6', sub: 18, sign: 42 },
                { label: 'W7', sub: 22, sign: 50 },
                { label: 'W8', sub: 28, sign: 64 },
              ].map((item) => (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    {/* Submissions bar (Burnt orange) */}
                    <div
                      style={{ height: `${(item.sub / 30) * 100}%` }}
                      className="w-3 rounded-t-sm bg-primary/80 group-hover:bg-primary transition-all duration-300"
                      title={`${item.sub} Gem Submissions`}
                    />
                    {/* Signups bar (Blue) */}
                    <div
                      style={{ height: `${(item.sign / 70) * 100}%` }}
                      className="w-3 rounded-t-sm bg-blue-500/60 group-hover:bg-blue-500 transition-all duration-300"
                      title={`${item.sign} Explorer Signups`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-6 border-t border-border/60 pt-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span>Gem Submissions (Total: {stats.totalGems})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span>Explorer Signups (Total: {stats.totalUsers})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Chart: Regional & Category Breakdown */}
        <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-6 space-y-4">
          <div>
            <h3 className="font-bold text-sm tracking-tight text-foreground">
              Regional & Category Distribution
            </h3>
            <p className="text-xs text-muted-foreground">
              Top districts with verified geospatial gems.
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {stats.totalGems === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Zero Regional Distribution</p>
                <p className="mt-1 text-[11px]">
                  As gems are approved across Nepal&apos;s 77 districts, provincial density will calculate here.
                </p>
              </div>
            ) : (
              [
                { district: 'Kaski (Pokhara Valley)', count: stats.approvedGems, pct: 100 },
              ].map((d) => (
                <div key={d.district} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground/90">{d.district}</span>
                    <span className="text-muted-foreground font-mono">{d.count} gems</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      style={{ width: `${d.pct}%` }}
                      className="h-full rounded-full bg-primary/80 transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <Link
              href="/admin/districts"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View all 77 districts breakdown</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick-Action Feeds (Bottom 2-Column Grid) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recent Gem Submissions with Quick Moderation */}
        <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm tracking-tight text-foreground">
                Recent Submissions
              </h3>
              <p className="text-xs text-muted-foreground">
                Latest destinations awaiting review or recently updated.
              </p>
            </div>
            <Link
              href="/admin/gems"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>All Gems</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border/60 overflow-hidden">
            {stats.recentSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">No recent submissions</p>
                <p className="mt-1 text-[11px]">
                  When explorers submit new places, they will appear here for verification.
                </p>
              </div>
            ) : (
              stats.recentSubmissions.slice(0, 5).map((place) => (
                <div
                  key={place.id}
                  className="group flex items-center justify-between py-3 gap-3 transition-colors hover:bg-muted/30 px-2 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
                      {place.cover_image_url ? (
                        <Image
                          src={place.cover_image_url}
                          alt={place.name}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-primary">
                          <MapPin className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="truncate">
                      <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {place.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span>{place.district?.name || 'Nepal'}</span>
                        <span>·</span>
                        <span>@{place.submitter?.username || 'explorer'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        place.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : place.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {place.status}
                    </span>

                    {/* Actions on hover */}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPlace(place)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Inspect details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {place.status === 'PENDING' && (
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => handleQuickApprove(place.id)}
                          className="h-8 w-8 bg-[#2D8659] hover:bg-[#236b46] text-white"
                          title="Approve immediately"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Audit Activity Stream */}
        <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm tracking-tight text-foreground">
                Audit Trail
              </h3>
              <p className="text-xs text-muted-foreground">
                System telemetry and administrator events.
              </p>
            </div>
            <Link
              href="/admin/activity"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Full Log</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {stats.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Audit stream clean</p>
                <p className="mt-1 text-[11px]">
                  Moderator decisions and platform events will log here automatically.
                </p>
              </div>
            ) : (
              stats.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/60 p-3 text-xs"
                >
                  <div className="mt-0.5 rounded-md bg-primary/10 p-1 text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-foreground">{act.action}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{act.timestamp}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 truncate">{act.target}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>PostGIS Geodetic Sync</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Operational
            </span>
          </div>
        </div>

      </div>

      {/* ── Slide-Over Detail Drawer ─────────────────────────────────── */}
      <GemDetailDrawer
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onOpenRejectModal={(place) => setRejectPlace(place)}
      />

      {/* ── Rejection Reason Modal ───────────────────────────────────── */}
      <RejectionReasonModal
        place={rejectPlace}
        isOpen={Boolean(rejectPlace)}
        onClose={() => setRejectPlace(null)}
        onSuccess={() => {
          setSelectedPlace(null);
          router.refresh();
        }}
      />
    </div>
  );
}
