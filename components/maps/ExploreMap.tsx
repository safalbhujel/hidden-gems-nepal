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
  Mountain,
  Layers,
  Maximize2,
  Gem,
} from 'lucide-react';
import {
  NEPAL_BOUNDS,
  NEPAL_CENTER,
  MAP_CONFIG,
  CAMERA_PRESETS,
  isWithinNepal,
  setupEnhancedMap,
} from '@/lib/constants/maps';
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
  className = 'h-[620px] w-full',
  selectedPlaceSlug,
  onSelectPlace,
}: ExploreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const [clickedPlace, setClickedPlace] = useState<PlaceMapPin | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activePreset, setActivePreset] = useState<'overview' | 'cinematic' | 'mountain'>('overview');
  const [activeLayer, setActiveLayer] = useState<'outdoors' | 'satellite'>('satellite');

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
          duration: MAP_CONFIG.animation.easeDuration,
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
      pitch: MAP_CONFIG.camera.pitch,
      bearing: MAP_CONFIG.camera.bearing,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }),
      'top-right'
    );

    map.on('style.load', () => {
      setupEnhancedMap(map);
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

    const currentMarkers = markersRef.current;
    return () => {
      currentMarkers.forEach((m) => m.remove());
      currentMarkers.clear();
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

      // Custom marker container matching Authentic Trailguide & Anti-Emoji rules
      const el = document.createElement('div');
      el.className =
        'custom-marker-node cursor-pointer group transition-transform duration-300 hover:scale-120 active:scale-[0.98]';
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <!-- Ambient Luminous Orange Pulse Ring -->
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 9999px;
            background: rgba(255, 133, 0, 0.35);
            animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>

          <!-- Glassmorphic Acrylic Pin Badge -->
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            gap: 4.5px;
            background: linear-gradient(135deg, #FF8500 0%, #E65100 100%);
            color: #FFFFFF;
            padding: 4px 9px;
            border-radius: 9999px;
            font-family: inherit;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 0.02em;
            box-shadow: 0 6px 18px rgba(255, 133, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.5);
            border: 1.5px solid rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(8px);
            transition: all 0.2s ease;
          ">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
              <path d="M6 3h12l4 6-10 13L2 9z"/>
            </svg>
            <span style="text-shadow: 0 1px 2px rgba(0,0,0,0.4);">${place.hidden_score.toFixed(1)}</span>
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

    // Auto-fit if places exist
    if (places.length > 1 && map) {
      const bounds = new mapboxgl.LngLatBounds();
      places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 1000 });
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
          speed: MAP_CONFIG.animation.flyToSpeed,
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

  // Camera Presets Controller
  const handleCameraPreset = (presetKey: 'overview' | 'cinematic' | 'mountain') => {
    if (!mapRef.current) return;
    setActivePreset(presetKey);
    const preset = CAMERA_PRESETS[presetKey];

    mapRef.current.flyTo({
      center: preset.center,
      zoom: preset.zoom,
      pitch: preset.pitch,
      bearing: preset.bearing,
      speed: MAP_CONFIG.animation.flyToSpeed,
      essential: true,
    });
  };

  // Layer Style Switcher
  const handleToggleLayer = (layer: 'outdoors' | 'satellite') => {
    if (!mapRef.current || layer === activeLayer) return;
    setActiveLayer(layer);
    const styleUrl = layer === 'satellite' ? MAP_CONFIG.satelliteStyle : MAP_CONFIG.outdoorsStyle;
    mapRef.current.setStyle(styleUrl);
  };

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/20 ${className}`}>
      {/* ── Top Left Controls: Near Me + Gem Counter ────────────────────────── */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFindNearMe}
          disabled={isLocating}
          className="gap-2 rounded-xl border border-border/80 bg-background/95 text-foreground shadow-md backdrop-blur-md active:scale-[0.98] transition-transform hover:bg-background"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#FF8500]" />
          ) : (
            <Navigation className="h-4 w-4 text-[#FF8500]" />
          )}
          <span className="text-xs font-semibold">Near Me</span>
        </Button>

        <div className="rounded-xl border border-border/80 bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-md">
          <span className="text-[#FF8500] font-bold">{places.length}</span> {places.length === 1 ? 'gem' : 'gems'} on map
        </div>
      </div>

      {/* ── Top Right Controls: Camera Presets & Layer Switcher ──────────────── */}
      <div className="absolute top-3 right-14 z-10 hidden sm:flex items-center gap-2">
        {/* Camera Views */}
        <div className="flex items-center rounded-xl border border-border/80 bg-background/95 p-1 shadow-md backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleCameraPreset('overview')}
            title="Full Flat Overview"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activePreset === 'overview'
                ? 'bg-[#FF8500] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Maximize2 className="h-3 w-3" />
            <span>Flat</span>
          </button>

          <button
            type="button"
            onClick={() => handleCameraPreset('cinematic')}
            title="3D Cinematic Slant"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activePreset === 'cinematic'
                ? 'bg-[#FF8500] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass className="h-3 w-3" />
            <span>3D Tilt</span>
          </button>

          <button
            type="button"
            onClick={() => handleCameraPreset('mountain')}
            title="High Himalayas Dramatic View"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activePreset === 'mountain'
                ? 'bg-[#FF8500] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mountain className="h-3 w-3" />
            <span>Himalayas</span>
          </button>
        </div>

        {/* Style Layer Toggle (Outdoors vs Satellite) */}
        <div className="flex items-center rounded-xl border border-border/80 bg-background/95 p-1 shadow-md backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleToggleLayer('outdoors')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeLayer === 'outdoors'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Terrain</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleLayer('satellite')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeLayer === 'satellite'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Satellite</span>
          </button>
        </div>
      </div>

      {/* ── Map Container ────────────────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* ── Instagram / Story Style Floating Place Card ──────────────────────── */}
      {activePlace && (
        <div className="absolute bottom-4 left-4 right-4 z-20 sm:left-auto sm:right-4 sm:w-[380px] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="relative flex gap-3.5 overflow-hidden rounded-2xl border border-border/80 bg-background/95 p-3.5 text-foreground shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur-xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => handleSelectPlace(null)}
              className="absolute right-2.5 top-2.5 z-10 rounded-full bg-muted/80 p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Thumbnail */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
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
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-extrabold text-[#FF8500] border border-[#FF8500]/40 backdrop-blur-xs">
                <Gem className="h-2.5 w-2.5" />
                <span>{activePlace.hidden_score.toFixed(1)}</span>
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
                    <span className="text-[10px] text-muted-foreground">• {activePlace.category.name}</span>
                  )}
                </div>
                <h4 className="line-clamp-1 text-sm font-bold text-foreground tracking-tight">
                  {activePlace.name}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 mt-2">
                <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>{activePlace.average_rating > 0 ? activePlace.average_rating.toFixed(1) : 'New'}</span>
                  <span className="text-[10px] text-muted-foreground">({activePlace.review_count})</span>
                </div>

                <Link
                  href={`/places/${activePlace.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF8500] hover:bg-[#e07500] px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(255,133,0,0.3)] active:scale-[0.98] transition-all"
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
