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
 * Forward Geocoding: Search places, landmarks, or addresses across Nepal.
 * Bounded strictly to Nepal via country code and bounding box.
 */
export async function forwardGeocode(
  query: string,
  limit: number = 5
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const token = getToken();
  const bbox = `${NEPAL_BOUNDS[0][0]},${NEPAL_BOUNDS[0][1]},${NEPAL_BOUNDS[1][0]},${NEPAL_BOUNDS[1][1]}`;

  const url = new URL(`${MAPBOX_GEOCODING_URL}/${encodeURIComponent(trimmed)}.json`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('country', 'np');
  url.searchParams.set('bbox', bbox);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('types', 'poi,address,place,locality,neighborhood');

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
