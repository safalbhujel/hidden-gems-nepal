// lib/utils/geo.ts

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Decodes a PostGIS point value returned by Supabase/PostgREST into { lat, lng }.
 * Supports:
 * - EWKB hex strings (e.g. "0101000020E6100000...")
 * - GeoJSON objects ({ type: "Point", coordinates: [lng, lat] })
 * - WKT strings ("POINT(lng lat)")
 */
export function parsePostgisPoint(location: unknown): LatLng | null {
  if (!location) return null;

  // 1. GeoJSON object
  if (typeof location === 'object') {
    const obj = location as { type?: string; coordinates?: unknown };
    if (
      obj.type === 'Point' &&
      Array.isArray(obj.coordinates) &&
      obj.coordinates.length >= 2
    ) {
      const lng = Number(obj.coordinates[0]);
      const lat = Number(obj.coordinates[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
    return null;
  }

  if (typeof location !== 'string') return null;
  const trimmed = location.trim();
  if (!trimmed) return null;

  // 2. WKT POINT(lng lat)
  const wktMatch = trimmed.match(/POINT\s*\(\s*([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s*\)/i);
  if (wktMatch) {
    const lng = parseFloat(wktMatch[1]);
    const lat = parseFloat(wktMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  // 3. EWKB / WKB hex string
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length >= 42) {
    try {
      const byteLen = trimmed.length / 2;
      const bytes = new Uint8Array(byteLen);
      for (let i = 0; i < byteLen; i++) {
        bytes[i] = parseInt(trimmed.slice(i * 2, i * 2 + 2), 16);
      }
      const view = new DataView(bytes.buffer);
      const littleEndian = bytes[0] === 1;
      const wkbType = view.getUint32(1, littleEndian);
      const hasSrid = (wkbType & 0x20000000) !== 0;
      const coordOffset = hasSrid ? 9 : 5;

      if (byteLen >= coordOffset + 16) {
        const lng = view.getFloat64(coordOffset, littleEndian);
        const lat = view.getFloat64(coordOffset + 8, littleEndian);
        if (
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        ) {
          return {
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
          };
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Builds a Google Maps Directions URL targeting the exact pinned coordinates.
 * Intentionally omits `origin` so Google Maps prompts the user for their
 * starting location ("Choose starting point" / GPS) while locking the pin.
 */
export function buildGoogleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

/**
 * Builds a Google Maps pin search URL for viewing the exact coordinate on Google Maps.
 */
export function buildGoogleMapsPinUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

/**
 * Returns true only if the string is an external HTTP(S) URL (as opposed to plain address text).
 */
export function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}
