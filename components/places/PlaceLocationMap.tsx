'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MapPin,
  Copy,
  Check,
  Layers,
  Satellite,
  Map as MapIcon,
  Compass,
} from 'lucide-react';
import { MAP_CONFIG, setupEnhancedMap } from '@/lib/constants/maps';
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsPinUrl,
  isHttpUrl,
} from '@/lib/utils/geo';
import { GoogleMapsIcon } from '@/components/places/GoogleMapsIcon';

interface PlaceLocationMapProps {
  placeName: string;
  placeSlug: string;
  latitude: number | null;
  longitude: number | null;
  districtName?: string | null;
  landmarkText?: string | null;
}

export function PlaceLocationMap({
  placeName,
  placeSlug,
  latitude,
  longitude,
  districtName,
  landmarkText,
}: PlaceLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'outdoors'>('satellite');
  const [copiedCoords, setCopiedCoords] = useState(false);

  const hasValidCoords =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  useEffect(() => {
    if (!hasValidCoords || !mapContainerRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.satelliteStyle,
      center: [longitude, latitude],
      zoom: 13.8,
      pitch: 42,
      bearing: -10,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }),
      'top-right'
    );

    map.on('style.load', () => {
      setupEnhancedMap(map);
    });

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="position:absolute;top:0;width:44px;height:44px;border-radius:9999px;background:rgba(255,133,0,0.4);animation:ping 2.4s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:relative;display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#FF8500 0%,#E65100 100%);color:#fff;padding:6px 12px;border-radius:9999px;font-size:11px;font-weight:700;border:2px solid rgba(255,255,255,0.9);box-shadow:0 8px 20px rgba(0,0,0,0.4);white-space:nowrap;">
          <span>${placeName.replace(/[<>&"']/g, '')}</span>
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid #E65100;margin-top:-1px;"></div>
        <div style="width:8px;height:8px;border-radius:9999px;background:#FF8500;border:2px solid #fff;box-shadow:0 0 10px #FF8500;margin-top:1px;"></div>
      </div>
    `;

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([longitude, latitude])
      .addTo(map);

    mapRef.current = map;

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [hasValidCoords, latitude, longitude, placeName]);

  const handleToggleLayer = (layer: 'satellite' | 'outdoors') => {
    if (!mapRef.current || layer === activeLayer) return;
    setActiveLayer(layer);
    mapRef.current.setStyle(
      layer === 'satellite' ? MAP_CONFIG.satelliteStyle : MAP_CONFIG.outdoorsStyle
    );
  };

  const handleCopyCoords = async () => {
    if (!hasValidCoords) return;
    try {
      await navigator.clipboard.writeText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch {}
  };

  const externalMapLink = isHttpUrl(landmarkText) ? landmarkText! : null;
  const displayAddress = !isHttpUrl(landmarkText) ? landmarkText : null;

  return (
    <section className="space-y-4" id="location-map">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Pinned Location &amp; Directions</h2>
          {(displayAddress || districtName) && (
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{displayAddress || districtName}</span>
            </p>
          )}
        </div>

        {hasValidCoords && (
          <button
            type="button"
            onClick={handleCopyCoords}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 hover:bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Copy exact GPS coordinates"
          >
            <span>
              {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
            </span>
            {copiedCoords ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Live Mapbox Preview */}
      {hasValidCoords ? (
        <div className="relative h-[300px] sm:h-[340px] w-full overflow-hidden rounded-2xl border border-border bg-muted/30">
          <div ref={mapContainerRef} className="h-full w-full" />

          {/* Layer Switcher */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center rounded-xl border border-border/80 bg-background/95 p-1 shadow-md backdrop-blur-md">
            <button
              type="button"
              onClick={() => handleToggleLayer('satellite')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                activeLayer === 'satellite'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Satellite className="h-3.5 w-3.5" />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLayer('outdoors')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                activeLayer === 'outdoors'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Terrain</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-muted/40 border border-border flex items-center justify-center p-6">
          <div className="text-center space-y-2 text-muted-foreground">
            <Compass className="h-10 w-10 mx-auto opacity-40" />
            <p className="font-semibold text-sm text-foreground">
              {districtName ? `Located in ${districtName}` : 'Location saved with spot'}
            </p>
            <p className="text-xs">
              Pin coordinates were not provided for this submission.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons: View on Map + Get Directions on Google Maps */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/explore?view=map&place=${encodeURIComponent(placeSlug)}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary hover:text-primary font-semibold text-sm transition-colors shadow-2xs"
        >
          <MapIcon className="h-4 w-4 text-primary" />
          <span>View on Map</span>
        </Link>

        {hasValidCoords && (
          <>
            <a
              href={buildGoogleMapsDirectionsUrl(latitude, longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-[transform,background-color] active:scale-[0.98] shadow-xs"
            >
              <GoogleMapsIcon className="h-4 w-4 shrink-0" />
              <span>Get Directions on Google Maps</span>
            </a>

            <a
              href={buildGoogleMapsPinUrl(latitude, longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted font-semibold text-sm text-foreground transition-colors"
            >
              <GoogleMapsIcon className="h-4 w-4 shrink-0" />
              <span>Open Pin in Google Maps</span>
            </a>
          </>
        )}

        {externalMapLink && (
          <a
            href={externalMapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted font-semibold text-sm text-foreground transition-colors"
          >
            <GoogleMapsIcon className="h-4 w-4 shrink-0" />
            <span>Open Map Link</span>
          </a>
        )}
      </div>

      {hasValidCoords && (
        <p className="text-xs text-muted-foreground">
          Clicking &ldquo;Get Directions on Google Maps&rdquo; locks this exact pin as your destination and asks for your starting point.
        </p>
      )}
    </section>
  );
}
