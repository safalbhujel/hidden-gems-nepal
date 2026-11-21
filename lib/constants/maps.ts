// lib/constants/maps.ts

import type mapboxgl from 'mapbox-gl';

// Nepal's geographic boundaries: [Southwest [lng, lat], Northeast [lng, lat]]
export const NEPAL_BOUNDS: [[number, number], [number, number]] = [
  [80.05, 26.34], // Southwest border [lng, lat]
  [88.20, 30.45], // Northeast border [lng, lat]
];

// Geometric center of Nepal [lng, lat]
export const NEPAL_CENTER: [number, number] = [84.124, 28.3949];

// Enhanced map configuration with realistic 3D and cinematic feel
export const MAP_CONFIG = {
  // Base settings
  defaultZoom: 7.2,
  minZoom: 6.2,
  maxZoom: 18.0,
  defaultPitch: 0,
  defaultBearing: 0,

  // Default photorealistic satellite style, topographic outdoor style, and dark vector style
  style: 'mapbox://styles/mapbox/dark-v11',
  satelliteStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoorsStyle: 'mapbox://styles/mapbox/outdoors-v12',
  darkStyle: 'mapbox://styles/mapbox/dark-v11',

  // 3D Terrain configuration (1.5x exaggeration for tangible Himalayan relief)
  terrain: {
    source: 'mapbox-dem',
    exaggeration: 1.5,
  },

  // Atmospheric effects for depth and natural lighting
  fog: {
    color: 'rgba(240, 236, 225, 0.75)', // Warm golden-hour haze
    'high-color': 'rgba(115, 185, 235, 0.45)', // Crisp alpine blue sky
    'horizon-blend': 0.12,
  },

  // Cinematic lighting for realistic mountain shadows
  light: {
    anchor: 'viewport' as const,
    color: 'white',
    intensity: 0.6,
    position: [1.5, 90, 80] as [number, number, number],
  },

  // Camera defaults (start flat, allow intuitive tilt to discover 3D)
  camera: {
    pitch: 0,
    bearing: 0,
  },

  // Smooth animation settings
  animation: {
    flyToSpeed: 1.2,
    easeDuration: 800,
  },

  // Clustering for nearby gems
  cluster: {
    maxZoom: 14,
    radius: 50,
  },
} as const;

// Terrain source configuration
export const TERRAIN_SOURCES = {
  'mapbox-dem': {
    type: 'raster-dem' as const,
    url: 'mapbox://mapbox.terrain-rgb',
    tileSize: 512,
    maxzoom: 15,
  },
} as const;

// Helper to check if coordinates are within Nepal
export function isWithinNepal(lng: number, lat: number): boolean {
  return (
    lng >= NEPAL_BOUNDS[0][0] &&
    lng <= NEPAL_BOUNDS[1][0] &&
    lat >= NEPAL_BOUNDS[0][1] &&
    lat <= NEPAL_BOUNDS[1][1]
  );
}

// Preset camera angles for different views
export const CAMERA_PRESETS = {
  overview: {
    center: NEPAL_CENTER,
    zoom: 7.2,
    pitch: 0,
    bearing: 0,
  },
  cinematic: {
    center: NEPAL_CENTER,
    zoom: 8.0,
    pitch: 48,
    bearing: -15,
  },
  mountain: {
    center: [86.925, 27.988] as [number, number], // Focused on Everest / Sagarmatha
    zoom: 9.5,
    pitch: 60,
    bearing: -25,
  },
} as const;

/**
 * Injects 3D terrain, atmospheric depth, lighting, and Nepal sovereign boundary
 */
export function setupEnhancedMap(map: mapboxgl.Map) {
  // 1. Add Digital Elevation Model source
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', TERRAIN_SOURCES['mapbox-dem']);
  }

  // 2. Enable 3D Terrain
  try {
    map.setTerrain({ source: 'mapbox-dem', exaggeration: MAP_CONFIG.terrain.exaggeration });
  } catch (e) {
    console.warn('[Mapbox] Terrain setup note:', e);
  }

  // 3. Set atmospheric depth fog
  try {
    map.setFog({
      range: [0.8, 14.0],
      color: MAP_CONFIG.fog.color,
      'high-color': MAP_CONFIG.fog['high-color'],
      'horizon-blend': MAP_CONFIG.fog['horizon-blend'],
    });
  } catch (e) {
    console.warn('[Mapbox] Fog setup note:', e);
  }

  // 4. Set directional lighting for mountain shadows
  try {
    map.setLight(MAP_CONFIG.light);
  } catch (e) {
    console.warn('[Mapbox] Light setup note:', e);
  }

  // 5. Nepal Sovereign Perimeter (surrounding Nepal touching India and China only)
  if (!map.getSource('nepal-outer-boundary')) {
    map.addSource('nepal-outer-boundary', {
      type: 'geojson',
      data: '/maps/nepal-boundary.geojson',
    });
  }

  // White casing for high-contrast visibility against all terrain
  if (!map.getLayer('nepal-border-casing')) {
    map.addLayer({
      id: 'nepal-border-casing',
      type: 'line',
      source: 'nepal-outer-boundary',
      paint: {
        'line-color': '#FFFFFF',
        'line-width': 5.0,
        'line-opacity': 0.85,
      },
    });
  }

  // Bold Sunset Orange border (#FF8500)
  if (!map.getLayer('nepal-national-border')) {
    map.addLayer({
      id: 'nepal-national-border',
      type: 'line',
      source: 'nepal-outer-boundary',
      paint: {
        'line-color': '#FF8500',
        'line-width': 3.5,
        'line-opacity': 0.95,
      },
    });
  }
}
