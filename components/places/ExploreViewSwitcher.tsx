'use client';

import { useState } from 'react';
import { LayoutGrid, Map as MapIcon, Clock } from 'lucide-react';
import type { PlaceCardData, PlaceMapPin, Category, District } from '@/lib/types/places';
import { PlaceCard } from '@/components/places/PlaceCard';
import { ExploreMap } from '@/components/maps/ExploreMap';

interface ExploreViewSwitcherProps {
  places: PlaceCardData[];
  mapPins: PlaceMapPin[];
  currentUserId?: string | null;
  isAdmin?: boolean;
  categories?: Category[];
  districts?: District[];
}

export function ExploreViewSwitcher({
  places,
  mapPins,
  currentUserId,
  isAdmin = false,
  categories = [],
  districts = [],
}: ExploreViewSwitcherProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>();

  const pendingCount = places.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* ── View Toggle Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <p className="text-sm text-muted-foreground font-medium">
            Showing <span className="font-bold text-foreground">{places.length}</span> hidden destinations
          </p>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <Clock className="h-3 w-3 text-amber-500" />
              <span>{pendingCount} in community review</span>
            </span>
          )}
        </div>

        <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5 text-primary" />
            <span>Interactive Map</span>
          </button>
        </div>
      </div>

      {/* ── View Content ───────────────────────────────────────────────────── */}
      {viewMode === 'grid' ? (
        places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">No places found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Try adjusting your search or category filters to discover more hidden spots.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <PlaceCard
                key={place.slug}
                place={place}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                categories={categories}
                districts={districts}
              />
            ))}
          </div>
        )
      ) : (
        <div className="relative">
          <ExploreMap
            places={mapPins}
            className="h-[620px] w-full"
            selectedPlaceSlug={selectedSlug}
            onSelectPlace={(place) => setSelectedSlug(place?.slug)}
          />
        </div>
      )}
    </div>
  );
}
