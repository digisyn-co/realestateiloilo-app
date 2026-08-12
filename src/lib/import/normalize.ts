// Normalisation: RawListing -> NormalizedListing (brief §13 steps 14, §16, §18).
// Fields we cannot confidently map are recorded in `warnings` for the reviewer.

import { LISTING_TYPES, ListingType, PROPERTY_TYPES, PropertyType } from "../enums";
import { areaByName, findArea } from "../iloilo";
import { parsePeso } from "../ai-search";
import { NormalizedListing, RawListing } from "./types";

function num(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const cleaned = v.replace(/[₱,\s]/g, "");
    const n = Number(cleaned);
    if (Number.isFinite(n) && cleaned !== "") return n;
    return parsePeso(v);
  }
  return undefined;
}

function normalizeType(raw?: string): PropertyType | undefined {
  if (!raw) return undefined;
  const s = raw.toUpperCase().replace(/[^A-Z]/g, "_");
  if (PROPERTY_TYPES.includes(s as PropertyType)) return s as PropertyType;
  const map: Record<string, PropertyType> = {
    SINGLE_DETACHED: "HOUSE",
    SINGLE_ATTACHED: "HOUSE",
    HOME: "HOUSE",
    BUNGALOW: "HOUSE",
    CONDOMINIUM: "CONDO",
    UNIT: "CONDO",
    FLAT: "APARTMENT",
    LAND: "LOT",
    VACANT_LOT: "LOT",
    AGRICULTURAL: "FARM",
    RETAIL: "COMMERCIAL",
  };
  for (const [k, v] of Object.entries(map)) if (s.includes(k)) return v;
  const lower = raw.toLowerCase();
  if (/house|home|bungalow/.test(lower)) return "HOUSE";
  if (/condo/.test(lower)) return "CONDO";
  if (/apartment|flat/.test(lower)) return "APARTMENT";
  if (/town/.test(lower)) return "TOWNHOUSE";
  if (/lot|land/.test(lower)) return "LOT";
  if (/commercial|retail/.test(lower)) return "COMMERCIAL";
  if (/office/.test(lower)) return "OFFICE";
  if (/warehouse/.test(lower)) return "WAREHOUSE";
  return undefined;
}

function normalizeListingType(raw?: string, price?: number): ListingType | undefined {
  if (raw) {
    const s = raw.toUpperCase();
    if (LISTING_TYPES.includes(s as ListingType)) return s as ListingType;
    if (/RENT|LEASE|MONTH/.test(s)) return "RENT";
    if (/SALE|BUY|SELL/.test(s)) return "SALE";
  }
  // Heuristic: small prices in PH real estate usually mean monthly rent.
  if (price != null && price > 0 && price < 200_000) return "RENT";
  return undefined;
}

/** Resolve a city/area to a canonical Iloilo area name + coordinates. */
function normalizeLocation(raw: RawListing): { city: string; province: string; lat?: number; lng?: number; warn?: string } {
  const candidates = [raw.city, raw.barangay, raw.address].filter(Boolean) as string[];
  for (const c of candidates) {
    const area = findArea(c);
    if (area) return { city: area.name, province: "Iloilo", lat: area.lat, lng: area.lng };
  }
  const city = (raw.city && String(raw.city)) || "Iloilo City";
  return { city, province: (raw.province && String(raw.province)) || "Iloilo", warn: "Location not matched to a known Iloilo area" };
}

export function normalize(raw: RawListing): NormalizedListing {
  const warnings: string[] = [];

  const price = num(raw.price);
  if (price == null) warnings.push("Missing or unparseable price");

  const propertyType = normalizeType(raw.propertyType);
  if (!propertyType) warnings.push(`Unrecognised property type: ${raw.propertyType ?? "(none)"}`);

  const listingType = normalizeListingType(raw.listingType, price);
  if (!listingType) warnings.push("Listing type (sale/rent) could not be determined");

  const loc = normalizeLocation(raw);
  if (loc.warn) warnings.push(loc.warn);

  const lat = num(raw.latitude) ?? loc.lat;
  const lng = num(raw.longitude) ?? loc.lng;

  const images = (raw.images || [])
    .filter((i) => i && typeof i.url === "string" && /^https?:\/\//.test(i.url))
    .map((i) => ({
      url: i.url,
      // Do NOT assume public images are reusable (brief §18). Default to needing permission.
      rights: i.rights ?? ("EXTERNAL_REF" as const),
    }));
  if ((raw.images?.length || 0) !== images.length) warnings.push("Some image URLs were dropped as invalid");

  const title = (raw.title && String(raw.title).trim()) || "Untitled listing";
  if (!raw.title) warnings.push("Missing title");

  return {
    sourceListingId: raw.sourceListingId,
    sourceUrl: raw.sourceUrl,
    title,
    description: (raw.description && String(raw.description).trim()) || "",
    price: price ?? 0,
    currency: (raw.currency && String(raw.currency)) || "PHP",
    listingType: listingType ?? "SALE",
    propertyType: propertyType ?? "OTHER",
    address: raw.address ? String(raw.address) : undefined,
    barangay: raw.barangay ? String(raw.barangay) : undefined,
    city: loc.city,
    province: loc.province,
    latitude: lat,
    longitude: lng,
    bedrooms: intOrUndef(num(raw.bedrooms)),
    bathrooms: intOrUndef(num(raw.bathrooms)),
    floorArea: num(raw.floorArea),
    lotArea: num(raw.lotArea),
    parking: intOrUndef(num(raw.parking)),
    images,
    contactPhone: raw.contactPhone ? String(raw.contactPhone) : undefined,
    contactName: raw.contactName ? String(raw.contactName) : undefined,
    warnings,
  };
}

function intOrUndef(n?: number): number | undefined {
  return n == null ? undefined : Math.round(n);
}

/** Canonical area centroid lookup used when a source omits coordinates. */
export function centroidFor(city: string): { lat: number; lng: number } | undefined {
  const a = areaByName(city);
  return a ? { lat: a.lat, lng: a.lng } : undefined;
}
