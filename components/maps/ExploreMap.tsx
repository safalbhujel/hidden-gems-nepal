'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  Satellite,
  Maximize2,
  Gem,
  Search,
  MapPin,
  ChevronRight,
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
import { CategoryIcon } from '@/components/icons/CategoryIcon';

interface ExploreMapProps {
  places: PlaceMapPin[];
  className?: string;
  selectedPlaceSlug?: string;
  onSelectPlace?: (place: PlaceMapPin | null) => void;
}

const QUICK_FILTERS = [
  { label: 'Waterfalls', query: 'waterfall' },
  { label: 'Viewpoints', query: 'viewpoint' },
  { label: 'Pokhara', query: 'kaski' },
  { label: 'Mustang', query: 'mustang' },
  { label: 'Kathmandu', query: 'kathmandu' },
  { label: 'Everest Region', query: 'solukhumbu' },
];

export function ExploreMap({
  places,
  className = 'h-[620px] w-full',
  selectedPlaceSlug,
  onSelectPlace,
}: ExploreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // Search dialogue state & refs
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const [clickedPlace, setClickedPlace] = useState<PlaceMapPin | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activePreset, setActivePreset] = useState<'overview' | 'cinematic' | 'mountain'>('overview');
  const [activeLayer, setActiveLayer] = useState<'outdoors' | 'satellite'>('satellite');

  const activePlace = selectedPlaceSlug
    ? places.find((p) => p.slug === selectedPlaceSlug) ?? clickedPlace
    : clickedPlace;

  // Filtered places matching the search query
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return places.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchDistrict = p.district?.name.toLowerCase().includes(q);
      const matchCategory = p.category?.name.toLowerCase().includes(q);
      return matchName || matchDistrict || matchCategory;
    });
  }, [places, searchQuery]);

  // Top 3 rated places for quick discovery when search is empty
  const topRatedPlaces = useMemo(() => {
    return [...places]
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 3);
  }, [places]);

  // Fly to external selected place if changed via prop
  useEffect(() => {
    if (selectedPlaceSlug) {
      const target = places.find((p) => p.slug === selectedPlaceSlug);
      if (target) {
        mapRef.current?.flyTo({
          center: [target.longitude, target.latitude],
          zoom: 14,
          pitch: 45,
          duration: 1200,
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

  // Smooth cinematic flight to a selected gem
  const handleFlyToPlace = useCallback(
    (place: PlaceMapPin) => {
      setIsSearchOpen(false);
      setSearchQuery(place.name);
      handleSelectPlace(place);

      mapRef.current?.flyTo({
        center: [place.longitude, place.latitude],
        zoom: 14.5,
        pitch: 50,
        bearing: -15,
        speed: 1.25,
        curve: 1.4,
        essential: true,
      });
    },
    [handleSelectPlace]
  );

  // Zoom map to fit all matching places from search query
  const handleFitAllMatches = useCallback(() => {
    if (!mapRef.current || filteredPlaces.length === 0) return;
    setIsSearchOpen(false);

    if (filteredPlaces.length === 1) {
      handleFlyToPlace(filteredPlaces[0]);
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    filteredPlaces.forEach((p) => bounds.extend([p.longitude, p.latitude]));
    mapRef.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 120, left: 60, right: 60 },
      maxZoom: 13,
      duration: 1200,
    });
  }, [filteredPlaces, handleFlyToPlace]);

  // Click outside listener to dismiss search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / '/' to focus search, arrows to navigate)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Focus search shortcut
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
        return;
      }

      if (!isSearchOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
        return;
      }

      const currentList = searchQuery.trim() ? filteredPlaces : topRatedPlaces;

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % Math.max(1, currentList.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev <= 0 ? currentList.length - 1 : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentList[highlightedIndex]) {
          handleFlyToPlace(currentList[highlightedIndex]);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, searchQuery, filteredPlaces, topRatedPlaces, highlightedIndex, handleFlyToPlace]);

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

    // Close preview card and search dropdown when clicking map canvas
    map.on('click', (e) => {
      const target = e.originalEvent.target as HTMLElement | null;
      if (target && !target.closest('.custom-marker-node')) {
        handleSelectPlace(null);
        setIsSearchOpen(false);
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

      const el = document.createElement('div');
      el.className =
        'custom-marker-node cursor-pointer group transition-transform duration-300 hover:scale-120 active:scale-[0.98]';
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 9999px;
            background: rgba(255, 133, 0, 0.35);
            animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>

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

    // Auto-fit if places exist and no single search item is pinned
    if (places.length > 1 && map && !selectedPlaceSlug) {
      const bounds = new mapboxgl.LngLatBounds();
      places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 1000 });
    }
  }, [places, handleSelectPlace, selectedPlaceSlug]);

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
      {/* ── Floating Map Top Controls Overlay (Z-Index 30) ────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-30 px-3 sm:px-4 flex flex-col gap-2">
        {/* Row 1: Search Dialogue Bar + Quick Actions (Desktop & Mobile) */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Place Search Bar + Near Me + Gem Count */}
          <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md lg:max-w-lg">
            {/* Search Dialogue Box */}
            <div ref={searchContainerRef} className="pointer-events-auto relative flex-1">
              {/* Search Trigger Bar */}
              <div
                className={`group relative flex items-center h-10 w-full rounded-2xl border transition-all duration-200 bg-background/95 dark:bg-background/90 backdrop-blur-xl shadow-[0_8px_25px_rgba(0,0,0,0.10)] ${
                  isSearchOpen
                    ? 'border-[#FF8500] ring-2 ring-[#FF8500]/25'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div className="pl-3.5 pr-1.5 text-muted-foreground group-focus-within:text-[#FF8500] transition-colors">
                  <Search className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                </div>

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                    if (!isSearchOpen) setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search gems, districts, or vibes..."
                  className="w-full bg-transparent pr-2 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />

                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setHighlightedIndex(0);
                      searchInputRef.current?.focus();
                    }}
                    className="mr-2.5 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Clear query"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="mr-3 hidden sm:flex items-center gap-1">
                    <kbd className="rounded-md border border-border/70 bg-muted/70 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      ⌘K
                    </kbd>
                  </div>
                )}
              </div>

              {/* ── Floating Search Dialogue Panel ───────────────────────────── */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-border/80 bg-background/98 dark:bg-background/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] animate-in fade-in-0 zoom-in-95 duration-150">
                  {/* Quick Query Pills when search input is empty */}
                  {!searchQuery.trim() ? (
                    <div className="p-3.5 space-y-3.5">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Curated Discovery</span>
                        <span className="text-[10px] font-normal lowercase">{places.length} gems mapped</span>
                      </div>

                      {/* Filter chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_FILTERS.map((filter) => (
                          <button
                            key={filter.label}
                            type="button"
                            onClick={() => {
                              setSearchQuery(filter.query);
                              setHighlightedIndex(0);
                            }}
                            className="rounded-full border border-border/80 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary px-3 py-1 text-xs font-semibold text-foreground/80 transition-colors"
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>

                      {/* Highest Rated Highlights */}
                      {topRatedPlaces.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/60">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Top Rated Across Nepal
                          </p>
                          <div className="space-y-1">
                            {topRatedPlaces.map((place, idx) => (
                              <div
                                key={place.id}
                                onClick={() => handleFlyToPlace(place)}
                                className={`flex items-center justify-between gap-2.5 rounded-xl p-2 cursor-pointer transition-colors ${
                                  highlightedIndex === idx
                                    ? 'bg-muted text-foreground'
                                    : 'hover:bg-muted/60 text-foreground/90'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/60">
                                    {place.cover_image_url ? (
                                      <Image
                                        src={place.cover_image_url}
                                        alt={place.name}
                                        fill
                                        className="object-cover"
                                        sizes="36px"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-primary">
                                        <CategoryIcon slug={place.category?.slug} name={place.category?.name} className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="truncate">
                                    <p className="truncate text-xs font-bold">{place.name}</p>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                      <span>{place.district?.name}</span>
                                      {place.category && <span>· {place.category.name}</span>}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 shrink-0">
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  <span>{place.average_rating > 0 ? place.average_rating.toFixed(1) : 'New'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Results List when query is active */
                    <div className="max-h-[320px] flex flex-col">
                      {/* Results Header */}
                      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60 text-[11px] font-semibold text-muted-foreground bg-muted/20">
                        <span>
                          {filteredPlaces.length === 0
                            ? 'No matches found'
                            : `Found ${filteredPlaces.length} ${
                                filteredPlaces.length === 1 ? 'gem' : 'gems'
                              }`}
                        </span>

                        {filteredPlaces.length > 1 && (
                          <button
                            type="button"
                            onClick={handleFitAllMatches}
                            className="text-[11px] font-bold text-primary hover:underline"
                          >
                            Fit all on map
                          </button>
                        )}
                      </div>

                      {filteredPlaces.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <Compass className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1.5} />
                          <p className="text-xs font-bold text-foreground">
                            No places match &ldquo;{searchQuery}&rdquo;
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                            Try searching by district name (e.g. Kaski, Mustang, Ilam) or category (e.g. Waterfall, Trail).
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-y-auto divide-y divide-border/40 py-1">
                          {filteredPlaces.map((place, idx) => (
                            <div
                              key={place.id}
                              onClick={() => handleFlyToPlace(place)}
                              className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                                highlightedIndex === idx
                                  ? 'bg-muted text-foreground'
                                  : 'hover:bg-muted/60 text-foreground/90'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Thumbnail + Score */}
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
                                  {place.cover_image_url ? (
                                    <Image
                                      src={place.cover_image_url}
                                      alt={place.name}
                                      fill
                                      className="object-cover"
                                      sizes="44px"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-primary">
                                      <CategoryIcon slug={place.category?.slug} name={place.category?.name} className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-sm bg-black/80 px-1 text-[9px] font-bold text-[#FF8500]">
                                    <Gem className="h-2 w-2" />
                                    <span>{place.hidden_score.toFixed(1)}</span>
                                  </div>
                                </div>

                                {/* Place Details */}
                                <div className="truncate">
                                  <p className="truncate text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                    {place.name}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                                      <span className="font-medium text-foreground/80">{place.district?.name}</span>
                                    </span>
                                    {place.category && (
                                      <>
                                        <span>·</span>
                                        <span>{place.category.name}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Fly to indicator */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  <span>{place.average_rating > 0 ? place.average_rating.toFixed(1) : 'New'}</span>
                                </div>

                                <div className="rounded-lg p-1 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dialogue Footer */}
                  <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-3.5 py-1.5 text-[10px] text-muted-foreground">
                    <span className="hidden sm:inline">↑↓ to navigate · Enter to fly to · Esc to close</span>
                    <span className="sm:hidden">Tap to fly to coordinates</span>
                    <span className="font-medium text-primary">Live PostGIS</span>
                  </div>
                </div>
              )}
            </div>

            {/* Near Me Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFindNearMe}
              disabled={isLocating}
              className="pointer-events-auto shrink-0 h-10 px-3 rounded-2xl border border-border/80 bg-background/95 hover:bg-background text-foreground shadow-sm backdrop-blur-xl transition-all active:scale-[0.98]"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#FF8500]" />
              ) : (
                <Navigation className="h-4 w-4 text-[#FF8500]" />
              )}
              <span className="hidden sm:inline text-xs font-semibold">Near Me</span>
            </Button>

            {/* Gem Count Pill (Desktop) */}
            <div className="pointer-events-auto hidden sm:flex items-center shrink-0 h-10 px-3 rounded-2xl border border-border/80 bg-background/95 text-xs font-semibold text-foreground shadow-sm backdrop-blur-xl">
              <span className="text-[#FF8500] font-bold mr-1">{places.length}</span> {places.length === 1 ? 'gem' : 'gems'}
            </div>
          </div>

          {/* Desktop Right Controls: Camera Views & Layer Switcher (Visible on lg+) */}
          <div className="pointer-events-auto hidden lg:flex items-center gap-2 shrink-0 pr-12">
            {/* Camera Views */}
            <div className="flex items-center rounded-2xl border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur-xl">
              <button
                type="button"
                onClick={() => handleCameraPreset('overview')}
                title="Full 2D Flat Overview of Nepal"
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                  activePreset === 'overview'
                    ? 'bg-[#FF8500] text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Flat</span>
              </button>

              <button
                type="button"
                onClick={() => handleCameraPreset('cinematic')}
                title="3D Cinematic Slanted Perspective"
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                  activePreset === 'cinematic'
                    ? 'bg-[#FF8500] text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>3D Tilt</span>
              </button>

              <button
                type="button"
                onClick={() => handleCameraPreset('mountain')}
                title="High Himalayas Dramatic View"
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                  activePreset === 'mountain'
                    ? 'bg-[#FF8500] text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mountain className="h-3.5 w-3.5" />
                <span>Himalayas</span>
              </button>
            </div>

            {/* Style Layer Toggle (Terrain vs Satellite) */}
            <div className="flex items-center rounded-2xl border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur-xl">
              <button
                type="button"
                onClick={() => handleToggleLayer('outdoors')}
                title="Topographic Terrain with 3D Elevation"
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                  activeLayer === 'outdoors'
                    ? 'bg-foreground text-background shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Terrain</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleLayer('satellite')}
                title="Photorealistic Satellite Imagery"
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                  activeLayer === 'satellite'
                    ? 'bg-foreground text-background shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Satellite className="h-3.5 w-3.5" />
                <span>Satellite</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Always-Visible Map View & Layer Options on Mobile & Tablet (< lg) */}
        <div className="pointer-events-auto flex lg:hidden items-center justify-between gap-1.5 overflow-x-auto py-0.5 no-scrollbar pr-12">
          {/* Mobile Camera Presets */}
          <div className="flex items-center rounded-xl border border-border/80 bg-background/95 p-0.5 shadow-sm backdrop-blur-xl shrink-0">
            <button
              type="button"
              onClick={() => handleCameraPreset('overview')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
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
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
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
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                activePreset === 'mountain'
                  ? 'bg-[#FF8500] text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mountain className="h-3 w-3" />
              <span>Himalayas</span>
            </button>
          </div>

          {/* Mobile Layer Switcher */}
          <div className="flex items-center rounded-xl border border-border/80 bg-background/95 p-0.5 shadow-sm backdrop-blur-xl shrink-0">
            <button
              type="button"
              onClick={() => handleToggleLayer('outdoors')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                activeLayer === 'outdoors'
                  ? 'bg-foreground text-background shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Terrain</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLayer('satellite')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                activeLayer === 'satellite'
                  ? 'bg-foreground text-background shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Satellite className="h-3 w-3" />
              <span>Satellite</span>
            </button>
          </div>

          {/* Mobile Gem count (if sm hidden) */}
          <div className="flex sm:hidden items-center shrink-0 px-2 py-1 rounded-xl border border-border/80 bg-background/95 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-xl">
            <span className="text-[#FF8500] font-bold mr-0.5">{places.length}</span>
            <span className="text-muted-foreground">gems</span>
          </div>
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
