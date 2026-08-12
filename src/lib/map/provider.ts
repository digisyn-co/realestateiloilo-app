// Map provider abstraction (brief §7). The app is NOT hard-coded to one vendor.
// The default "stylised" provider needs no key and renders a lightweight schematic
// map (matching the prototype). Swap NEXT_PUBLIC_MAP_PROVIDER to wire MapTiler,
// Mapbox or Google — implement projectToTile()/tileUrl() for the chosen vendor.

import { ILOILO_CENTER } from "../iloilo";

export type LatLng = { lat: number; lng: number };
export type MapProviderKey = "stylised" | "maptiler" | "mapbox" | "google";

export function activeMapProvider(): MapProviderKey {
  return (process.env.NEXT_PUBLIC_MAP_PROVIDER as MapProviderKey) || "stylised";
}

export function mapCenter(): LatLng {
  const lat = Number(process.env.NEXT_PUBLIC_MAP_CENTER_LAT) || ILOILO_CENTER.lat;
  const lng = Number(process.env.NEXT_PUBLIC_MAP_CENTER_LNG) || ILOILO_CENTER.lng;
  return { lat, lng };
}

/**
 * Project a lat/lng into a 0..1 x/y position inside a bounding box. Used by the
 * stylised provider to place markers; a real tile provider would override this.
 */
export function projectToBox(point: LatLng, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const x = (point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1);
  const y = 1 - (point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1);
  return { x: clamp(x), y: clamp(y) };
}

export function boundsFor(points: LatLng[], pad = 0.02): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  if (points.length === 0) {
    const c = mapCenter();
    return { minLat: c.lat - 0.08, maxLat: c.lat + 0.08, minLng: c.lng - 0.08, maxLng: c.lng + 0.08 };
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad,
    maxLng: Math.max(...lngs) + pad,
  };
}

function clamp(v: number) {
  return Math.max(0.04, Math.min(0.96, v));
}
