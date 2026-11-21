// components/admin/GemsManagementClient.tsx

'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  MapPin,
  X,
  Check,
  Plus,
} from 'lucide-react';
import type { AdminPlace, GemStatus } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { GemDetailDrawer } from './GemDetailDrawer';
import { RejectionReasonModal } from './RejectionReasonModal';
import {
  approveGemAction,
  bulkApproveGemsAction,
  bulkRejectGemsAction,
  deleteGemAction,
} from '@/lib/admin/actions';
import { useRouter } from 'next/navigation';

interface GemsManagementClientProps {
  initialPlaces: AdminPlace[];
}

export function GemsManagementClient({ initialPlaces }: GemsManagementClientProps) {
  const router = useRouter();
  const [places, setPlaces] = useState<AdminPlace[]>(initialPlaces);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GemStatus | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<AdminPlace | null>(null);
  const [rejectPlace, setRejectPlace] = useState<AdminPlace | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered places matching active filters
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.district?.name.toLowerCase().includes(search.toLowerCase()) ||
        p.submitter?.username?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [places, search, statusFilter]);

  // Bulk selection handlers
  const allSelected =
    filteredPlaces.length > 0 && selectedIds.length === filteredPlaces.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPlaces.map((p) => p.id));
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Quick action: approve
  async function handleApprove(id: string) {
    setIsProcessing(true);
    await approveGemAction(id);
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'APPROVED' } : p))
    );
    setIsProcessing(false);
    router.refresh();
  }

  // Quick action: delete
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to permanently delete this gem?')) return;
    setIsProcessing(true);
    await deleteGemAction(id);
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    setIsProcessing(false);
    router.refresh();
  }

  // Bulk actions
  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    await bulkApproveGemsAction(selectedIds);
    setPlaces((prev) =>
      prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status: 'APPROVED' } : p))
    );
    setSelectedIds([]);
    setIsProcessing(false);
    router.refresh();
  }

  async function handleBulkReject() {
    if (selectedIds.length === 0) return;
    const reason = prompt('Reason for bulk rejection:', 'Submission criteria not met');
    if (!reason) return;

    setIsProcessing(true);
    await bulkRejectGemsAction(selectedIds, reason);
    setPlaces((prev) =>
      prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status: 'REJECTED' } : p))
    );
    setSelectedIds([]);
    setIsProcessing(false);
    router.refresh();
  }

  // Export to CSV
  function handleExportCSV() {
    const rows = [
      ['ID', 'Name', 'District', 'Status', 'Rating', 'Hidden Score', 'Submitted By'],
      ...filteredPlaces.map((p) => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.district?.name || 'Nepal',
        p.status,
        p.average_rating,
        p.hidden_score,
        p.submitter?.username || 'anonymous',
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hiddengems_nepal_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header & Top Bar ───────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Gems Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Destinations & Gems
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Full inventory management, geocoding validation, and moderation for {places.length} destinations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          <Link href="/submit" target="_blank">
            <Button size="sm" className="gap-1.5 bg-primary text-white font-bold text-xs shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Gem</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by gem name, submitter, or location..."
            className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-8 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 font-semibold transition-colors shrink-0 ${
                statusFilter === status
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <span>{status}</span>
              <span className="ml-1.5 text-[10px] opacity-75">
                ({status === 'ALL' ? places.length : places.filter((p) => p.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk Actions Floating Toolbar (When rows selected) ───────── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3 px-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span className="rounded-md bg-primary text-white px-2 py-0.5 text-[11px]">
              {selectedIds.length}
            </span>
            <span>items selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="h-8 gap-1 text-xs font-bold bg-[#2D8659] hover:bg-[#236b46] text-white"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Bulk Approve</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBulkReject}
              disabled={isProcessing}
              className="h-8 gap-1 text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Bulk Reject</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-muted-foreground"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* ── Rich Data Table ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="border-b border-border/80 bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3">Destination Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Submitted By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Hidden Score</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border/60">
              {filteredPlaces.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    No destinations match the active search or status criteria.
                  </td>
                </tr>
              ) : (
                filteredPlaces.map((place) => {
                  const isChecked = selectedIds.includes(place.id);

                  return (
                    <tr
                      key={place.id}
                      className={`group transition-colors ${
                        isChecked
                          ? 'bg-primary/5'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(place.id)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                      </td>

                      {/* Gem Name + Thumbnail */}
                      <td className="px-4 py-3">
                        <div
                          onClick={() => setSelectedPlace(place)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/60">
                            {place.cover_image_url ? (
                              <Image
                                src={place.cover_image_url}
                                alt={place.name}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-primary">
                                <CategoryIcon name={place.category?.name} className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {place.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {place.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                          <CategoryIcon name={place.category?.name} className="h-3 w-3 text-primary" />
                          <span>{place.category?.name || 'General'}</span>
                        </span>
                      </td>

                      {/* District */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-foreground/90">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{place.district?.name || 'Nepal'}</span>
                        </div>
                      </td>

                      {/* Submitter */}
                      <td className="px-4 py-3 text-muted-foreground">
                        @{place.submitter?.username || 'explorer'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
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
                      </td>

                      {/* Hidden Score */}
                      <td className="px-4 py-3 font-mono font-bold text-[#FF8500]">
                        {place.hidden_score}
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="h-3 w-3 fill-amber-500" />
                          <span>{place.average_rating > 0 ? place.average_rating.toFixed(1) : '—'}</span>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPlace(place)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {place.status === 'PENDING' && (
                            <Button
                              type="button"
                              size="icon"
                              onClick={() => handleApprove(place.id)}
                              className="h-7 w-7 bg-[#2D8659] hover:bg-[#236b46] text-white"
                              title="Approve immediately"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(place.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between border-t border-border/80 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <span>Showing {filteredPlaces.length} of {places.length} destinations</span>
          <span className="font-mono text-[11px]">Database table: public.places</span>
        </div>
      </div>

      {/* ── Slide-Over Detail Drawer ─────────────────────────────────── */}
      <GemDetailDrawer
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onStatusChanged={(id, newStatus) => {
          setPlaces((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
          );
        }}
        onOpenRejectModal={(place) => setRejectPlace(place)}
      />

      {/* ── Rejection Reason Modal ───────────────────────────────────── */}
      <RejectionReasonModal
        place={rejectPlace}
        isOpen={Boolean(rejectPlace)}
        onClose={() => setRejectPlace(null)}
        onSuccess={(id) => {
          setPlaces((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: 'REJECTED' } : p))
          );
          setSelectedPlace(null);
        }}
      />
    </div>
  );
}
