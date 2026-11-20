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
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

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

      // Custom marker container (Instagram/Snapchat style bubble)
      const el = document.createElement('div');
      el.className = 'custom-marker-node cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95';
      el.innerHTML = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          gap: 4px;
          background: hsl(28 100% 50%);
          color: white;
          padding: 4px 8px;
          border-radius: 9999px;
          font-family: inherit;
          font-weight: 700;
          font-size: 11px;
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.45);
          border: 2px solid white;
        ">
          <span style="font-size: 10px;">💎</span>
          <span>${place.hidden_score.toFixed(1)}</span>
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid hsl(28 100% 50%);
          "></div>
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
          className="gap-2 rounded-xl border-border/80 bg-background/95 shadow-md backdrop-blur-md hover:bg-background"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Navigation className="h-4 w-4 text-primary" />
          )}
          <span className="text-xs font-semibold">Gems Near Me</span>
        </Button>

        <div className="rounded-xl border border-border/80 bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-md backdrop-blur-md">
          {places.length} {places.length === 1 ? 'gem' : 'gems'} on map
        </div>
      </div>

      {/* ── Map Container ────────────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* ── Instagram / Snapchat Style Floating Place Card ───────────────── */}
      {activePlace && (
        <div className="absolute bottom-4 left-4 right-4 z-20 sm:left-auto sm:right-4 sm:w-96 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative flex gap-3 overflow-hidden rounded-2xl border border-border/80 bg-background/95 p-3 shadow-2xl backdrop-blur-xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => handleSelectPlace(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Thumbnail */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
              {activePlace.cover_image_url ? (
                <Image
                  src={activePlace.cover_image_url}
                  alt={activePlace.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                  <Compass className="h-8 w-8" />
                </div>
              )}
              {/* Hidden Score Badge */}
              <div className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                💎 {activePlace.hidden_score.toFixed(1)}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-between overflow-hidden pr-4">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {activePlace.district && (
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                      {activePlace.district.name}
                    </span>
                  )}
                  {activePlace.category && (
                    <span className="text-[11px] text-muted-foreground">• {activePlace.category.name}</span>
                  )}
                </div>
                <h4 className="line-clamp-1 text-sm font-bold text-foreground">
                  {activePlace.name}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>{activePlace.average_rating > 0 ? activePlace.average_rating.toFixed(1) : 'New'}</span>
                  <span className="text-[10px] text-muted-foreground">({activePlace.review_count})</span>
                </div>

                <Link
                  href={`/places/${activePlace.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
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
