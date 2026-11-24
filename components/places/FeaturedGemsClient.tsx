'use client';

import { useState } from 'react';
import { Star, Lock, Clock, Compass } from 'lucide-react';
import type { PlaceCardData, SortOption, Category, District } from '@/lib/types/places';
import { PlaceCard } from '@/components/places/PlaceCard';

interface FeaturedGemsClientProps {
  initialPlaces?: PlaceCardData[];
  sortedNewest: PlaceCardData[];
  sortedTopRated: PlaceCardData[];
  sortedMostHidden: PlaceCardData[];
  currentUserId?: string | null;
  isAdmin?: boolean;
  categories?: Category[];
  districts?: District[];
}

const TABS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'newest', label: 'Just Added', icon: <Clock className="h-4 w-4" strokeWidth={1.75} /> },
  { value: 'highest_rated', label: 'Top Rated', icon: <Star className="h-4 w-4" strokeWidth={1.75} /> },
  { value: 'most_hidden', label: 'Most Hidden', icon: <Lock className="h-4 w-4" strokeWidth={1.75} /> },
];

export function FeaturedGemsClient({
  sortedNewest,
  sortedTopRated,
  sortedMostHidden,
  currentUserId,
  isAdmin = false,
  categories = [],
  districts = [],
}: FeaturedGemsClientProps) {
  const [activeSort, setActiveSort] = useState<SortOption>('newest');

  const places =
    activeSort === 'highest_rated'
      ? sortedTopRated
      : activeSort === 'most_hidden'
        ? sortedMostHidden
        : sortedNewest;

  return (
    <>
      {/* Sort tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveSort(tab.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
              activeSort === tab.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {places.length === 0 ? (
        <div className="col-span-3 text-center py-16 text-muted-foreground">
          <Compass className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="font-medium">Hidden gems are being discovered…</p>
          <p className="text-sm mt-1">Check back soon for amazing spots!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {places.slice(0, 6).map((place) => (
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
      )}
    </>
  );
}
