import { NextRequest, NextResponse } from "next/server";
import { parseQuery } from "@/lib/ai-search";
import { searchListings } from "@/lib/queries";
import { parseSearchParams } from "@/lib/search";

// Natural-language search endpoint (brief §6). Uses the deterministic local parser
// (ai-search.ts). If AI_PROVIDER=anthropic + a key were set, an LLM parse could be
// layered here — but the local parse guarantees results with no external dependency.
export async function POST(req: NextRequest) {
  const { query } = (await req.json().catch(() => ({}))) as { query?: string };
  if (!query || !query.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });

  const parsed = parseQuery(query);
  const filters = parseSearchParams({ q: query, perPage: "12" });
  const { items, total } = await searchListings(filters);

  return NextResponse.json({
    criteria: parsed.criteria,
    query,
    total,
    items,
    href: buildBrowseHref(parsed, query),
  });
}

function buildBrowseHref(parsed: ReturnType<typeof parseQuery>, query: string): string {
  const p = new URLSearchParams();
  p.set("q", query);
  if (parsed.listingType) p.set("listingType", parsed.listingType);
  if (parsed.propertyType) p.set("propertyType", parsed.propertyType);
  if (parsed.maxPrice) p.set("maxPrice", String(parsed.maxPrice));
  if (parsed.minPrice) p.set("minPrice", String(parsed.minPrice));
  if (parsed.bedrooms) p.set("bedrooms", String(parsed.bedrooms));
  if (parsed.areas[0]) p.set("city", parsed.areas[0]);
  return `/browse?${p.toString()}`;
}
