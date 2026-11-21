import React from 'react';
import {
  Mountain,
  Droplets,
  UtensilsCrossed,
  Landmark,
  Tent,
  Camera,
  Compass,
  MapPin,
} from 'lucide-react';

interface CategoryIconProps {
  slug?: string;
  name?: string;
  className?: string;
}

/**
 * Premium, vector-based Category Icon resolver.
 * Replaces generic/raw emoji placeholders with restrained, high-craft SVG icons.
 */
export function CategoryIcon({ slug = '', name = '', className = 'h-4 w-4' }: CategoryIconProps) {
  const identifier = `${slug} ${name}`.toLowerCase();

  if (
    identifier.includes('mountain') ||
    identifier.includes('trek') ||
    identifier.includes('hike') ||
    identifier.includes('peak') ||
    identifier.includes('himal')
  ) {
    return <Mountain className={className} strokeWidth={1.75} aria-hidden="true" />;
  }

  if (
    identifier.includes('water') ||
    identifier.includes('lake') ||
    identifier.includes('river') ||
    identifier.includes('jharna') ||
    identifier.includes('fall')
  ) {
    return <Droplets className={className} strokeWidth={1.75} aria-hidden="true" />;
  }

  if (
    identifier.includes('food') ||
    identifier.includes('cafe') ||
    identifier.includes('coffee') ||
    identifier.includes('eat') ||
    identifier.includes('restaurant')
  ) {
    return <UtensilsCrossed className={className} strokeWidth={1.75} aria-hidden="true" />;
  }

  if (
    identifier.includes('temple') ||
    identifier.includes('culture') ||
    identifier.includes('heritage') ||
    identifier.includes('stupa') ||
    identifier.includes('monastery') ||
    identifier.includes('historic')
  ) {
    return <Landmark className={className} strokeWidth={1.75} aria-hidden="true" />;
  }

  if (
    identifier.includes('camp') ||
    identifier.includes('tent') ||
    identifier.includes('forest') ||
    identifier.includes('nature') ||
    identifier.includes('wild')
  ) {
    return <Tent className={className} strokeWidth={1.75} aria-hidden="true" />;
  }

  if (
    identifier.includes('view') ||
    identifier.includes('photo') ||
    identifier.includes('sunrise') ||
    identifier.includes('sunset') ||
    identifier.includes('scenic')
  ) {
    return <Camera className={className} strokeWidth={1.75} aria-hidden="true" />;
  }

  if (
    identifier.includes('adventure') ||
    identifier.includes('explore') ||
    identifier.includes('trail')
  ) {
    return <Compass className={className} strokeWidth={1.75} aria-hidden="true" />;
  }

  return <MapPin className={className} strokeWidth={1.75} aria-hidden="true" />;
}
