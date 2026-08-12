import { describe, it, expect } from "vitest";
import { parseSearchParams, buildListingWhere, computeFreshness, sortToOrderBy } from "@/lib/search";
import { formatPeso, compactPeso, pricePerSqm } from "@/lib/format";

describe("parseSearchParams + NL folding", () => {
  it("folds an NL query into structured filters", () => {
    const f = parseSearchParams({ q: "House in Jaro under ₱5M" });
    expect(f.propertyType).toBe("HOUSE");
    expect(f.city).toBe("Jaro");
    expect(f.maxPrice).toBe(5_000_000);
  });

  it("explicit params win over NL parse", () => {
    const f = parseSearchParams({ q: "House under 5M", maxPrice: "3000000" });
    expect(f.maxPrice).toBe(3_000_000);
  });
});

describe("buildListingWhere", () => {
  it("restricts to public statuses and applies filters", () => {
    const where = buildListingWhere({ listingType: "RENT", maxPrice: 30000, verifiedOnly: true });
    expect(where.status).toEqual({ in: ["ACTIVE", "RESERVED"] });
    expect(where.listingType).toBe("RENT");
    expect(where.verificationStatus).toBe("VERIFIED");
    expect((where.price as { lte: number }).lte).toBe(30000);
  });

  it("nests property filters", () => {
    const where = buildListingWhere({ propertyType: "CONDO", city: "Mandurriao", bedrooms: 2 });
    expect(where.property).toMatchObject({ propertyType: "CONDO", bedrooms: { gte: 2 } });
  });
});

describe("sortToOrderBy", () => {
  it("maps sort keys", () => {
    expect(sortToOrderBy("price_asc")).toEqual([{ price: "asc" }]);
    expect(sortToOrderBy("newest")[0]).toHaveProperty("publishedAt");
  });
});

describe("freshness", () => {
  it("is FRESH when verified today and EXPIRED past expiry", () => {
    expect(computeFreshness({ lastVerifiedAt: new Date() })).toBe("FRESH");
    expect(computeFreshness({ expiresAt: new Date(Date.now() - 1000) })).toBe("EXPIRED");
    expect(computeFreshness({ updatedAt: new Date(Date.now() - 60 * 86400000) })).toBe("POSSIBLY_STALE");
  });
});

describe("peso formatting", () => {
  it("formats full and compact", () => {
    expect(formatPeso(8900000)).toBe("₱8,900,000");
    expect(compactPeso(8900000)).toBe("₱8.9M");
    expect(compactPeso(950000)).toBe("₱950K");
    expect(pricePerSqm(8900000, 240)).toBe("₱37,083/sqm");
  });
});
