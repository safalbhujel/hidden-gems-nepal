'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Search,
  Navigation,
  Loader2,
  MapPin,
  AlertCircle,
  Compass,
  Mountain,
  Layers,
  Satellite,
  Maximize2,
  Gem,
  X,
  ChevronRight,
  Crosshair,
  Check,
} from 'lucide-react';
import {
  NEPAL_BOUNDS,
  NEPAL_CENTER,
  MAP_CONFIG,
  CAMERA_PRESETS,
  isWithinNepal,
  setupEnhancedMap,
} from '@/lib/constants/maps';
import {
  forwardGeocode,
  reverseGeocode,
  parseCoordinates,
  type GeocodingResult,
} from '@/lib/services/geocoding';
import { Button } from '@/components/ui/button';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationDetails {
  address: string;
  district?: string;
  placeName?: string;
}

interface LocationPickerMapProps {
  value?: Coordinates;
  onChange?: (coords: Coordinates) => void;
  onLocationDetails?: (details: LocationDetails) => void;
  className?: string;
}

const POPULAR_REGIONS = [
  { name: 'Pokhara', coordinates: [83.9856, 28.2096] as [number, number] },
  { name: 'Kathmandu', coordinates: [85.324, 27.7172] as [number, number] },
  { name: 'Mustang', coordinates: [83.8473, 28.7842] as [number, number] },
  { name: 'Nagarkot', coordinates: [85.5199, 27.7174] as [number, number] },
  { name: 'Chitwan', coordinates: [84.4298, 27.5291] as [number, number] },
  { name: 'Bandipur', coordinates: [84.417, 27.9333] as [number, number] },
  { name: 'Everest Region', coordinates: [86.7275, 27.8048] as [number, number] },
  { name: 'Ilam', coordinates: [87.9263, 26.9114] as [number, number] },
];

