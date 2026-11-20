'use client';

import { useState } from 'react';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import type { PlaceCardData, PlaceMapPin } from '@/lib/types/places';
import { PlaceCard } from '@/components/places/PlaceCard';
import { ExploreMap } from '@/components/maps/ExploreMap';

interface ExploreViewSwitcherProps {
  places: PlaceCardData[];
  mapPins: PlaceMapPin[];
}

export function ExploreViewSwitcher({ places, mapPins }: ExploreViewSwitcherProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>();

  return (
    <div className="space-y-6">
      {/* ── View Toggle Bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          Showing <span className="font-bold text-foreground">{places.length}</span> verified hidden gems
        </p>

        <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
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
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
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
              <PlaceCard key={place.slug} place={place} />
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
