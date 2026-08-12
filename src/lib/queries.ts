// Read-side view models. Keeps Prisma shapes out of components and centralises
// the presentation mapping (price labels, spec chips, freshness, per-sqm).

import { prisma } from "./db";
import { compactPeso, formatArea, formatPeso, pricePerSqm } from "./format";
import { PROPERTY_TYPE_LABELS, PropertyType } from "./enums";
import { buildListingWhere, computeFreshness, FRESHNESS_LABELS, SearchFilters, sortToOrderBy } from "./search";
import type { Prisma } from "@prisma/client";

const listingInclude = {
  property: { include: { amenities: { include: { amenity: true } } } },
  images: { orderBy: { sortOrder: "asc" } },
  agent: { include: { user: true } },
  _count: { select: { savedBy: true, views: true } },
} satisfies Prisma.ListingInclude;

type ListingRow = Prisma.ListingGetPayload<{ include: typeof listingInclude }>;

export type CardModel = {
  id: string;
  title: string;
  area: string;
  city: string;
  priceLabel: string;
  priceShort: string;
  wasLabel?: string;
  price: number;
  type: string;
  typeCode: PropertyType;
  listingType: "SALE" | "RENT";
  saleRent: string;
  img?: string;
  images: string[];
  specChips: string[];
  verified?: string;
  perSqm?: string;
  drop?: string;
  freshness: string;
  freshnessCode: string;
  agentName?: string;
  agentId?: string;
  imported: boolean;
  sourceName?: string;
  lat?: number;
  lng?: number;
  saves: number;
  views: number;
};

export function toCard(l: ListingRow): CardModel {
  const p = l.property;
  const isRent = l.listingType === "RENT";
  const priceLabel = isRent ? `${formatPeso(l.price)}/mo` : formatPeso(l.price);
  const was = l.priceDropPct ? l.price / (1 - l.priceDropPct / 100) : undefined;
  const chips: string[] = [];
  if (p.bedrooms) chips.push(`${p.bedrooms} bed`);
  if (p.bathrooms) chips.push(`${p.bathrooms} bath`);
  if (p.floorArea) chips.push(formatArea(p.floorArea)!);
  else if (p.lotArea) chips.push(`${formatArea(p.lotArea)} lot`);
  if (p.parking) chips.push(`${p.parking} parking`);

  const fresh = computeFreshness(l);
  return {
    id: l.id,
    title: p.title,
    area: `${p.barangay ? p.barangay + ", " : ""}${p.city}`,
    city: p.city,
    priceLabel,
    priceShort: compactPeso(l.price),
    wasLabel: was ? formatPeso(was) : undefined,
    price: l.price,
    type: PROPERTY_TYPE_LABELS[p.propertyType as PropertyType] || p.propertyType,
    typeCode: p.propertyType as PropertyType,
    listingType: l.listingType as "SALE" | "RENT",
    saleRent: isRent ? "For rent" : "For sale",
    img: l.images[0]?.url,
    images: l.images.map((i) => i.url),
    specChips: chips,
    verified: l.verificationStatus === "VERIFIED" ? l.verifiedNote || "Verified" : undefined,
    perSqm: pricePerSqm(l.price, p.floorArea || p.lotArea) || undefined,
    drop: l.priceDropPct ? `↓ ${l.priceDropPct}%` : undefined,
    freshness: FRESHNESS_LABELS[fresh],
    freshnessCode: fresh,
    agentName: l.agent?.user.name,
    agentId: l.agent?.id,
    imported: !!l.sourceId,
    sourceName: l.sourceName || undefined,
    lat: p.latitude ?? undefined,
    lng: p.longitude ?? undefined,
    saves: l._count.savedBy,
    views: l._count.views,
  };
}

export async function searchListings(filters: SearchFilters): Promise<{ items: CardModel[]; total: number; page: number; perPage: number }> {
  const where = buildListingWhere(filters);
  const perPage = filters.perPage || 12;
  const page = Math.max(1, filters.page || 1);
  const [rows, total] = await Promise.all([
    prisma.listing.findMany({ where, include: listingInclude, orderBy: sortToOrderBy(filters.sort), skip: (page - 1) * perPage, take: perPage }),
    prisma.listing.count({ where }),
  ]);
  return { items: rows.map(toCard), total, page, perPage };
}

export async function getListingDetail(id: string) {
  const l = await prisma.listing.findUnique({
    where: { id },
    include: {
      ...listingInclude,
      agent: { include: { user: true, reviews: { orderBy: { createdAt: "desc" }, take: 5 }, _count: { select: { listings: true } } } },
      source: true,
    },
  });
  if (!l) return null;
  const card = toCard(l as unknown as ListingRow);
  const amenities = l.property.amenities.map((a) => a.amenity.name);
  return { listing: l, card, amenities };
}

export async function similarListings(card: CardModel, take = 6): Promise<CardModel[]> {
  const rows = await prisma.listing.findMany({
    where: {
      id: { not: card.id },
      status: { in: ["ACTIVE", "RESERVED"] },
      OR: [{ property: { city: card.city } }, { property: { propertyType: card.typeCode } }],
      price: { gte: card.price * 0.6, lte: card.price * 1.6 },
    },
    include: listingInclude,
    take,
  });
  return rows.map(toCard);
}

export async function mapListings(filters: SearchFilters): Promise<CardModel[]> {
  const where = buildListingWhere(filters);
  const rows = await prisma.listing.findMany({ where, include: listingInclude, take: 200 });
  return rows.map(toCard).filter((c) => c.lat != null && c.lng != null);
}

export async function getSavedListings(userId: string): Promise<CardModel[]> {
  const saved = await prisma.savedProperty.findMany({
    where: { userId },
    include: { listing: { include: listingInclude } },
    orderBy: { createdAt: "desc" },
  });
  return saved.map((s) => toCard(s.listing as unknown as ListingRow));
}

export async function getSavedIds(userId?: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await prisma.savedProperty.findMany({ where: { userId }, select: { listingId: true } });
  return new Set(rows.map((r) => r.listingId));
}

export async function districtCounts(): Promise<{ name: string; count: number }[]> {
  const rows = await prisma.property.groupBy({
    by: ["city"],
    where: { listing: { status: { in: ["ACTIVE", "RESERVED"] } } },
    _count: { city: true },
  });
  return rows.map((r) => ({ name: r.city, count: r._count.city })).sort((a, b) => b.count - a.count);
}
