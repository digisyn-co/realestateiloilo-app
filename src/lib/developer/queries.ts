// Read-side view models for the developer ecosystem. Agent-only fields are only
// included when `showAgentInfo` is true (decided server-side via access.ts).

import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { compactPeso, formatPeso } from "../format";
import { PROJECT_STATUS_LABELS, ProjectStatus, UNIT_STATUS_LABELS, UnitStatus } from "../enums";
import { canSeeAgentInfo, visibleProjectsWhere, Viewer } from "./access";

export type UnitCounts = { total: number; available: number; reserved: number; sold: number; onHold: number; other: number };

export async function unitCountsFor(where: Prisma.UnitWhereInput): Promise<UnitCounts> {
  const grouped = await prisma.unit.groupBy({ by: ["status"], where, _count: { status: true } });
  const get = (s: string) => grouped.find((g) => g.status === s)?._count.status || 0;
  const total = grouped.reduce((a, g) => a + g._count.status, 0);
  return {
    total,
    available: get("AVAILABLE"),
    reserved: get("RESERVED"),
    sold: get("SOLD"),
    onHold: get("ON_HOLD") + get("UNDER_CONTRACT"),
    other: get("UNAVAILABLE"),
  };
}

// ---- Developer dashboard aggregates (brief §3) ----------------------------
export async function developerOverview(developerId: string) {
  const projectIds = (await prisma.project.findMany({ where: { developerId }, select: { id: true } })).map((p) => p.id);
  const unitWhere: Prisma.UnitWhereInput = { projectId: { in: projectIds } };

  const [projects, counts, valueAgg, availValueAgg, leads, monthLeads, reservations, sales, views] = await Promise.all([
    prisma.project.count({ where: { developerId } }),
    unitCountsFor(unitWhere),
    prisma.unit.aggregate({ where: unitWhere, _sum: { price: true } }),
    prisma.unit.aggregate({ where: { ...unitWhere, status: "AVAILABLE" }, _sum: { price: true } }),
    prisma.projectLead.count({ where: { projectId: { in: projectIds } } }),
    prisma.projectLead.count({ where: { projectId: { in: projectIds }, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
    prisma.unitReservation.count({ where: { projectId: { in: projectIds }, status: { in: ["RESERVED", "APPROVED"] } } }),
    prisma.unitSale.count({ where: { projectId: { in: projectIds } } }),
    prisma.projectView.count({ where: { projectId: { in: projectIds } } }),
  ]);

  const conversion = views > 0 ? ((sales / views) * 100).toFixed(1) + "%" : "—";
  return {
    projects,
    counts,
    inventoryValue: valueAgg._sum.price || 0,
    availableValue: availValueAgg._sum.price || 0,
    leads,
    monthLeads,
    reservations,
    sales,
    views,
    conversion,
  };
}

// ---- Project card / summary -----------------------------------------------
export type ProjectCardModel = {
  id: string;
  slug: string;
  name: string;
  developerName: string;
  city: string;
  area: string;
  projectType: string;
  status: string;
  statusCode: ProjectStatus;
  visibility: string;
  img?: string;
  totalUnits: number;
  availableUnits: number;
  priceFrom?: number;
  priceFromLabel?: string;
  lat?: number;
  lng?: number;
};

const projectCardInclude = {
  developer: { include: { user: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
} satisfies Prisma.ProjectInclude;

export async function projectCard(projectId: string): Promise<ProjectCardModel | null> {
  const p = await prisma.project.findUnique({ where: { id: projectId }, include: projectCardInclude });
  if (!p) return null;
  return buildProjectCard(p);
}

async function buildProjectCard(p: Prisma.ProjectGetPayload<{ include: typeof projectCardInclude }>): Promise<ProjectCardModel> {
  const counts = await unitCountsFor({ projectId: p.id });
  const min = await prisma.unit.aggregate({ where: { projectId: p.id, status: "AVAILABLE" }, _min: { price: true } });
  const from = min._min.price ?? undefined;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    developerName: p.developer.company,
    city: p.city,
    area: `${p.barangay ? p.barangay + ", " : ""}${p.city}`,
    projectType: p.projectType,
    status: PROJECT_STATUS_LABELS[p.status as ProjectStatus] || p.status,
    statusCode: p.status as ProjectStatus,
    visibility: p.visibility,
    img: p.images[0]?.url,
    totalUnits: counts.total,
    availableUnits: counts.available,
    priceFrom: from,
    priceFromLabel: from ? compactPeso(from) : undefined,
    lat: p.latitude ?? undefined,
    lng: p.longitude ?? undefined,
  };
}

export async function developerProjectCards(developerId: string): Promise<ProjectCardModel[]> {
  const rows = await prisma.project.findMany({ where: { developerId }, include: projectCardInclude, orderBy: { createdAt: "desc" } });
  return Promise.all(rows.map(buildProjectCard));
}

/** Public/visible project search — used by the global search integration (brief §26). */
export async function searchProjects(
  viewer: Viewer,
  opts: { q?: string; city?: string; take?: number } = {},
): Promise<ProjectCardModel[]> {
  const where: Prisma.ProjectWhereInput = {
    AND: [
      visibleProjectsWhere(viewer),
      { status: { notIn: ["ARCHIVED"] } },
      opts.city ? { city: { contains: opts.city, mode: "insensitive" } } : {},
      opts.q
        ? {
            OR: [
              { name: { contains: opts.q, mode: "insensitive" } },
              { description: { contains: opts.q, mode: "insensitive" } },
              { city: { contains: opts.q, mode: "insensitive" } },
              { barangay: { contains: opts.q, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };
  const rows = await prisma.project.findMany({ where, include: projectCardInclude, take: opts.take ?? 12, orderBy: { createdAt: "desc" } });
  return Promise.all(rows.map(buildProjectCard));
}

// ---- Unit view models -----------------------------------------------------
export type UnitView = {
  id: string;
  unitNumber: string;
  building?: string | null;
  floor?: number | null;
  unitType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floorArea?: number | null;
  parking?: number | null;
  price: number;
  priceLabel: string;
  status: string;
  statusCode: UnitStatus;
  orientation?: string | null;
  view?: string | null;
  // agent-only (present only when showAgentInfo)
  agentPrice?: number | null;
  agentPriceLabel?: string | null;
};

type UnitRow = Prisma.UnitGetPayload<{ include: { building: true } }>;

export function toUnitView(u: UnitRow, showAgentInfo: boolean): UnitView {
  const isRentIrrelevant = true; // units are sale inventory
  void isRentIrrelevant;
  return {
    id: u.id,
    unitNumber: u.unitNumber,
    building: u.building?.name,
    floor: u.floor,
    unitType: u.unitType,
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    floorArea: u.floorArea,
    parking: u.parking,
    price: u.price,
    priceLabel: formatPeso(u.price),
    status: UNIT_STATUS_LABELS[u.status as UnitStatus] || u.status,
    statusCode: u.status as UnitStatus,
    orientation: u.orientation,
    view: u.view,
    // NEVER include agent price unless the server decided the viewer may see it.
    agentPrice: showAgentInfo ? u.agentPrice : undefined,
    agentPriceLabel: showAgentInfo && u.agentPrice ? formatPeso(u.agentPrice) : undefined,
  };
}

export type UnitFilters = { building?: string; floor?: number; unitType?: string; status?: string; sort?: string; page?: number; perPage?: number };

export async function unitInventory(projectId: string, filters: UnitFilters, showAgentInfo: boolean) {
  const where: Prisma.UnitWhereInput = { projectId };
  if (filters.building) where.buildingId = filters.building;
  if (filters.floor != null) where.floor = filters.floor;
  if (filters.unitType) where.unitType = filters.unitType;
  if (filters.status) where.status = filters.status;

  const orderBy: Prisma.UnitOrderByWithRelationInput =
    filters.sort === "price_asc" ? { price: "asc" }
    : filters.sort === "price_desc" ? { price: "desc" }
    : filters.sort === "area_desc" ? { floorArea: "desc" }
    : { unitNumber: "asc" };

  const perPage = filters.perPage || 25;
  const page = Math.max(1, filters.page || 1);
  const [rows, total] = await Promise.all([
    prisma.unit.findMany({ where, include: { building: true }, orderBy, skip: (page - 1) * perPage, take: perPage }),
    prisma.unit.count({ where }),
  ]);
  return { units: rows.map((u) => toUnitView(u, showAgentInfo)), total, page, perPage };
}

/** Group available units by type for the public project page (brief §11). */
export async function availableUnitGroups(projectId: string) {
  const rows = await prisma.unit.findMany({
    where: { projectId, status: "AVAILABLE", visibility: "PUBLIC" },
    select: { unitType: true, floorArea: true, price: true, bedrooms: true },
  });
  const byType = new Map<string, { count: number; areas: number[]; prices: number[]; bedrooms?: number | null }>();
  for (const u of rows) {
    const g = byType.get(u.unitType) || { count: 0, areas: [], prices: [], bedrooms: u.bedrooms };
    g.count++;
    if (u.floorArea) g.areas.push(u.floorArea);
    g.prices.push(u.price);
    byType.set(u.unitType, g);
  }
  return [...byType.entries()].map(([unitType, g]) => ({
    unitType,
    count: g.count,
    areaRange: g.areas.length ? `${Math.min(...g.areas)}–${Math.max(...g.areas)}m²` : null,
    priceRange: `${compactPeso(Math.min(...g.prices))}–${compactPeso(Math.max(...g.prices))}`,
    priceFrom: Math.min(...g.prices),
  }));
}

export async function projectDetail(projectId: string, viewer: Viewer) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      developer: { include: { user: true } },
      images: { orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true } },
      buildings: true,
      documents: true,
    },
  });
  if (!project) return null;
  const showAgentInfo = await canSeeAgentInfo(viewer, project);
  const counts = await unitCountsFor({ projectId });
  const groups = await availableUnitGroups(projectId);
  const priceFrom = groups.length ? Math.min(...groups.map((g) => g.priceFrom)) : undefined;
  // agent-only documents are filtered out for non-agent viewers
  const docs = project.documents.filter((d) => showAgentInfo || d.visibility === "PUBLIC");
  return { project, showAgentInfo, counts, groups, priceFrom, docs };
}
