'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { NEPAL_BOUNDS, NEPAL_CENTER, MAP_CONFIG } from '@/lib/constants/maps';

export interface NepalMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  onMapLoaded?: (map: mapboxgl.Map) => void;
  children?: React.ReactNode;
}

export function NepalMap({
  className = 'h-[500px] w-full',
  center = NEPAL_CENTER,
  zoom = MAP_CONFIG.defaultZoom,
  interactive = true,
  onMapLoaded,
  children,
}: NepalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('[NepalMap] Missing NEXT_PUBLIC_MAPBOX_TOKEN');
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.style,
      center,
      zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      maxBounds: NEPAL_BOUNDS,
      pitch: MAP_CONFIG.defaultPitch,
      bearing: MAP_CONFIG.defaultBearing,
      interactive,
      attributionControl: false,
    });

    if (interactive) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
    }

    map.on('style.load', () => {
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.35 });

      map.setFog({
        range: [0.6, 12.0],
        color: '#120B04',
        'high-color': '#070E1A',
        'space-color': '#020408',
        'horizon-blend': 0.12,
        'star-intensity': 0.8,
      });
    });

    map.on('load', () => {
      mapInstanceRef.current = map;
      onMapLoaded?.(map);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-muted/20 ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
      {children}
    </div>
  );
}