export function LocationPickerMap({
  value,
  onChange,
  onLocationDetails,
  className = 'h-[540px] sm:h-[600px] lg:h-[640px] w-full',
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Search dialogue container & input refs
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Callbacks in refs to avoid recreating map listeners
  const onChangeRef = useRef(onChange);
  const onLocationDetailsRef = useRef(onLocationDetails);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onLocationDetailsRef.current = onLocationDetails;
  }, [onLocationDetails]);

  // Search & Geolocation UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Map layer & camera state (matching ExploreMap)
  const [activePreset, setActivePreset] = useState<'overview' | 'cinematic' | 'mountain'>('overview');
  const [activeLayer, setActiveLayer] = useState<'outdoors' | 'satellite'>('satellite');

  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Instant coordinate detection from input (supports decimal degrees & DMS formats)
  const detectedCoords = useMemo(() => {
    return parseCoordinates(searchQuery);
  }, [searchQuery]);

  // Reverse geocodes the coordinates and informs parent form
  const handleReverseGeocode = useCallback(async (lng: number, lat: number) => {
    try {
      const result = await reverseGeocode(lng, lat);
      if (result) {
        setCurrentAddress(result.placeName);
        onLocationDetailsRef.current?.({
          address: result.placeName,
          district: result.district,
          placeName: result.text,
        });
      }
    } catch (e) {
      console.error('[LocationPicker] Reverse geocode error:', e);
    }
  }, []);

  // Update marker position and emit coordinates
  const setPosition = useCallback(
    (lng: number, lat: number, flyTo: boolean = false) => {
      const roundedLat = Number(lat.toFixed(6));
      const roundedLng = Number(lng.toFixed(6));

      if (markerRef.current) {
        markerRef.current.setLngLat([roundedLng, roundedLat]);
      }

      if (flyTo && mapRef.current) {
        mapRef.current.flyTo({
          center: [roundedLng, roundedLat],
          zoom: Math.max(mapRef.current.getZoom(), 14),
          pitch: 45,
          duration: 1200,
          essential: true,
        });
      }

      onChangeRef.current?.({ lat: roundedLat, lng: roundedLng });
      handleReverseGeocode(roundedLng, roundedLat);
    },
    [handleReverseGeocode]
  );

  // Pin directly from detected coordinates
  const handlePinDetectedCoords = useCallback(
    (coords: { lat: number; lng: number }) => {
      if (!isWithinNepal(coords.lng, coords.lat)) {
        setLocationStatus(
          `Coordinates (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E) appear to be outside Nepal's geographic border.`
        );
      } else {
        setLocationStatus(null);
      }

      setPosition(coords.lng, coords.lat, true);
      setSearchQuery(`${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E`);
      setIsSearchOpen(false);
    },
    [setPosition]
  );

  // Initialize Mapbox instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const initialLng = initialValueRef.current?.lng ?? NEPAL_CENTER[0];
    const initialLat = initialValueRef.current?.lat ?? NEPAL_CENTER[1];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.style,
      center: [initialLng, initialLat],
      zoom: initialValueRef.current ? 14 : MAP_CONFIG.defaultZoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      maxBounds: NEPAL_BOUNDS,
      pitch: 45,
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

      // Custom glowing marker matching ExploreMap's authentic jewel pin design
      const el = document.createElement('div');
      el.className = 'custom-gem-pin cursor-grab active:cursor-grabbing group';
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 9999px;
            background: rgba(255, 133, 0, 0.45);
            animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>

          <div style="
            position: relative;
            display: flex;
            align-items: center;
            gap: 5px;
            background: linear-gradient(135deg, #FF8500 0%, #E65100 100%);
            color: #FFFFFF;
            padding: 5px 11px;
            border-radius: 9999px;
            font-family: inherit;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 0.02em;
            box-shadow: 0 6px 22px rgba(255, 133, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            transition: all 0.2s ease;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
              <path d="M6 3h12l4 6-10 13L2 9z"/>
            </svg>
            <span style="text-shadow: 0 1px 2px rgba(0,0,0,0.4);">New Gem</span>
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid #E65100;
            "></div>
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true,
        anchor: 'bottom',
      })
        .setLngLat([initialLng, initialLat])
        .addTo(map);

      markerRef.current = marker;

      // Pin drag release
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setPosition(lngLat.lng, lngLat.lat, false);
      });

      // Tap or click on map to reposition pin
      map.on('click', (e) => {
        const target = e.originalEvent.target as HTMLElement | null;
        if (target && !target.closest('.custom-gem-pin')) {
          setPosition(e.lngLat.lng, e.lngLat.lat, false);
          setIsSearchOpen(false);
        }
      });

      // Initial reverse geocode if value was provided
      if (initialValueRef.current) {
        handleReverseGeocode(initialLng, initialLat);
      }
    });

    return () => {
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [setPosition, handleReverseGeocode]);

  // Sync external value changes
  useEffect(() => {
    if (!markerRef.current || !value) return;

    const currentPos = markerRef.current.getLngLat();
    const diff = Math.abs(currentPos.lng - value.lng) + Math.abs(currentPos.lat - value.lat);

    if (diff > 0.0001) {
      markerRef.current.setLngLat([value.lng, value.lat]);
      mapRef.current?.easeTo({
        center: [value.lng, value.lat],
        duration: 800,
      });
      handleReverseGeocode(value.lng, value.lat);
    }
  }, [value, handleReverseGeocode]);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select a searched place
  const handleSelectSearchResult = useCallback(
    (result: GeocodingResult) => {
      const [lng, lat] = result.coordinates;
      setPosition(lng, lat, true);
      setSearchQuery(result.text);
      setCurrentAddress(result.placeName);
      setIsSearchOpen(false);
    },
    [setPosition]
  );

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / '/' to focus search, arrows to navigate)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
        return;
      }

      if (!isSearchOpen) return;

      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
        return;
      }

      // If exact coordinates detected and Enter is pressed, pin immediately
      if (e.key === 'Enter' && detectedCoords) {
        e.preventDefault();
        handlePinDetectedCoords(detectedCoords);
        return;
      }

      if (searchResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % searchResults.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (searchResults[highlightedIndex]) {
            handleSelectSearchResult(searchResults[highlightedIndex]);
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSearchOpen,
    searchResults,
    highlightedIndex,
    handleSelectSearchResult,
    detectedCoords,
    handlePinDetectedCoords,
  ]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setHighlightedIndex(0);
    if (!val.trim() || val.length < 2 || parseCoordinates(val)) {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Forward geocoding search handler with debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2 || parseCoordinates(trimmed)) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await forwardGeocode(trimmed, 7);
      setSearchResults(results);
      setIsSearching(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select popular region chip
  const handleSelectPopularRegion = (region: (typeof POPULAR_REGIONS)[number]) => {
    const [lng, lat] = region.coordinates;
    setPosition(lng, lat, true);
    setSearchQuery(region.name);
    setIsSearchOpen(false);
  };

  // "Use Current Location" handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setIsLocating(false);

        if (!isWithinNepal(longitude, latitude)) {
          setLocationStatus('Your current GPS location appears to be outside Nepal.');
          return;
        }

        setPosition(longitude, latitude, true);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('Location permission denied. Please allow location access in your browser.');
        } else {
          setLocationStatus('Unable to retrieve your location. Please drop the pin manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Camera Presets Controller (matching ExploreMap)
  const handleCameraPreset = (presetKey: 'overview' | 'cinematic' | 'mountain') => {
    if (!mapRef.current) return;
    setActivePreset(presetKey);
    const preset = CAMERA_PRESETS[presetKey];

    if (presetKey === 'mountain') {
      mapRef.current.flyTo({
        center: preset.center,
        zoom: preset.zoom,
        pitch: preset.pitch,
        bearing: preset.bearing,
        speed: MAP_CONFIG.animation.flyToSpeed,
        essential: true,
      });
    } else {
      // If pin is dropped, focus on the pin with the chosen pitch and bearing
      const pinPos = markerRef.current?.getLngLat();
      const hasCustomPin =
        pinPos && (pinPos.lng !== NEPAL_CENTER[0] || pinPos.lat !== NEPAL_CENTER[1]);

      const targetCenter = hasCustomPin ? ([pinPos.lng, pinPos.lat] as [number, number]) : preset.center;
      const targetZoom = hasCustomPin ? Math.max(mapRef.current.getZoom(), 13) : preset.zoom;

      mapRef.current.flyTo({
        center: targetCenter,
        zoom: targetZoom,
        pitch: preset.pitch,
        bearing: preset.bearing,
        speed: MAP_CONFIG.animation.flyToSpeed,
        essential: true,
      });
    }
  };

  // Layer Style Switcher (Terrain vs Satellite)
  const handleToggleLayer = (layer: 'outdoors' | 'satellite') => {
    if (!mapRef.current || layer === activeLayer) return;
    setActiveLayer(layer);
    const styleUrl = layer === 'satellite' ? MAP_CONFIG.satelliteStyle : MAP_CONFIG.outdoorsStyle;
    mapRef.current.setStyle(styleUrl);
  };

  // Copy coordinates helper
  const handleCopyCoordinates = () => {
    if (!value) return;
    const text = `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-md ${className}`}
    >
      {/* ── Floating Map Top Controls Overlay (Z-Index 30) ────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-3.5 z-30 px-3.5 sm:px-4 flex flex-col gap-2.5">
        {/* Row 1: Expansive Full-Width Search Dialogue Bar */}
        <div className="flex items-center justify-between gap-3">
          {/* Spacious Search Dialogue Box: expands generously */}
          <div
            ref={searchContainerRef}
            className="pointer-events-auto relative flex-1 max-w-full lg:max-w-2xl xl:max-w-3xl"
          >
            {/* Search Trigger Bar */}
              <div
                className={`group relative flex items-center h-11 w-full rounded-2xl border transition-all duration-200 bg-background/95 dark:bg-background/90 backdrop-blur-xl shadow-[0_8px_25px_rgba(0,0,0,0.08)] ${
                  isSearchOpen
                    ? 'border-[#FF8500] ring-2 ring-[#FF8500]/25'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div className="pl-3.5 pr-2 text-muted-foreground group-focus-within:text-[#FF8500] transition-colors">
                  <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
                </div>

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    handleSearchChange(e.target.value);
                    if (!isSearchOpen) setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search landmark, district, or paste coordinates (e.g. 26.8680° N, 87.3234° E)..."
                  className="w-full bg-transparent pr-2 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />

                {isSearching ? (
                  <div className="mr-3 text-[#FF8500]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
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

              {/* ── Search Dropdown Panel (Z-Index 50) ────────────────────────── */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-border/80 bg-background/98 dark:bg-background/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] animate-in fade-in-0 zoom-in-95 duration-150">
                  {/* Exact GPS Coordinate Detection Highlight Card */}
                  {detectedCoords && (
                    <div className="p-3 border-b border-[#FF8500]/30 bg-[#FF8500]/10">
                      <button
                        type="button"
                        onClick={() => handlePinDetectedCoords(detectedCoords)}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-background/95 hover:bg-background border border-[#FF8500]/30 transition-all text-left group cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF8500] text-white shadow-xs">
                            <Crosshair className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-foreground">
                                Exact Coordinates Detected
                              </span>
                              <span className="rounded-md bg-[#FF8500]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#FF8500]">
                                Direct Pin
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {detectedCoords.lat.toFixed(5)}° N, {detectedCoords.lng.toFixed(5)}° E
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-[#FF8500] shrink-0">
                          <span>Pin Here</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    </div>
                  )}

                  {!searchQuery.trim() ? (
                    /* Curated Quick Region Pills when search input is empty */
                    <div className="p-4 space-y-3.5">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Popular Regions in Nepal</span>
                        <span className="text-[10px] font-normal lowercase">tap to fly & pin</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_REGIONS.map((region) => (
                          <button
                            key={region.name}
                            type="button"
                            onClick={() => handleSelectPopularRegion(region)}
                            className="rounded-full border border-border/80 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors"
                          >
                            {region.name}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground">
                        Type any mountain, lake, river, village, or paste exact coordinates (e.g. 26.8680° N, 87.3234° E or 26°52′05″N, 87°19′24″E).
                      </div>
                    </div>
                  ) : !detectedCoords ? (
                    /* Search Results List */
                    <div className="max-h-[320px] flex flex-col">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 text-[11px] font-semibold text-muted-foreground bg-muted/20">
                        <span>
                          {searchResults.length === 0
                            ? isSearching
                              ? 'Searching places in Nepal...'
                              : 'No places found'
                            : `Found ${searchResults.length} ${
                                searchResults.length === 1 ? 'place' : 'places'
                              }`}
                        </span>
                      </div>

                      {searchResults.length === 0 && !isSearching ? (
                        <div className="py-8 px-4 text-center">
                          <Compass className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1.5} />
                          <p className="text-xs font-bold text-foreground">
                            No locations match &ldquo;{searchQuery}&rdquo;
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                            Try searching by nearby district (e.g. Kaski, Mustang, Chitwan) or paste exact coordinates.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-y-auto divide-y divide-border/40 py-1">
                          {searchResults.map((result, idx) => (
                            <button
                              key={result.id}
                              type="button"
                              onClick={() => handleSelectSearchResult(result)}
                              className={`group w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                                highlightedIndex === idx
                                  ? 'bg-muted text-foreground'
                                  : 'hover:bg-muted/60 text-foreground/90'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <div className="truncate">
                                  <p className="truncate text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                    {result.text}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                                    {result.placeName}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {result.district && (
                                  <span className="hidden sm:inline rounded-md border border-border/80 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                    {result.district}
                                  </span>
                                )}
                                <div className="rounded-lg p-1 text-muted-foreground group-hover:text-primary transition-colors">
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
                        <span>↑↓ to navigate · Enter to pin · Esc to close</span>
                        <span className="font-medium text-primary">Mapbox Geocoding</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
          </div>

          {/* Desktop Right Controls: Camera Views & Layer Switcher (Visible on lg+) */}
          <div className="pointer-events-auto hidden lg:flex items-center gap-2.5 shrink-0 pr-12">
            {/* Camera Views */}
            <div className="flex items-center h-11 rounded-2xl border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur-xl">
              <button
                type="button"
                onClick={() => handleCameraPreset('overview')}
                title="Full 2D Flat Overview of Nepal"
                className={`flex items-center gap-1.5 rounded-xl h-9 px-3 text-xs font-semibold transition-all ${
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
                className={`flex items-center gap-1.5 rounded-xl h-9 px-3 text-xs font-semibold transition-all ${
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
                className={`flex items-center gap-1.5 rounded-xl h-9 px-3 text-xs font-semibold transition-all ${
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
            <div className="flex items-center h-11 rounded-2xl border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur-xl">
              <button
                type="button"
                onClick={() => handleToggleLayer('outdoors')}
                title="Topographic Terrain with 3D Elevation"
                className={`flex items-center gap-1.5 rounded-xl h-9 px-3 text-xs font-semibold transition-all ${
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
                className={`flex items-center gap-1.5 rounded-xl h-9 px-3 text-xs font-semibold transition-all ${
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
        <div className="pointer-events-auto flex lg:hidden items-center justify-between gap-2 overflow-x-auto py-0.5 no-scrollbar pr-12">
          {/* Mobile Camera Presets */}
          <div className="flex items-center h-10 rounded-xl border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur-xl shrink-0">
            <button
              type="button"
              onClick={() => handleCameraPreset('overview')}
              className={`flex items-center gap-1 rounded-lg h-8 px-2.5 text-[11px] font-semibold transition-all ${
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
              className={`flex items-center gap-1 rounded-lg h-8 px-2.5 text-[11px] font-semibold transition-all ${
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
              className={`flex items-center gap-1 rounded-lg h-8 px-2.5 text-[11px] font-semibold transition-all ${
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
          <div className="flex items-center h-10 rounded-xl border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur-xl shrink-0">
            <button
              type="button"
              onClick={() => handleToggleLayer('outdoors')}
              className={`flex items-center gap-1 rounded-lg h-8 px-2.5 text-[11px] font-semibold transition-all ${
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
              className={`flex items-center gap-1 rounded-lg h-8 px-2.5 text-[11px] font-semibold transition-all ${
                activeLayer === 'satellite'
                  ? 'bg-foreground text-background shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Satellite className="h-3 w-3" />
              <span>Satellite</span>
            </button>
          </div>

          {/* Mobile Pin status pill */}
          <div className="flex sm:hidden items-center shrink-0 h-10 px-2.5 rounded-xl border border-border/80 bg-background/95 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-[#FF8500] mr-1.5 animate-pulse" />
            <span className="text-muted-foreground text-[10px]">Pin Set</span>
          </div>
        </div>
      </div>

      {/* ── Map Container ──────────────────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* ── Status Alert Message if any ────────────────────────────────────────── */}
      {locationStatus && (
        <div className="absolute top-28 left-3.5 right-3.5 z-30 flex items-center justify-between gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/95 px-4 py-3 text-xs text-destructive-foreground shadow-lg backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{locationStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocationStatus(null)}
            className="rounded p-0.5 hover:bg-black/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Bottom Floating Bar: Active Coordinates & Address ──────────────────── */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 dark:bg-background/90 p-3 sm:px-4 text-xs text-foreground shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF8500]/15 text-[#FF8500] border border-[#FF8500]/30 shadow-xs">
            <Gem className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="line-clamp-1 font-bold text-foreground text-xs sm:text-sm">
              {currentAddress || 'Drop the pin on the exact location in Nepal'}
            </p>
            {value && (
              <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                <span className="text-foreground/80 font-semibold">GPS:</span>
                <span>
                  {value.lat.toFixed(5)}° N, {value.lng.toFixed(5)}° E
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Near Me GPS Action */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="h-8 sm:h-9 px-3 rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground text-xs font-semibold gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF8500]" />
            ) : (
              <Navigation className="h-3.5 w-3.5 text-[#FF8500]" />
            )}
            <span>Near Me</span>
          </Button>

          {value && (
            <button
              type="button"
              onClick={handleCopyCoordinates}
              className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/60 hover:bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground/80 transition-colors cursor-pointer"
              title="Copy GPS coordinates"
            >
              {copiedCoords ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 font-bold">Copied</span>
                </>
              ) : (
                <span>Copy GPS</span>
              )}
            </button>
          )}

          <span className="hidden md:inline rounded-xl bg-muted/50 border border-border/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            Drag pin or click map to adjust
          </span>
        </div>
      </div>
    </div>
  );
}
