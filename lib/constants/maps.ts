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

import type mapboxgl from 'mapbox-gl';

export const MAP_CONFIG = {
  defaultZoom: 7.2,
  minZoom: 5.8,
  maxZoom: 18.0,
  defaultPitch: 35, // Natural comfortable angle for crystal-clear satellite overview
  defaultBearing: 0,
  // High-resolution satellite streets hybrid style
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  darkStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;

/**
 * Injects bright daylight atmosphere, 3D Himalayan terrain, and thick brand-themed borders (Nepal + Provinces)
 */
export function setupDaylightSatelliteMap(map: mapboxgl.Map) {
  // 1. Digital Elevation Model (3D Himalayas)
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });
  }
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });

  // 2. Bright, radiant daylight Himalayan sky & alpine mist (light, clear, vibrant)
  map.setFog({
    range: [1.0, 20.0],
    color: '#F4F9FD', // Pure crisp morning alpine mist
    'high-color': '#60B8E8', // Radiant daylight Himalayan azure sky
    'space-color': '#2C88CA', // Crisp daylight upper atmosphere
    'horizon-blend': 0.08,
    'star-intensity': 0.0, // Full daylight sunshine
  });

  // 3. Exact sovereign outer border of Nepal only (surrounds Nepal touching India & China; all internal/other borders stay default clean)
  if (!map.getSource('nepal-outer-boundary')) {
    map.addSource('nepal-outer-boundary', {
      type: 'geojson',
      data: '/maps/nepal-boundary.geojson',
    });
  }

  // Outer white casing: ensures the border pops against dark forests and glaciers
  if (!map.getLayer('nepal-border-casing')) {
    map.addLayer({
      id: 'nepal-border-casing',
      type: 'line',
      source: 'nepal-outer-boundary',
      paint: {
        'line-color': '#FFFFFF',
        'line-width': 5.5,
        'line-opacity': 0.85,
      },
    });
  }

  // Thick Nepal Outer Border in Sunset Orange (#FF8500)
  if (!map.getLayer('nepal-national-border')) {
    map.addLayer({
      id: 'nepal-national-border',
      type: 'line',
      source: 'nepal-outer-boundary',
      paint: {
        'line-color': '#FF8500',
        'line-width': 3.8,
        'line-opacity': 0.95,
      },
    });
  }
}

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
