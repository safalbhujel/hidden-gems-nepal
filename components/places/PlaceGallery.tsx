'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import type { PlaceImage } from '@/lib/types/places'
import { cn } from '@/lib/utils'

interface PlaceGalleryProps {
  images: PlaceImage[]
  placeName: string
}

// ─────────────────────────────────────────────────────────────────────────────
// PlaceGallery
//
// Displays 1-6 images with:
//  - A large hero image (current slide)
//  - Thumbnail strip (desktop) / dot indicators (mobile)
//  - Prev / Next arrow buttons with keyboard support
// ─────────────────────────────────────────────────────────────────────────────
export function PlaceGallery({ images, placeName }: PlaceGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-muted border">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <ImageOff className="h-12 w-12 opacity-40" />
          <p className="text-sm font-medium">No images yet</p>
        </div>
      </div>
    )
  }

  const prev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length)
  const next = () => setActiveIndex((i) => (i + 1) % images.length)

  const current = images[activeIndex]

  return (
    <div className="space-y-3">
      {/* ── Hero image ──────────────────────────────────────────────────── */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted group">
        <Image
          key={current.image_url}
          src={current.image_url}
          alt={`${placeName} — photo ${activeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 80vw"
          className="object-cover transition-opacity duration-300"
          priority={activeIndex === 0}
        />

        {/* Counter pill */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* ── Thumbnails (desktop) / Dots (mobile) ────────────────────────── */}
      {images.length > 1 && (
        <>
          {/* Thumbnails — hidden on mobile */}
          <div className="hidden sm:flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                aria-label={`View photo ${i + 1}`}
                className={cn(
                  'relative flex-shrink-0 h-16 w-24 overflow-hidden rounded-lg border-2 transition-all',
                  i === activeIndex
                    ? 'border-primary opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-90'
                )}
              >
                <Image
                  src={img.image_url}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Dot indicators — mobile only */}
          <div className="flex sm:hidden justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`Photo ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all duration-200',
                  i === activeIndex
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
