'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';
import Image from 'next/image';
import {
  Navigation,
  Star,
  ExternalLink,
  X,
  Compass,
  Loader2,
} from 'lucide-react';
import { NEPAL_BOUNDS, NEPAL_CENTER, MAP_CONFIG, isWithinNepal } from '@/lib/constants/maps';
import type { PlaceMapPin } from '@/lib/types/places';
import { Button } from '@/components/ui/button';

interface ExploreMapProps {
  places: PlaceMapPin[];
  className?: string;
  selectedPlaceSlug?: string;
  onSelectPlace?: (place: PlaceMapPin | null) => void;
}

export function ExploreMap({
  places,
  className = 'h-[600px] w-full',
  selectedPlaceSlug,
  onSelectPlace,
}: ExploreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const [clickedPlace, setClickedPlace] = useState<PlaceMapPin | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const activePlace = selectedPlaceSlug
    ? places.find((p) => p.slug === selectedPlaceSlug) ?? clickedPlace
    : clickedPlace;

  // Fly to external selected place
  useEffect(() => {
    if (selectedPlaceSlug) {
      const target = places.find((p) => p.slug === selectedPlaceSlug);
      if (target) {
        mapRef.current?.flyTo({
          center: [target.longitude, target.latitude],
          zoom: 13,
          duration: 1000,
        });
      }
    }
  }, [selectedPlaceSlug, places]);

  const handleSelectPlace = useCallback(
    (place: PlaceMapPin | null) => {
      setClickedPlace(place);
      onSelectPlace?.(place);

      if (place && mapRef.current) {
        mapRef.current.easeTo({
          center: [place.longitude, place.latitude],
          zoom: Math.max(mapRef.current.getZoom(), 12),
          duration: 800,
        });
      }
    },
    [onSelectPlace]
  );

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.style,
      center: NEPAL_CENTER,
      zoom: MAP_CONFIG.defaultZoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      maxBounds: NEPAL_BOUNDS,
      pitch: MAP_CONFIG.defaultPitch,
      bearing: MAP_CONFIG.defaultBearing,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

    map.on('style.load', () => {
      // 3D Terrain: Mount Everest, Annapurna, and the Himalayas in photorealistic 3D
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.35 });

      // Atmospheric starry space and golden hour horizon glow
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
      mapRef.current = map;
    });

    // Close preview card when clicking map canvas
    map.on('click', (e) => {
      const target = e.originalEvent.target as HTMLElement | null;
      if (target && !target.closest('.custom-marker-node')) {
        handleSelectPlace(null);
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [handleSelectPlace]);

  // Update Markers whenever `places` prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove obsolete markers
    markersRef.current.forEach((marker, id) => {
      if (!places.some((p) => p.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or retain markers
    places.forEach((place) => {
      if (markersRef.current.has(place.id)) return;

      // Luxury Snapchat/Instagram style 3D marker
      const el = document.createElement('div');
      el.className = 'custom-marker-node cursor-pointer group transition-transform duration-300 hover:scale-125 active:scale-95';
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <!-- Ambient Luminous Orange Pulse Ring -->
          <div style="
            position: absolute;
            width: 38px;
            height: 38px;
            border-radius: 9999px;
            background: rgba(255, 133, 0, 0.4);
            animation: ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>

          <!-- Glassmorphic Acrylic Pin Badge -->
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            gap: 5px;
            background: linear-gradient(135deg, #FF8500 0%, #E65100 100%);
            color: #FFFFFF;
            padding: 5px 10px;
            border-radius: 9999px;
            font-family: inherit;
            font-weight: 800;
            font-size: 11px;
            box-shadow: 0 6px 20px rgba(255, 133, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.7);
            border: 1.5px solid rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(8px);
            transition: all 0.2s ease;
          ">
            <span style="font-size: 11px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">💎</span>
            <span style="text-shadow: 0 1px 3px rgba(0,0,0,0.5);">${place.hidden_score.toFixed(1)}</span>
            <div style="
              position: absolute;
              bottom: -5px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 5px solid #E65100;
            "></div>
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectPlace(place);
      });

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);

      markersRef.current.set(place.id, marker);
    });

    // If there are places, optionally fit bounds to visible places
    if (places.length > 0 && map) {
      const bounds = new mapboxgl.LngLatBounds();
      places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      // Only fit bounds if multiple places exist
      if (places.length > 1) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 1000 });
      }
    }
  }, [places, handleSelectPlace]);

  // "Near Me" GPS Action
  const handleFindNearMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { longitude, latitude } = pos.coords;

        if (!isWithinNepal(longitude, latitude)) {
          alert('Your current GPS location appears to be outside Nepal.');
          return;
        }

        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 13,
          duration: 1500,
          essential: true,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/20 ${className}`}>
      {/* ── Top Controls ─────────────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFindNearMe}
          disabled={isLocating}
          className="gap-2 rounded-xl border border-white/20 bg-neutral-950/80 text-white shadow-xl backdrop-blur-xl hover:bg-neutral-900 hover:text-white"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#FF8500]" />
          ) : (
            <Navigation className="h-4 w-4 text-[#FF8500]" />
          )}
          <span className="text-xs font-semibold">Gems Near Me</span>
        </Button>

        <div className="rounded-xl border border-white/15 bg-neutral-950/80 px-3.5 py-1.5 text-xs font-medium text-neutral-300 shadow-xl backdrop-blur-xl">
          <span className="text-[#FF8500] font-bold">{places.length}</span> {places.length === 1 ? 'gem' : 'gems'} in 3D
        </div>
      </div>

      {/* ── Map Container ────────────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* ── Instagram / Snapchat Style Floating Place Card ───────────────── */}
      {activePlace && (
        <div className="absolute bottom-4 left-4 right-4 z-20 sm:left-auto sm:right-4 sm:w-[400px] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="relative flex gap-3.5 overflow-hidden rounded-2xl border border-white/20 bg-neutral-950/90 p-3.5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => handleSelectPlace(null)}
              className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/10 p-1 text-neutral-400 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Thumbnail */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-900 border border-white/10">
              {activePlace.cover_image_url ? (
                <Image
                  src={activePlace.cover_image_url}
                  alt={activePlace.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#FF8500]/10 text-[#FF8500]">
                  <Compass className="h-8 w-8" />
                </div>
              )}
              {/* Hidden Score Badge */}
              <div className="absolute bottom-1.5 left-1.5 rounded-md bg-black/85 px-1.5 py-0.5 text-[10px] font-extrabold text-[#FF8500] border border-[#FF8500]/30 backdrop-blur-xs">
                💎 {activePlace.hidden_score.toFixed(1)}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-between overflow-hidden pr-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  {activePlace.district && (
                    <span className="text-[10px] font-bold text-[#FF8500] uppercase tracking-wider">
                      {activePlace.district.name}
                    </span>
                  )}
                  {activePlace.category && (
                    <span className="text-[10px] text-neutral-400">• {activePlace.category.name}</span>
                  )}
                </div>
                <h4 className="line-clamp-1 text-sm font-bold text-white tracking-tight">
                  {activePlace.name}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{activePlace.average_rating > 0 ? activePlace.average_rating.toFixed(1) : 'New'}</span>
                  <span className="text-[10px] text-neutral-400">({activePlace.review_count})</span>
                </div>

                <Link
                  href={`/places/${activePlace.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF8500] to-[#E65100] px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(255,133,0,0.4)] hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Explore</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
