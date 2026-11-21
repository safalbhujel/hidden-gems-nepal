// lib/services/geocoding.ts

import { NEPAL_BOUNDS } from '@/lib/constants/maps';

export interface GeocodingResult {
  id: string;
  placeName: string;
  text: string;
  coordinates: [number, number]; // [lng, lat]
  district?: string;
  locality?: string;
}

interface MapboxContextItem {
  id: string;
  text: string;
}

interface MapboxFeatureItem {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  context?: MapboxContextItem[];
}

const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

function getToken(): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is not configured in .env.local');
  }
  return token;
}

/**
 * Parses user-provided coordinates in decimal or DMS (Degrees, Minutes, Seconds) formats.
 * Supports:
 * - "26.8680° N, 87.3234° E"
 * - "26°52′05″N, 87°19′24″E" or "26°52'05\"N, 87°19'24\"E"
 * - "26.8680, 87.3234"
 * - "27.7172 N, 85.3240 E"
 * - "[26.8680, 87.3234]"
 */
export function parseCoordinates(input: string): { lat: number; lng: number } | null {
  if (!input || typeof input !== 'string') return null;
  const clean = input.replace(/[()[\]]/g, '').trim();
  if (clean.length < 5) return null;

  // 1. DMS format: e.g. 26°52′05″N, 87°19′24″E or 26°52'05"N, 87°19'24"E
  const dmsRegex =
    /([0-9]{1,3})[°\s]+([0-9]{1,2})[′'\s]+([0-9]{1,2}(?:\.[0-9]+)?)[″"\s]*([NSEWnsew])?[,\s]+([0-9]{1,3})[°\s]+([0-9]{1,2})[′'\s]+([0-9]{1,2}(?:\.[0-9]+)?)[″"\s]*([NSEWnsew])?/;
  const dmsMatch = clean.match(dmsRegex);
  if (dmsMatch) {
    let d1 =
      parseFloat(dmsMatch[1]) +
      parseFloat(dmsMatch[2]) / 60 +
      parseFloat(dmsMatch[3]) / 3600;
    const dir1 = (dmsMatch[4] || '').toUpperCase();
    if (dir1 === 'S' || dir1 === 'W') d1 = -d1;

    let d2 =
      parseFloat(dmsMatch[5]) +
      parseFloat(dmsMatch[6]) / 60 +
      parseFloat(dmsMatch[7]) / 3600;
    const dir2 = (dmsMatch[8] || '').toUpperCase();
    if (dir2 === 'S' || dir2 === 'W') d2 = -d2;

    let lat = d1;
    let lng = d2;
    // Swap if cardinal direction specifies East first or latitude is out of Nepal bounds
    if (dir1 === 'E' || dir2 === 'N' || (lat > 50 && lng < 40)) {
      lat = d2;
      lng = d1;
    }
    return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  }

  // 2. Decimal with Cardinal / Degrees: e.g. 26.8680° N, 87.3234° E or 26.8680, 87.3234
  const decRegex =
    /([-+]?[0-9]*\.?[0-9]+)[°\s]*([NSEWnsew])?[,\s]+([-+]?[0-9]*\.?[0-9]+)[°\s]*([NSEWnsew])?/;
  const decMatch = clean.match(decRegex);
  if (decMatch) {
    let v1 = parseFloat(decMatch[1]);
    const dir1 = (decMatch[2] || '').toUpperCase();
    if (dir1 === 'S' || dir1 === 'W') v1 = -v1;

    let v2 = parseFloat(decMatch[3]);
    const dir2 = (decMatch[4] || '').toUpperCase();
    if (dir2 === 'S' || dir2 === 'W') v2 = -v2;

    let lat = v1;
    let lng = v2;
    // Nepal coordinates are typically ~26-31° N and ~80-89° E
    if (dir1 === 'E' || dir2 === 'N' || (lat > 50 && lng < 40)) {
      lat = v2;
      lng = v1;
    }
    return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  }

  return null;
}

/**
 * Forward Geocoding: Search places, landmarks, or addresses across Nepal.
 * Also parses exact coordinates if entered.
 * Bounded strictly to Nepal via country code and bounding box.
 */
export async function forwardGeocode(
  query: string,
  limit: number = 7
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  // Check if query is exact coordinates
  const parsedCoords = parseCoordinates(trimmed);
  if (parsedCoords) {
    const isInside =
      parsedCoords.lat >= NEPAL_BOUNDS[0][1] - 0.5 &&
      parsedCoords.lat <= NEPAL_BOUNDS[1][1] + 0.5 &&
      parsedCoords.lng >= NEPAL_BOUNDS[0][0] - 0.5 &&
      parsedCoords.lng <= NEPAL_BOUNDS[1][0] + 0.5;

    return [
      {
        id: `coord-${parsedCoords.lat}-${parsedCoords.lng}`,
        placeName: isInside
          ? `GPS Coordinates: ${parsedCoords.lat.toFixed(5)}° N, ${parsedCoords.lng.toFixed(5)}° E (Nepal)`
          : `Coordinates: ${parsedCoords.lat.toFixed(5)}° N, ${parsedCoords.lng.toFixed(5)}° E`,
        text: `${parsedCoords.lat.toFixed(5)}° N, ${parsedCoords.lng.toFixed(5)}° E`,
        coordinates: [parsedCoords.lng, parsedCoords.lat],
        district: isInside ? 'Direct GPS Pin' : 'Outside Nepal',
      },
    ];
  }

  const token = getToken();
  const bbox = `${NEPAL_BOUNDS[0][0]},${NEPAL_BOUNDS[0][1]},${NEPAL_BOUNDS[1][0]},${NEPAL_BOUNDS[1][1]}`;

  const url = new URL(`${MAPBOX_GEOCODING_URL}/${encodeURIComponent(trimmed)}.json`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('country', 'np');
  url.searchParams.set('bbox', bbox);
  url.searchParams.set('limit', String(limit));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.warn(`[forwardGeocode] Mapbox API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map((f: MapboxFeatureItem) => {
      // Find district or region from context hierarchy
      const districtContext = f.context?.find(
        (c: MapboxContextItem) => c.id.startsWith('district') || c.id.startsWith('region')
      );

      return {
        id: f.id,
        placeName: f.place_name,
        text: f.text,
        coordinates: f.center as [number, number], // [lng, lat]
        district: districtContext?.text,
      };
    });
  } catch (error) {
    console.error('[forwardGeocode] Error searching places:', error);
    return [];
  }
}

/**
 * Reverse Geocoding: Converts [longitude, latitude] into a human-readable location address.
 */
export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<GeocodingResult | null> {
  const token = getToken();

  const url = new URL(`${MAPBOX_GEOCODING_URL}/${lng},${lat}.json`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('country', 'np');
  url.searchParams.set('limit', '1');

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`[reverseGeocode] Mapbox API error status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const primary = data.features?.[0] as MapboxFeatureItem | undefined;
    if (!primary) return null;

    const districtContext = primary.context?.find(
      (c: MapboxContextItem) => c.id.startsWith('district') || c.id.startsWith('region')
    );

    return {
      id: primary.id,
      placeName: primary.place_name,
      text: primary.text,
      coordinates: primary.center as [number, number],
      district: districtContext?.text,
    };
  } catch (error) {
    console.error('[reverseGeocode] Error looking up coordinates:', error);
    return null;
  }
}
