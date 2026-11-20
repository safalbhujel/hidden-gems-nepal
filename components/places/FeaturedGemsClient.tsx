'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Lock, ArrowRight, Sparkles } from 'lucide-react'
import type { PlaceCardData, SortOption } from '@/lib/types/places'

interface FeaturedGemsClientProps {
  initialPlaces: PlaceCardData[]
  sortedNewest: PlaceCardData[]
  sortedTopRated: PlaceCardData[]
  sortedMostHidden: PlaceCardData[]
}

const TABS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'newest', label: 'Just Added', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'highest_rated', label: 'Top Rated', icon: <Star className="h-4 w-4" /> },
  { value: 'most_hidden', label: 'Most Hidden', icon: <Lock className="h-4 w-4" /> },
]

export function FeaturedGemsClient({
  sortedNewest,
  sortedTopRated,
  sortedMostHidden,
}: FeaturedGemsClientProps) {
  const [activeSort, setActiveSort] = useState<SortOption>('newest')

  const places =
    activeSort === 'highest_rated' ? sortedTopRated
    : activeSort === 'most_hidden' ? sortedMostHidden
    : sortedNewest

  return (
    <>
      {/* Sort tabs — flat pill style, active state uses bg-primary token */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveSort(tab.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
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
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Hidden gems are being discovered…</p>
          <p className="text-sm mt-1">Check back soon for amazing spots!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.slice(0, 3).map((place) => (
            <Link
              key={place.slug}
              href={'/places/' + place.slug}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
            >
              {/*
                Flat-By-Default: removed shadow-sm / hover:shadow-lg.
                White card on cream canvas provides visual separation.
                hover:-translate-y-0.5 gives tactile press feedback.
              */}
              <article className="h-full overflow-hidden rounded-xl border border-border bg-card transition-transform duration-200 hover:-translate-y-0.5">
                {/* Cover image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {place.cover_image_url ? (
                    <Image
                      src={place.cover_image_url}
                      alt={place.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <MapPin className="h-12 w-12 text-primary opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                  {/* Hidden score — flat frosted chip, no shadow */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 px-2.5 py-1 rounded-lg text-xs font-bold border border-border text-primary">
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    <span>{place.hidden_score}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-2">
                  {place.districts && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" aria-hidden="true" />
                      <span>{place.districts.name}</span>
                      {place.categories && (
                        <><span>·</span><span>{place.categories.name}</span></>
                      )}
                    </div>
                  )}
                  <h3 className="font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
                    {place.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm">
                    {place.average_rating > 0 ? (
                      <>
                        <Star className="h-4 w-4 fill-primary text-primary flex-shrink-0" aria-hidden="true" />
                        <span className="font-semibold tabular-nums">{place.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs">({place.review_count} reviews)</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No reviews yet</span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}