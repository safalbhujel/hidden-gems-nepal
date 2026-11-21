// components/icons/CategoryIcon.tsx

import React from 'react';
import {
  Trees,          // 1. Nature Escapes (forests, wilderness)
  UtensilsCrossed,// 2. Food Gems (local cuisine, street food)
  Coffee,         // 3. Cafés & Chill (cozy nooks, aesthetic cafes)
  Sunset,         // 4. Views & Sunsets (viewpoints, horizons, sunrise)
  Tent,           // 5. Picnic & Hangout (outdoor gathering, camping)
  Heart,          // 6. Date Spots (romantic viewpoints, couple spots)
  MountainSnow,   // 7. Adventure & Hikes (alpine trekking, peaks, trails)
  Landmark,       // 8. Culture & Local Life (temples, heritage, stupas)
  Droplets,       // Waterfalls, sacred lakes, glacial tarns
  Binoculars,     // Wildlife sanctuaries & safari
  Camera,         // Scenic photo lookouts
  Compass,        // Navigation & unmarked trails
  Sparkles,       // Hidden highlights
  MapPin,         // Geospatial fallback
  type LucideIcon,
} from 'lucide-react';

export interface CategoryIconProps {
  slug?: string | null;
  name?: string | null;
  icon?: string | null;
  className?: string;
  strokeWidth?: number;
}

/**
 * Strict 1-to-1 mapping for the 8 primary platform categories.
 * Enforces ZERO icon collisions across all category chips and cards.
 */
const CANONICAL_CATEGORY_ICONS: Record<string, LucideIcon> = {
  // 1. Nature Escapes
  'nature-escapes': Trees,
  'nature': Trees,

  // 2. Food Gems
  'food-gems': UtensilsCrossed,
  'food': UtensilsCrossed,

  // 3. Cafés & Chill
  'cafes-chill': Coffee,
  'cafes': Coffee,
  'cafe': Coffee,

  // 4. Views & Sunsets
  'views-sunsets': Sunset,
  'views': Sunset,
  'sunsets': Sunset,

  // 5. Picnic & Hangout
  'picnic-hangout': Tent,
  'picnic': Tent,
  'hangout': Tent,

  // 6. Date Spots
  'date-spots': Heart,
  'dates': Heart,

  // 7. Adventure & Hikes
  'adventure-hikes': MountainSnow,
  'adventure': MountainSnow,
  'hikes': MountainSnow,

  // 8. Culture & Local Life
  'culture-local': Landmark,
  'culture-local-life': Landmark,
  'culture': Landmark,
};

/**
 * Premium, vector-based Category Icon resolver.
 * Adheres strictly to the Anti-Slop, Anti-Emoji frontend design standards.
 * Guarantees distinct, non-repeating silhouettes for every category.
 */
export function CategoryIcon({
  slug = '',
  name = '',
  icon = '',
  className = 'h-4 w-4',
  strokeWidth = 1.75,
}: CategoryIconProps) {
  const normalizedSlug = (slug || '').toLowerCase().trim();
  const normalizedName = (name || '').toLowerCase().trim();
  const normalizedIcon = (icon || '').toLowerCase().trim();

  // 1. Exact canonical slug match (Fastest, highest accuracy)
  if (normalizedSlug && CANONICAL_CATEGORY_ICONS[normalizedSlug]) {
    const IconComponent = CANONICAL_CATEGORY_ICONS[normalizedSlug];
    return <IconComponent className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // 2. Explicit icon identifier match (if stored by component name)
  const iconLookup: Record<string, LucideIcon> = {
    trees: Trees,
    utensilscrossed: UtensilsCrossed,
    coffee: Coffee,
    sunset: Sunset,
    tent: Tent,
    heart: Heart,
    mountainsnow: MountainSnow,
    landmark: Landmark,
    droplets: Droplets,
    binoculars: Binoculars,
    camera: Camera,
    compass: Compass,
    sparkles: Sparkles,
  };

  if (normalizedIcon && iconLookup[normalizedIcon]) {
    const IconComponent = iconLookup[normalizedIcon];
    return <IconComponent className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // 3. Normalized keyword heuristics (Unique, non-overlapping priority order)
  const combined = `${normalizedSlug} ${normalizedName}`.toLowerCase();

  // Category: Cafés & Chill
  if (combined.includes('cafe') || combined.includes('café') || combined.includes('coffee') || combined.includes('chill')) {
    return <Coffee className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // Category: Food Gems
  if (
    combined.includes('food') ||
    combined.includes('restaurant') ||
    combined.includes('eat') ||
    combined.includes('eatery') ||
    combined.includes('taste') ||
    combined.includes('dish')
  ) {
    return <UtensilsCrossed className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // Category: Views & Sunsets
  if (
    combined.includes('view') ||
    combined.includes('sunset') ||
    combined.includes('sunrise') ||
    combined.includes('lookout') ||
    combined.includes('horizon')
  ) {
    return <Sunset className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // Category: Date Spots
  if (
    combined.includes('date') ||
    combined.includes('romantic') ||
    combined.includes('romance') ||
    combined.includes('couple') ||
    combined.includes('love')
  ) {
    return <Heart className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // Category: Adventure & Hikes
  if (
    combined.includes('adventure') ||
    combined.includes('hike') ||
    combined.includes('trek') ||
    combined.includes('climb') ||
    combined.includes('peak') ||
    combined.includes('mountain') ||
    combined.includes('himal')
  ) {
    return <MountainSnow className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // Category: Culture & Local Life
  if (
    combined.includes('culture') ||
    combined.includes('heritage') ||
    combined.includes('temple') ||
    combined.includes('monastery') ||
    combined.includes('stupa') ||
    combined.includes('village') ||
    combined.includes('historic')
  ) {
    return <Landmark className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // Category: Picnic & Hangout
  if (
    combined.includes('picnic') ||
    combined.includes('hangout') ||
    combined.includes('camp') ||
    combined.includes('relax') ||
    combined.includes('park')
  ) {
    return <Tent className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // Category: Nature Escapes (Lakes, Waterfalls, Forests)
  if (
    combined.includes('waterfall') ||
    combined.includes('lake') ||
    combined.includes('river') ||
    combined.includes('jharna') ||
    combined.includes('fall') ||
    combined.includes('tarn') ||
    combined.includes('pokhari')
  ) {
    return <Droplets className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  if (
    combined.includes('nature') ||
    combined.includes('forest') ||
    combined.includes('wild') ||
    combined.includes('jungle') ||
    combined.includes('tree')
  ) {
    return <Trees className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  if (combined.includes('safari') || combined.includes('wildlife') || combined.includes('bird')) {
    return <Binoculars className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  if (combined.includes('photo') || combined.includes('scenic')) {
    return <Camera className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  if (combined.includes('trail') || combined.includes('route') || combined.includes('explore')) {
    return <Compass className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  // Default subtle fallback
  return <MapPin className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
