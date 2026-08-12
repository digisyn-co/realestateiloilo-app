import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCard } from "@/lib/queries";

// Hydrate a set of listing ids into card view-models (used by /compare).
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
  if (ids.length === 0) return NextResponse.json({ items: [] });
  const rows = await prisma.listing.findMany({
    where: { id: { in: ids } },
    include: {
      property: { include: { amenities: { include: { amenity: true } } } },
      images: { orderBy: { sortOrder: "asc" } },
      agent: { include: { user: true } },
      _count: { select: { savedBy: true, views: true } },
    },
  });
  // preserve requested order
  const byId = new Map(rows.map((r) => [r.id, r]));
  const items = ids.map((id) => byId.get(id)).filter(Boolean).map((r) => toCard(r as never));
  return NextResponse.json({ items });
}
