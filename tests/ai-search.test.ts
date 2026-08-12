import { describe, it, expect } from "vitest";
import { parseQuery, parsePeso } from "@/lib/ai-search";

describe("parsePeso", () => {
  it("parses millions", () => {
    expect(parsePeso("5M")).toBe(5_000_000);
    expect(parsePeso("₱5,000,000")).toBe(5_000_000);
    expect(parsePeso("4.5 million")).toBe(4_500_000);
  });
  it("parses thousands", () => {
    expect(parsePeso("30k")).toBe(30_000);
    expect(parsePeso("30,000")).toBe(30_000);
  });
});

describe("parseQuery (natural-language search)", () => {
  it("parses 'House in Jaro under ₱5M'", () => {
    const p = parseQuery("House in Jaro under ₱5M");
    expect(p.propertyType).toBe("HOUSE");
    expect(p.areas).toContain("Jaro");
    expect(p.maxPrice).toBe(5_000_000);
  });

  it("parses '3-bedroom house near Mandurriao with parking'", () => {
    const p = parseQuery("A 3-bedroom house under ₱5 million near Mandurriao with parking");
    expect(p.propertyType).toBe("HOUSE");
    expect(p.bedrooms).toBe(3);
    expect(p.areas).toContain("Mandurriao");
    expect(p.amenities).toContain("parking");
    expect(p.maxPrice).toBe(5_000_000);
  });

  it("detects rent from '₱30,000/month' and 'for rent'", () => {
    const p = parseQuery("Condo for rent under ₱30,000 near Megaworld");
    expect(p.listingType).toBe("RENT");
    expect(p.propertyType).toBe("CONDO");
    expect(p.maxPrice).toBe(30_000);
    // "Megaworld" is an alias for Mandurriao
    expect(p.areas).toContain("Mandurriao");
  });

  it("parses 'Lot in Pavia'", () => {
    const p = parseQuery("Lot in Pavia");
    expect(p.propertyType).toBe("LOT");
    expect(p.areas).toContain("Pavia");
  });

  it("parses commercial property", () => {
    const p = parseQuery("Commercial property in Mandurriao");
    expect(p.propertyType).toBe("COMMERCIAL");
  });
});
