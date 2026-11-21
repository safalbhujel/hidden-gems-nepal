// components/admin/GemDetailDrawer.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  MapPin,
  ExternalLink,
  Star,
  Gem,
  CheckCircle,
  XCircle,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import type { AdminPlace } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { approveGemAction, rejectGemAction } from '@/lib/admin/actions';
import { useRouter } from 'next/navigation';

interface GemDetailDrawerProps {
  place: AdminPlace | null;
  onClose: () => void;
  onStatusChanged?: (id: string, newStatus: 'APPROVED' | 'REJECTED') => void;
  onOpenRejectModal?: (place: AdminPlace) => void;
}

export function GemDetailDrawer({
  place,
  onClose,
  onStatusChanged,
  onOpenRejectModal,
}: GemDetailDrawerProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!place) return null;

  const images = place.images?.length > 0 ? place.images : place.cover_image_url ? [place.cover_image_url] : [];

  async function handleQuickApprove() {
    if (!place) return;
    setIsUpdating(true);
    await approveGemAction(place.id);
    setIsUpdating(false);
    onStatusChanged?.(place.id, 'APPROVED');
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="relative flex h-full w-full max-w-lg flex-col justify-between border-l border-border/80 bg-background shadow-2xl animate-in slide-in-from-right duration-250">
        
        {/* ── Drawer Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
          <div className="flex items-center gap-2">
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
            <span className="text-xs text-muted-foreground">ID: {place.id.slice(0, 8)}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Drawer Scrollable Body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Gallery Carousel */}
          {images.length > 0 ? (
            <div className="space-y-2">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted border border-border/60">
                <Image
                  src={images[selectedImageIndex]}
                  alt={place.name}
                  fill
                  className="object-cover"
                  sizes="480px"
                  priority
                />
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/80 px-2 py-1 text-xs font-bold text-[#FF8500] border border-[#FF8500]/40 backdrop-blur-xs">
                  <Gem className="h-3 w-3" />
                  <span>Hidden Score: {place.hidden_score}</span>
                </div>
              </div>

              {/* Thumbnails row */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-muted border border-border/60 text-muted-foreground">
              <Compass className="h-10 w-10 opacity-30" strokeWidth={1.5} />
            </div>
          )}

          {/* Place Title & Submitter */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {place.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {place.district?.name || 'Nepal'}, {place.district?.province_name || ''}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <CategoryIcon name={place.category?.name} className="h-3.5 w-3.5 text-primary" />
                {place.category?.name || 'Uncategorized'}
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-border/80 bg-muted/30 p-3.5 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted By</p>
              <p className="font-semibold text-foreground mt-0.5">@{place.submitter?.username || 'explorer'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average Rating</p>
              <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>{place.average_rating > 0 ? place.average_rating.toFixed(1) : 'New'}</span>
                <span className="text-muted-foreground font-normal">({place.review_count} reviews)</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Coordinates</p>
              {place.latitude && place.longitude ? (
                <a
                  href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-primary font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                >
                  <span>{place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : (
                <p className="text-muted-foreground mt-0.5">Not specified</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Difficulty & Budget</p>
              <p className="font-semibold text-foreground mt-0.5">{place.difficulty || 'Moderate'} · {place.budget || 'Budget'}</p>
            </div>
          </div>

          {/* Why Special */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Why It Deserves To Be Found</h4>
            <p className="text-xs leading-relaxed text-muted-foreground rounded-xl bg-card p-3 border border-border/70">
              {place.why_special}
            </p>
          </div>

          {/* Full Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Full Description</h4>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
              {place.description}
            </p>
          </div>

          {/* Travel Tips */}
          {place.travel_tips && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Local Travel Tips</h4>
              <p className="text-xs leading-relaxed text-muted-foreground rounded-xl bg-amber-500/5 p-3 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                {place.travel_tips}
              </p>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {place.rejection_reason && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Rejection Reason:</span>
              </p>
              <p>{place.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* ── Drawer Footer Actions ───────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border/80 bg-muted/20 px-6 py-4">
          <Link
            href={`/places/${place.slug}`}
            target="_blank"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <span>Public Page</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <div className="flex items-center gap-2">
            {place.status !== 'REJECTED' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onOpenRejectModal) {
                    onOpenRejectModal(place);
                  } else {
                    rejectGemAction(place.id);
                    onStatusChanged?.(place.id, 'REJECTED');
                  }
                }}
                disabled={isUpdating}
                className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject</span>
              </Button>
            )}

            {place.status !== 'APPROVED' && (
              <Button
                type="button"
                size="sm"
                onClick={handleQuickApprove}
                disabled={isUpdating}
                className="gap-1.5 text-xs font-bold bg-[#2D8659] hover:bg-[#236b46] text-white"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{isUpdating ? 'Approving...' : 'Approve & Publish'}</span>
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
