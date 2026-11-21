// components/admin/FeaturedGemsClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { AdminPlace } from '@/lib/admin/types';
import { Button } from '@/components/ui/button';
import { toggleFeaturedAction } from '@/lib/admin/actions';

interface FeaturedGemsClientProps {
  initialGems: AdminPlace[];
}

export function FeaturedGemsClient({ initialGems }: FeaturedGemsClientProps) {
  const [featuredGems, setFeaturedGems] = useState<AdminPlace[]>(
    initialGems.filter((g) => g.is_featured || g.status === 'APPROVED').slice(0, 4)
  );
  const [availableGems, setAvailableGems] = useState<AdminPlace[]>(
    initialGems.filter((g) => !featuredGems.some((f) => f.id === g.id))
  );

  function handleAddFeatured(gem: AdminPlace) {
    if (featuredGems.length >= 10) {
      alert('Maximum 10 gems can be spotlighted at once.');
      return;
    }
    setFeaturedGems((prev) => [...prev, gem]);
    setAvailableGems((prev) => prev.filter((g) => g.id !== gem.id));
    toggleFeaturedAction(gem.id, true);
  }

  function handleRemoveFeatured(gem: AdminPlace) {
    setFeaturedGems((prev) => prev.filter((g) => g.id !== gem.id));
    setAvailableGems((prev) => [gem, ...prev]);
    toggleFeaturedAction(gem.id, false);
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= featuredGems.length) return;

    const copy = [...featuredGems];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setFeaturedGems(copy);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Featured Spotlight</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <span>Homepage Spotlight Manager</span>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
              {featuredGems.length}/10 Active
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Curate and prioritize top destinations showcased on the consumer homepage carousel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Spotlight Active Order */}
        <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-bold text-sm text-foreground">
              Active Spotlight Order ({featuredGems.length} of 10)
            </h3>
            <span className="text-[11px] text-muted-foreground">Order determines carousel position</span>
          </div>

          <div className="space-y-2">
            {featuredGems.map((gem, idx) => (
              <div
                key={gem.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-background/90 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/60">
                    {gem.cover_image_url && (
                      <Image src={gem.cover_image_url} alt="" fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-foreground truncate">{gem.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span>{gem.district?.name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === featuredGems.length - 1}
                    className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeatured(gem)}
                    className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Remove from spotlight"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Approved Pool to Add */}
        <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-bold text-sm text-foreground">Available Approved Destinations</h3>
            <span className="text-[11px] text-muted-foreground">{availableGems.length} available</span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {availableGems.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                All approved gems are currently featured.
              </p>
            ) : (
              availableGems.map((gem) => (
                <div
                  key={gem.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/80 text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="font-bold text-foreground truncate">{gem.name}</p>
                    <p className="text-[10px] text-muted-foreground">{gem.district?.name || 'Nepal'}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddFeatured(gem)}
                    className="h-7 text-xs gap-1 bg-primary text-white font-semibold"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Feature</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
