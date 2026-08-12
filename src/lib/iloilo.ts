// Iloilo geography — powers location-aware search (brief §6) and the map.
// Coordinates are approximate district/town centroids for map placement.

export type IloiloArea = {
  slug: string;
  name: string;
  kind: "district" | "municipality" | "city";
  parent: string; // "Iloilo City" or "Iloilo Province"
  lat: number;
  lng: number;
  aliases?: string[];
};

// Iloilo City districts
export const ILOILO_CITY_DISTRICTS: IloiloArea[] = [
  { slug: "city-proper", name: "City Proper", kind: "district", parent: "Iloilo City", lat: 10.6969, lng: 122.5709 },
  { slug: "jaro", name: "Jaro", kind: "district", parent: "Iloilo City", lat: 10.7300, lng: 122.5510 },
  { slug: "mandurriao", name: "Mandurriao", kind: "district", parent: "Iloilo City", lat: 10.7108, lng: 122.5433, aliases: ["megaworld", "iloilo business park"] },
  { slug: "la-paz", name: "La Paz", kind: "district", parent: "Iloilo City", lat: 10.7176, lng: 122.5762 },
  { slug: "lapuz", name: "Lapuz", kind: "district", parent: "Iloilo City", lat: 10.7059, lng: 122.5872 },
  { slug: "molo", name: "Molo", kind: "district", parent: "Iloilo City", lat: 10.6976, lng: 122.5470 },
  { slug: "arevalo", name: "Arevalo", kind: "district", parent: "Iloilo City", lat: 10.6963, lng: 122.5147, aliases: ["villa"] },
];

// Iloilo province municipalities / cities
export const ILOILO_MUNICIPALITIES: IloiloArea[] = [
  { slug: "pavia", name: "Pavia", kind: "municipality", parent: "Iloilo Province", lat: 10.7758, lng: 122.5433 },
  { slug: "oton", name: "Oton", kind: "municipality", parent: "Iloilo Province", lat: 10.6931, lng: 122.4708 },
  { slug: "leganes", name: "Leganes", kind: "municipality", parent: "Iloilo Province", lat: 10.7847, lng: 122.5872 },
  { slug: "santa-barbara", name: "Santa Barbara", kind: "municipality", parent: "Iloilo Province", lat: 10.8228, lng: 122.5344 },
  { slug: "san-miguel", name: "San Miguel", kind: "municipality", parent: "Iloilo Province", lat: 10.7783, lng: 122.4869 },
  { slug: "cabatuan", name: "Cabatuan", kind: "municipality", parent: "Iloilo Province", lat: 10.8803, lng: 122.4869 },
  { slug: "zarraga", name: "Zarraga", kind: "municipality", parent: "Iloilo Province", lat: 10.8189, lng: 122.6039 },
  { slug: "dumangas", name: "Dumangas", kind: "municipality", parent: "Iloilo Province", lat: 10.8272, lng: 122.7100 },
  { slug: "passi", name: "Passi City", kind: "city", parent: "Iloilo Province", lat: 11.1078, lng: 122.6419 },
];

export const ALL_AREAS: IloiloArea[] = [...ILOILO_CITY_DISTRICTS, ...ILOILO_MUNICIPALITIES];

export const ILOILO_CENTER = { lat: 10.7202, lng: 122.5621 };

export function findArea(query: string): IloiloArea | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return ALL_AREAS.find(
    (a) =>
      a.name.toLowerCase() === q ||
      a.slug === q ||
      a.name.toLowerCase().includes(q) ||
      (a.aliases || []).some((al) => q.includes(al) || al.includes(q)),
  );
}

/** Match any area name/alias mentioned inside a free-text query (for NL search). */
export function matchAreasInText(text: string): IloiloArea[] {
  const t = text.toLowerCase();
  return ALL_AREAS.filter(
    (a) => t.includes(a.name.toLowerCase()) || (a.aliases || []).some((al) => t.includes(al)),
  );
}

export function areaByName(name: string): IloiloArea | undefined {
  return ALL_AREAS.find((a) => a.name.toLowerCase() === name.toLowerCase());
}
