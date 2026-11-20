// lib/constants/maps.ts

/**
 * Geographic bounding box for Nepal: [Southwest [lng, lat], Northeast [lng, lat]]
 * Restricts map panning and geocoding searches strictly to Nepal's boundaries.
 */
export const NEPAL_BOUNDS: [[number, number], [number, number]] = [
  [80.05, 26.34], // Southwest border [lng, lat]
  [88.20, 30.45], // Northeast border [lng, lat]
];

/**
 * Geometric center of Nepal [lng, lat]
 */
export const NEPAL_CENTER: [number, number] = [84.124, 28.3949];

export const MAP_CONFIG = {
  defaultZoom: 7.2,
  minZoom: 5.8,
  maxZoom: 18.0,
  defaultPitch: 50, // Cinematic 3D Himalayan slant (Snapchat style)
  defaultBearing: -14,
  // Luxury photorealistic satellite style
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  darkStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;

/**
 * Helper to check whether given coordinates fall within Nepal bounds
 */
export function isWithinNepal(lng: number, lat: number): boolean {
  return (
    lng >= NEPAL_BOUNDS[0][0] &&
    lng <= NEPAL_BOUNDS[1][0] &&
    lat >= NEPAL_BOUNDS[0][1] &&
    lat <= NEPAL_BOUNDS[1][1]
  );
}
