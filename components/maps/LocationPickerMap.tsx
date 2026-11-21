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
  Mountain,
  Globe,
  Map,
  X,
  ChevronRight,
  Crosshair,
  Check,
  Copy,
  Plus,
  Minus,
  Trash2,
  Edit3,
} from 'lucide-react';
import {
  NEPAL_BOUNDS,
  MAP_CONFIG,
  isWithinNepal,
  setupEnhancedMap,
} from '@/lib/constants/maps';
import {
  forwardGeocode,
  reverseGeocode,
  parseCoordinates,
  type GeocodingResult,
} from '@/lib/services/geocoding';

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
  { name: 'Kathmandu', coordinates: [85.32486, 27.712728] as [number, number] },
  { name: 'Pokhara', coordinates: [83.9856, 28.2096] as [number, number] },
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
  className = '',
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

  // Search UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Map layer state: 'dark' (Map) | 'satellite' | 'outdoors' (Terrain)
  const [activeLayer, setActiveLayer] = useState<'outdoors' | 'satellite' | 'dark'>('dark');

  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('Kathmandu, Bagmati Province, Nepal');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

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

    // Kathmandu coordinates matching design reference
    const initialLng = initialValueRef.current?.lng ?? 85.32486;
    const initialLat = initialValueRef.current?.lat ?? 27.712728;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.darkStyle || 'mapbox://styles/mapbox/dark-v11',
      center: [initialLng, initialLat],
      zoom: initialValueRef.current ? 13.5 : 12,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      maxBounds: NEPAL_BOUNDS,
      pitch: 45,
      bearing: MAP_CONFIG.camera.bearing,
      attributionControl: false,
    });

    map.on('style.load', () => {
      setupEnhancedMap(map);
    });

    map.on('load', () => {
      mapRef.current = map;

      // Custom glowing marker matching the design reference
      const el = document.createElement('div');
      el.className = 'custom-gem-pin cursor-grab active:cursor-grabbing group';
      el.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-50%);">
          <!-- Animated glowing pulse ring -->
          <div style="
            position: absolute;
            top: 2px;
            width: 44px;
            height: 44px;
            border-radius: 9999px;
            background: rgba(255, 122, 0, 0.45);
            animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>

          <!-- Main orange pill badge with glowing aura -->
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, #FF7A00 0%, #FF9E00 100%);
            color: #FFFFFF;
            padding: 6px 14px;
            border-radius: 9999px;
            font-family: inherit;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 0.02em;
            box-shadow: 0 8px 24px rgba(255, 122, 0, 0.65), 0 2px 6px rgba(0, 0, 0, 0.5);
            border: 1.5px solid rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(8px);
            transition: transform 0.15s ease;
          ">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M6 3h12l4 6-10 13L2 9z"/>
            </svg>
            <span style="text-shadow: 0 1px 2px rgba(0,0,0,0.3);">New Gem</span>
          </div>

          <!-- Downward pointer tip -->
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid #FF7A00;
            margin-top: -1px;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
          "></div>

          <!-- Ground target dot -->
          <div style="
            width: 7px;
            height: 7px;
            border-radius: 9999px;
            background: #FF7A00;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 8px #FF7A00;
            margin-top: 1px;
          "></div>
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
      } else {
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

  // "My Location" handler
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

  // Layer Style Switcher ('outdoors' | 'satellite' | 'dark')
  const handleToggleLayer = (layer: 'outdoors' | 'satellite' | 'dark') => {
    if (!mapRef.current || layer === activeLayer) return;
    setActiveLayer(layer);
    let styleUrl: string = MAP_CONFIG.darkStyle || 'mapbox://styles/mapbox/dark-v11';
    if (layer === 'outdoors') styleUrl = MAP_CONFIG.outdoorsStyle;
    if (layer === 'satellite') styleUrl = MAP_CONFIG.satelliteStyle;
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

  // Confirm location handler
  const handleConfirmLocation = () => {
    setIsConfirmed(true);
    setTimeout(() => setIsConfirmed(false), 2500);

    if (value) {
      handleReverseGeocode(value.lng, value.lat);
    }
  };

  // Clear pin handler (resets to default Kathmandu coordinates)
  const handleClearPin = () => {
    const defaultLng = 85.32486;
    const defaultLat = 27.712728;
    setPosition(defaultLng, defaultLat, true);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Adjust pin handler (smoothly flies in and focuses onto current pin)
  const handleAdjustPin = () => {
    if (!value || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [value.lng, value.lat],
      zoom: 15,
      pitch: 45,
      duration: 1000,
      essential: true,
    });
  };

  return (
    <div
      className={`relative flex flex-col rounded-3xl border border-zinc-800/80 bg-[#121316] p-4 sm:p-5 shadow-2xl space-y-3.5 text-white ${className}`}
    >
      {/* ── 1. Card Header: Title, Subtitle & GPS Pill with Copy ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-0.5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF8500] text-white shadow-md shadow-[#FF8500]/30 mt-0.5">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>2. Pin the Exact Location</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
              Search landmark, paste exact coordinates (e.g. 26.8680° N, 87.3234° E), or drag the pin directly onto the spot.
            </p>
          </div>
        </div>

        {/* Top-Right Coordinate Pill Badge with Copy Button */}
        {value && (
          <div className="flex items-center gap-2 rounded-full border border-zinc-700/70 bg-zinc-800/80 px-3 py-1.5 text-xs font-mono text-zinc-200 shadow-sm self-start sm:self-auto shrink-0">
            <span>
              {value.lat.toFixed(6)}° N, {value.lng.toFixed(6)}° E
            </span>
            <button
              type="button"
              onClick={handleCopyCoordinates}
              title="Copy Coordinates"
              className="p-0.5 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {copiedCoords ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Interactive Map Container ───────────────────────────────── */}
      <div className="relative h-[440px] sm:h-[480px] lg:h-[520px] w-full rounded-2xl overflow-hidden border border-zinc-800/90 shadow-inner">
        {/* ── Floating Search Bar Overlay ── */}
        <div className="pointer-events-none absolute inset-x-0 top-3.5 z-30 px-3.5">
          <div className="flex items-center">
            <div
              ref={searchContainerRef}
              className="pointer-events-auto relative w-full mr-14 sm:mr-16"
            >
              <div
                className={`group relative flex items-center h-11 w-full rounded-full border transition-all duration-200 bg-zinc-950/85 backdrop-blur-xl shadow-lg ${
                  isSearchOpen
                    ? 'border-[#FF8500] ring-2 ring-[#FF8500]/25'
                    : 'border-zinc-700/70 hover:border-zinc-600'
                }`}
              >
                <div className="pl-4 pr-2 text-zinc-400 group-focus-within:text-[#FF8500] transition-colors">
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
                  className="w-full bg-transparent pr-2 text-xs sm:text-sm font-medium text-white placeholder:text-zinc-400 focus:outline-none"
                />

                {isSearching ? (
                  <div className="mr-3.5 text-[#FF8500]">
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
                    className="mr-3 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                    title="Clear query"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="mr-3.5 hidden sm:flex items-center gap-1">
                    <kbd className="rounded-md border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                      ⌘K
                    </kbd>
                  </div>
                )}
              </div>

              {/* ── Search Dropdown Panel (Z-Index 50) ── */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150 text-white">
                  {/* Exact GPS Coordinate Detection Highlight Card */}
                  {detectedCoords && (
                    <div className="p-3 border-b border-[#FF8500]/30 bg-[#FF8500]/10">
                      <button
                        type="button"
                        onClick={() => handlePinDetectedCoords(detectedCoords)}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-[#FF8500]/30 transition-all text-left group cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF8500] text-white shadow-xs">
                            <Crosshair className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-white">
                                Exact Coordinates Detected
                              </span>
                              <span className="rounded-md bg-[#FF8500]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#FF8500]">
                                Direct Pin
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5">
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
                    /* Popular Regions in Nepal */
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        <span>Popular Regions in Nepal</span>
                        <span className="text-[10px] font-normal lowercase text-zinc-500">tap to fly & pin</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_REGIONS.map((region) => (
                          <button
                            key={region.name}
                            type="button"
                            onClick={() => handleSelectPopularRegion(region)}
                            className="rounded-full border border-zinc-700/80 bg-zinc-800/60 hover:bg-[#FF8500]/20 hover:border-[#FF8500]/50 hover:text-[#FF8500] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                          >
                            {region.name}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-400">
                        Type any mountain, lake, river, village, or paste exact coordinates (e.g. 26.8680° N, 87.3234° E or 26°52′05″N, 87°19′24″E).
                      </div>
                    </div>
                  ) : !detectedCoords ? (
                    /* Search Results List */
                    <div className="max-h-[320px] flex flex-col">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 bg-zinc-900/40">
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
                          <MapPin className="h-7 w-7 text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
                          <p className="text-xs font-bold text-white">
                            No locations match &ldquo;{searchQuery}&rdquo;
                          </p>
                          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                            Try searching by nearby district (e.g. Kaski, Mustang, Chitwan) or paste exact coordinates.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-y-auto divide-y divide-zinc-800/60 py-1">
                          {searchResults.map((result, idx) => (
                            <button
                              key={result.id}
                              type="button"
                              onClick={() => handleSelectSearchResult(result)}
                              className={`group w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                                highlightedIndex === idx
                                  ? 'bg-zinc-800/90 text-white'
                                  : 'hover:bg-zinc-800/50 text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF8500]/15 text-[#FF8500] border border-[#FF8500]/30">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <div className="truncate">
                                  <p className="truncate text-xs sm:text-sm font-bold text-white group-hover:text-[#FF8500] transition-colors">
                                    {result.text}
                                  </p>
                                  <p className="truncate text-xs text-zinc-400 mt-0.5">
                                    {result.placeName}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {result.district && (
                                  <span className="hidden sm:inline rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                                    {result.district}
                                  </span>
                                )}
                                <div className="rounded-lg p-1 text-zinc-400 group-hover:text-[#FF8500] transition-colors">
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/60 px-4 py-2 text-[10px] text-zinc-400">
                        <span>↑↓ to navigate · Enter to pin · Esc to close</span>
                        <span className="font-medium text-[#FF8500]">Mapbox Geocoding</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Floating Top-Right Zoom & Compass Controls Pill ── */}
        <div className="pointer-events-auto absolute top-3.5 right-3.5 z-30 flex flex-col items-center rounded-2xl border border-zinc-700/70 bg-zinc-950/85 backdrop-blur-xl p-1 shadow-lg">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom In"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="w-4 h-px bg-zinc-700/60 my-0.5" />
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom Out"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="w-4 h-px bg-zinc-700/60 my-0.5" />
          <button
            type="button"
            onClick={() => mapRef.current?.resetNorthPitch({ duration: 800 })}
            title="Reset Bearing & Tilt"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <Navigation className="h-4 w-4 -rotate-45" />
          </button>
        </div>

        {/* Map Canvas */}
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Status Alert if any */}
        {locationStatus && (
          <div className="absolute top-16 left-3.5 right-3.5 z-30 flex items-center justify-between gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/95 px-4 py-3 text-xs text-destructive-foreground shadow-lg backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{locationStatus}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationStatus(null)}
              className="rounded p-0.5 hover:bg-black/20 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Bottom-Left Floating Map Styles & Location Dock ── */}
        <div className="pointer-events-auto absolute bottom-3.5 left-3.5 z-20 flex items-center gap-2 max-w-[calc(100%-12rem)] sm:max-w-none overflow-x-auto no-scrollbar">
          {/* Segmented Map Styles Pill */}
          <div className="flex items-center h-10 rounded-full border border-zinc-700/70 bg-zinc-950/85 backdrop-blur-xl p-1 shadow-lg shrink-0">
            <button
              type="button"
              onClick={() => handleToggleLayer('outdoors')}
              title="Topographic Terrain"
              className={`flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'outdoors'
                  ? 'bg-white text-zinc-950 shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mountain className="h-3.5 w-3.5" />
              <span>Terrain</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLayer('satellite')}
              title="Satellite Imagery"
              className={`flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'satellite'
                  ? 'bg-white text-zinc-950 shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLayer('dark')}
              title="Dark Navigation Map"
              className={`flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'dark'
                  ? 'bg-white text-zinc-950 shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              <span>Map</span>
            </button>
          </div>

          <div className="hidden sm:block h-5 w-px bg-zinc-700/60 mx-0.5 shrink-0" />

          {/* My Location Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-zinc-700/70 bg-zinc-950/85 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold backdrop-blur-xl shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF8500]" />
            ) : (
              <Crosshair className="h-3.5 w-3.5 text-zinc-300" />
            )}
            <span>My Location</span>
          </button>
        </div>

        {/* ── Bottom-Right Floating Confirm Location Button ── */}
        <div className="pointer-events-auto absolute bottom-3.5 right-3.5 z-20">
          <button
            type="button"
            onClick={handleConfirmLocation}
            className={`flex items-center gap-2 h-10 px-5 rounded-full font-bold text-xs sm:text-sm text-white shadow-[0_4px_22px_rgba(255,122,0,0.5)] transition-all active:scale-95 cursor-pointer ${
              isConfirmed
                ? 'bg-emerald-600 shadow-[0_4px_22px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-[#FF7A00] to-[#FF9E00] hover:from-[#FF8500] hover:to-[#FFA726]'
            }`}
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>{isConfirmed ? 'Location Confirmed!' : 'Confirm Location'}</span>
          </button>
        </div>
      </div>

      {/* ── 3. Bottom Details & Actions Bar (Inside Card) ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 px-1">
        {/* Left: Orange Pin Icon & Address with GPS */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF8500]/15 border border-[#FF8500]/30 text-[#FF8500] shadow-xs">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 font-bold text-white text-xs sm:text-sm">
              {currentAddress || 'Kathmandu, Bagmati Province, Nepal'}
            </p>
            {value ? (
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                GPS: {value.lat.toFixed(6)}° N, {value.lng.toFixed(6)}° E
              </p>
            ) : (
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                GPS: Not pinned yet
              </p>
            )}
          </div>
        </div>

        {/* Right: Clear & Adjust Pin Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleClearPin}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-zinc-700/70 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 text-zinc-400" />
            <span>Clear</span>
          </button>
          <button
            type="button"
            onClick={handleAdjustPin}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-zinc-700/70 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
            <span>Adjust Pin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
