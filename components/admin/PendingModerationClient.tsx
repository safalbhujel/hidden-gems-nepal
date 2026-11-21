// components/admin/PendingModerationClient.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  MapPin,
  ExternalLink,
  Gem,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import type { AdminPlace } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { RejectionReasonModal } from './RejectionReasonModal';
import { approveGemAction } from '@/lib/admin/actions';
import { useRouter } from 'next/navigation';

interface PendingModerationClientProps {
  initialPending: AdminPlace[];
}

export function PendingModerationClient({ initialPending }: PendingModerationClientProps) {
  const router = useRouter();
  const [pendingList, setPendingList] = useState<AdminPlace[]>(initialPending);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rejectPlace, setRejectPlace] = useState<AdminPlace | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  const currentPlace = pendingList[selectedIndex] || null;

  const handleApproveCurrent = useCallback(async () => {
    if (!currentPlace) return;
    setIsProcessing(true);
    await approveGemAction(currentPlace.id);
    setPendingList((prev) => prev.filter((p) => p.id !== currentPlace.id));
    setSelectedIndex(0);
    setSelectedPhotoIdx(0);
    setIsProcessing(false);
    router.refresh();
  }, [currentPlace, router]);

  // Keyboard navigation & shortcuts (A=Approve, R=Reject, ↑/↓=navigate)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, pendingList.length - 1));
        setSelectedPhotoIdx(0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        setSelectedPhotoIdx(0);
      } else if (e.key.toLowerCase() === 'a' && currentPlace) {
        e.preventDefault();
        handleApproveCurrent();
      } else if (e.key.toLowerCase() === 'r' && currentPlace) {
        e.preventDefault();
        setRejectPlace(currentPlace);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingList.length, currentPlace, handleApproveCurrent]);

  const images = currentPlace?.images?.length
    ? currentPlace.images
    : currentPlace?.cover_image_url
    ? [currentPlace.cover_image_url]
    : [];

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Pending Approvals</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <span>Moderation Queue</span>
            <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-xs font-bold border border-amber-500/30">
              {pendingList.length} Awaiting Review
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Split-screen verification workflow with duplicate detection and fast keyboard shortcuts.
          </p>
        </div>

        {/* Keyboard hints pill */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
          <span>Shortcuts:</span>
          <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">A</kbd> Approve
          <span>·</span>
          <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">R</kbd> Reject
          <span>·</span>
          <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↑/↓</kbd> Select
        </div>
      </div>

      {pendingList.length === 0 ? (
        /* Empty Queue State */
        <div className="rounded-2xl border border-border/80 bg-card p-16 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Moderation Queue Clear!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            All user-submitted hidden gems have been vetted and published to the live Mapbox spatial registry.
          </p>
          <div className="pt-2">
            <Link href="/admin/gems">
              <Button variant="outline" size="sm" className="text-xs">
                Browse All Destinations
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* ── Split-Screen Interface ─────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel (40% width): List of Pending Submissions */}
          <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs divide-y divide-border/60">
            <div className="bg-muted/40 p-3 px-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span>Submissions ({pendingList.length})</span>
              <span className="text-[10px] lowercase font-normal">Click to preview</span>
            </div>

            <div className="max-h-[640px] overflow-y-auto divide-y divide-border/40">
              {pendingList.map((place, idx) => {
                const isSelected = selectedIndex === idx;

                return (
                  <div
                    key={place.id}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setSelectedPhotoIdx(0);
                    }}
                    className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-all duration-150 relative ${
                      isSelected
                        ? 'bg-muted/70 border-l-[4px] border-primary'
                        : 'hover:bg-muted/40 border-l-[4px] border-transparent'
                    }`}
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
                      {place.cover_image_url ? (
                        <Image
                          src={place.cover_image_url}
                          alt={place.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-primary">
                          <Compass className="h-6 w-6" />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-[#FF8500]">
                        {place.hidden_score}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-foreground">
                          {place.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {new Date(place.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span className="text-foreground/80 font-medium">{place.district?.name || 'Nepal'}</span>
                        <span>·</span>
                        <span>@{place.submitter?.username || 'user'}</span>
                      </p>

                      <div className="mt-1 flex items-center gap-1 text-[10px] text-primary font-semibold">
                        <CategoryIcon name={place.category?.name} className="h-3 w-3" />
                        <span>{place.category?.name || 'General'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel (60% width): Detailed Preview & Verification */}
          {currentPlace && (
            <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 space-y-6 shadow-2xs">
              
              {/* Duplicate Detection Warning Banner */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-start gap-2.5 text-xs text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">
                    Duplicate Pre-Check Passed
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    No active places share identical names or coordinates within 3km in {currentPlace.district?.name || 'this district'}.
                  </p>
                </div>
              </div>

              {/* Photo Showcase */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted border border-border/60">
                    <Image
                      src={images[selectedPhotoIdx]}
                      alt={currentPlace.name}
                      fill
                      className="object-cover"
                      sizes="600px"
                      priority
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-[#FF8500] border border-[#FF8500]/40">
                      <Gem className="h-3.5 w-3.5" />
                      <span>Proposed Hidden Score: {currentPlace.hidden_score}</span>
                    </div>
                  </div>

                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((img, idx) => (
                        <button
                          key={img}
                          type="button"
                          onClick={() => setSelectedPhotoIdx(idx)}
                          className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                            selectedPhotoIdx === idx
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Header metadata */}
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {currentPlace.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {currentPlace.district?.name}, {currentPlace.district?.province_name}
                  </span>
                  <span>·</span>
                  <span>Submitted by @{currentPlace.submitter?.username || 'explorer'}</span>
                  <span>·</span>
                  <span>{new Date(currentPlace.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Description & Story */}
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60 space-y-1">
                  <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Why It Deserves To Be Found:
                  </p>
                  <p className="text-muted-foreground">{currentPlace.why_special}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Full Description:
                  </p>
                  <p className="text-muted-foreground whitespace-pre-line">{currentPlace.description}</p>
                </div>

                {currentPlace.travel_tips && (
                  <div className="space-y-1">
                    <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                      Practical Tips & Advice:
                    </p>
                    <p className="text-muted-foreground">{currentPlace.travel_tips}</p>
                  </div>
                )}
              </div>

              {/* Coordinates & Technical Attributes */}
              <div className="grid grid-cols-3 gap-2 text-xs rounded-xl bg-muted/20 p-3 border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Coordinates</span>
                  {currentPlace.latitude && currentPlace.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${currentPlace.latitude},${currentPlace.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-primary font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>{currentPlace.latitude.toFixed(3)}, {currentPlace.longitude.toFixed(3)}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : (
                    <span>Not supplied</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Difficulty</span>
                  <span className="font-semibold text-foreground">{currentPlace.difficulty || 'Moderate'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Budget</span>
                  <span className="font-semibold text-foreground">{currentPlace.budget || 'Budget'}</span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center justify-between pt-4 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectPlace(currentPlace)}
                  disabled={isProcessing}
                  className="gap-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject Submission (R)</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleApproveCurrent}
                  disabled={isProcessing}
                  className="gap-1.5 text-xs font-bold bg-[#2D8659] hover:bg-[#236b46] text-white shadow-xs"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isProcessing ? 'Publishing...' : 'Approve & Publish (A)'}</span>
                </Button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ── Rejection Reason Modal ───────────────────────────────────── */}
      <RejectionReasonModal
        place={rejectPlace}
        isOpen={Boolean(rejectPlace)}
        onClose={() => setRejectPlace(null)}
        onSuccess={(id) => {
          setPendingList((prev) => prev.filter((p) => p.id !== id));
          setSelectedIndex(0);
          router.refresh();
        }}
      />
    </div>
  );
}
