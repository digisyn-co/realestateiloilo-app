// Structured search → Prisma query (brief §6). Natural-language queries are first
// run through parseQuery() (ai-search.ts) and merged into these filters.

import type { Prisma } from "@prisma/client";
import { Freshness, ListingType, PropertyType } from "./enums";
import { parseQuery } from "./ai-search";

export type SortKey = "relevance" | "newest" | "price_asc" | "price_desc" | "area_desc";

export type SearchFilters = {
  q?: string; // free text / NL query
  listingType?: ListingType;
  propertyType?: PropertyType;
  city?: string; // area / district / municipality name
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  verifiedOnly?: boolean;
  amenities?: string[];
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

export function parseSearchParams(sp: Record<string, string | string[] | undefined>): SearchFilters {
  const one = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined));
  const num = (k: string) => {
    const v = one(k);
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const filters: SearchFilters = {
    q: one("q") || undefined,
    listingType: (one("listingType") as ListingType) || undefined,
    propertyType: (one("propertyType") as PropertyType) || undefined,
    city: one("city") || undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    bedrooms: num("bedrooms"),
    bathrooms: num("bathrooms"),
    minArea: num("minArea"),
    verifiedOnly: one("verifiedOnly") === "1" || one("verifiedOnly") === "true",
    amenities: one("amenities") ? String(one("amenities")).split(",").filter(Boolean) : undefined,
    sort: (one("sort") as SortKey) || "relevance",
    page: num("page") || 1,
    perPage: num("perPage") || 12,
  };

  // Fold a natural-language query into structured filters when present.
  if (filters.q) {
    const p = parseQuery(filters.q);
    filters.listingType ??= p.listingType;
    filters.propertyType ??= p.propertyType;
    filters.minPrice ??= p.minPrice;
    filters.maxPrice ??= p.maxPrice;
    filters.bedrooms ??= p.bedrooms;
    filters.bathrooms ??= p.bathrooms;
    if (!filters.city && p.areas.length) filters.city = p.areas[0];
    if (!filters.amenities && p.amenities.length) filters.amenities = p.amenities;
  }
  return filters;
}

/** Build a Prisma `where` for active, public listings matching the filters. */
export function buildListingWhere(f: SearchFilters, opts: { publicOnly?: boolean } = {}): Prisma.ListingWhereInput {
  const property: Prisma.PropertyWhereInput = {};
  if (f.propertyType) property.propertyType = f.propertyType;
  if (f.city) property.city = { contains: f.city, mode: "insensitive" };
  if (f.bedrooms != null) property.bedrooms = { gte: f.bedrooms };
  if (f.bathrooms != null) property.bathrooms = { gte: f.bathrooms };
  if (f.minArea != null) property.floorArea = { gte: f.minArea };
  if (f.amenities?.length) {
    property.amenities = { some: { amenity: { name: { in: f.amenities.map(titleize) } } } };
  }

  const where: Prisma.ListingWhereInput = {};
  if (opts.publicOnly !== false) {
    where.status = { in: ["ACTIVE", "RESERVED"] };
  }
  if (f.listingType) where.listingType = f.listingType;
  if (f.minPrice != null || f.maxPrice != null) {
    where.price = {};
    if (f.minPrice != null) (where.price as Prisma.FloatFilter).gte = f.minPrice;
    if (f.maxPrice != null) (where.price as Prisma.FloatFilter).lte = f.maxPrice;
  }
  if (f.verifiedOnly) where.verificationStatus = "VERIFIED";
  if (Object.keys(property).length) where.property = property;

  // Free-text fallback across title/description/area — ONLY when the NL parse
  // produced no structured signal. Otherwise the raw sentence would narrow (AND)
  // the query to listings whose text literally contains the whole sentence.
  const hasStructured =
    !!f.propertyType || !!f.city || !!f.listingType || f.minPrice != null || f.maxPrice != null || f.bedrooms != null || f.bathrooms != null;
  if (f.q && !hasStructured) {
    where.OR = [
      { property: { title: { contains: f.q, mode: "insensitive" } } },
      { property: { description: { contains: f.q, mode: "insensitive" } } },
      { property: { address: { contains: f.q, mode: "insensitive" } } },
      { property: { barangay: { contains: f.q, mode: "insensitive" } } },
    ];
  }
  return where;
}

export function sortToOrderBy(sort: SortKey | undefined): Prisma.ListingOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "area_desc":
      return [{ property: { floorArea: "desc" } }];
    case "relevance":
    default:
      // verified first, then most recently published
      return [{ verificationStatus: "asc" }, { publishedAt: "desc" }];
  }
}

function titleize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Freshness (brief §16)
// ---------------------------------------------------------------------------

export function computeFreshness(l: {
  lastVerifiedAt?: Date | null;
  updatedAt?: Date | null;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
  sourceLastSeenAt?: Date | null;
}): Freshness {
  const now = Date.now();
  if (l.expiresAt && l.expiresAt.getTime() < now) return "EXPIRED";
  const days = (d?: Date | null) => (d ? (now - d.getTime()) / 86_400_000 : Infinity);
  const refreshed = Math.min(days(l.lastVerifiedAt), days(l.updatedAt), days(l.sourceLastSeenAt));
  if (refreshed <= 3) return "FRESH";
  if (refreshed <= 14) return "RECENTLY_UPDATED";
  if (refreshed <= 45) return "NEEDS_VERIFICATION";
  return "POSSIBLY_STALE";
}

export const FRESHNESS_LABELS: Record<Freshness, string> = {
  FRESH: "Fresh",
  RECENTLY_UPDATED: "Recently updated",
  NEEDS_VERIFICATION: "Needs verification",
  POSSIBLY_STALE: "Possibly stale",
  EXPIRED: "Expired",
};
