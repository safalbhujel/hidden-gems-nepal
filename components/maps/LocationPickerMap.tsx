'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Navigation, Loader2, MapPin, AlertCircle, Check } from 'lucide-react';
import { NEPAL_BOUNDS, NEPAL_CENTER, MAP_CONFIG, isWithinNepal, setupEnhancedMap } from '@/lib/constants/maps';
import { forwardGeocode, reverseGeocode, type GeocodingResult } from '@/lib/services/geocoding';
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

export function LocationPickerMap({
  value,
  onChange,
  onLocationDetails,
  className = 'h-[460px] w-full',
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');

  // Reverse geocodes the coordinates and informs parent
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
          duration: 1200,
          essential: true,
        });
      }

      onChangeRef.current?.({ lat: roundedLat, lng: roundedLng });
      handleReverseGeocode(roundedLng, roundedLat);
    },
    [handleReverseGeocode]
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
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

    map.on('style.load', () => {
      setupEnhancedMap(map);
    });

    map.on('load', () => {
      mapRef.current = map;

      // Custom marker container matching "Authentic Trailguide" design
      const el = document.createElement('div');
      el.className = 'custom-gem-pin';
      el.innerHTML = `
        <div style="
          width: 34px;
          height: 34px;
          background-color: hsl(28 100% 50%);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: white;
            border-radius: 50%;
            transform: rotate(45deg);
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

      // Tap or click on map to reposition
      map.on('click', (e) => {
        setPosition(e.lngLat.lng, e.lngLat.lat, false);
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

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim() || val.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // Forward geocoding search handler with debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await forwardGeocode(trimmed, 5);
      setSearchResults(results);
      setShowDropdown(results.length > 0);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select a searched place
  const handleSelectSearchResult = (result: GeocodingResult) => {
    const [lng, lat] = result.coordinates;
    setPosition(lng, lat, true);
    setSearchQuery(result.text);
    setCurrentAddress(result.placeName);
    setShowDropdown(false);
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

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border border-border shadow-md ${className}`}>
      {/* ── Top Floating Bar: Location Search + Current Location ───────────────── */}
      <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Search address or landmark in Nepal…"
              className="h-10 w-full rounded-xl border border-border/80 bg-background/95 pl-10 pr-9 text-sm text-foreground shadow-md backdrop-blur-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-primary" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-11 max-h-60 overflow-y-auto rounded-xl border border-border bg-background/95 p-1.5 shadow-xl backdrop-blur-md">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(result)}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left text-xs transition-colors hover:bg-muted"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div>
                    <span className="font-semibold text-foreground">{result.text}</span>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                      {result.placeName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Use Current Location Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="h-10 shrink-0 gap-1.5 rounded-xl border-border/80 bg-background/95 text-foreground shadow-md backdrop-blur-md hover:bg-background"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Navigation className="h-4 w-4 text-primary" />
          )}
          <span className="hidden sm:inline text-xs font-semibold">Near Me</span>
        </Button>
      </div>

      {/* ── Map Container ──────────────────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* ── Status Alert Message if any ────────────────────────────────────────── */}
      {locationStatus && (
        <div className="absolute top-16 left-3 right-3 z-10 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/90 px-3 py-2 text-xs text-destructive-foreground shadow-md backdrop-blur-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{locationStatus}</span>
        </div>
      )}

      {/* ── Bottom Floating Bar: Active Coordinates & Address ──────────────────── */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/95 px-3.5 py-2 text-xs text-foreground shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-3 w-3 stroke-[3]" />
          </span>
          <div className="min-w-0">
            <p className="line-clamp-1 font-medium text-foreground">
              {currentAddress || 'Drop the pin on the exact location'}
            </p>
            {value && (
              <p className="text-[10px] text-muted-foreground font-mono">
                {value.lat.toFixed(5)}° N, {value.lng.toFixed(5)}° E
              </p>
            )}
          </div>
        </div>

        <span className="shrink-0 text-[11px] font-medium text-muted-foreground hidden sm:inline">
          Drag pin or click map to adjust
        </span>
      </div>
    </div>
  );
}
