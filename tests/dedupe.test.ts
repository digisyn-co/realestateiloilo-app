import { describe, it, expect } from "vitest";
import { scoreDuplicate, bestDuplicate, normPhone, haversineMeters, numCloseness, textSim, DupCandidate } from "@/lib/import/dedupe";
import { NormalizedListing } from "@/lib/import/types";

function listing(over: Partial<NormalizedListing> = {}): NormalizedListing {
  return {
    title: "Modern Executive House in Jaro",
    description: "",
    price: 8_900_000,
    currency: "PHP",
    listingType: "SALE",
    propertyType: "HOUSE",
    city: "Jaro",
    barangay: "Tabuc Suba",
    province: "Iloilo",
    latitude: 10.73,
    longitude: 122.551,
    bedrooms: 4,
    bathrooms: 3,
    floorArea: 240,
    lotArea: 300,
    images: [],
    contactPhone: "+63 917 222 3000",
    warnings: [],
    ...over,
  };
}

const candidate: DupCandidate = {
  id: "listing-1",
  title: "Executive House Jaro 4BR",
  price: 8_950_000,
  propertyType: "HOUSE",
  city: "Jaro",
  barangay: "Tabuc Suba",
  address: "Tabuc Suba, Jaro",
  latitude: 10.7302,
  longitude: 122.5512,
  bedrooms: 4,
  bathrooms: 3,
  floorArea: 238,
  lotArea: 300,
  contactPhone: "0917 222 3000",
  sourceUrl: null,
};

describe("duplicate detection", () => {
  it("scores an obvious duplicate as strong", () => {
    const r = scoreDuplicate(listing(), candidate);
    expect(r.confidence).toBeGreaterThanOrEqual(70);
    expect(["STRONG", "LIKELY"]).toContain(r.verdict);
  });

  it("scores an unrelated listing as none/weak", () => {
    const other = { ...candidate, id: "x", title: "Studio condo Smallville", price: 18_500, propertyType: "CONDO", city: "Mandurriao", barangay: "Bolilao", address: "Bolilao, Mandurriao", latitude: 10.71, longitude: 122.54, bedrooms: 1, bathrooms: 1, floorArea: 28, lotArea: undefined, contactPhone: "0917 999 0000" };
    const r = scoreDuplicate(listing(), other);
    expect(r.confidence).toBeLessThan(40);
  });

  it("bestDuplicate picks the highest-confidence candidate", () => {
    const far = { ...candidate, id: "far", latitude: 11.1, longitude: 122.6, price: 2_000_000, title: "Farm lot", propertyType: "FARM", contactPhone: "0999 000 1111" };
    const best = bestDuplicate(listing(), [far, candidate]);
    expect(best?.candidate.id).toBe("listing-1");
  });

  it("phone matching normalises PH formats", () => {
    expect(normPhone("0917 222 3000")).toBe(normPhone("+63 917 222 3000"));
  });

  it("haversine ~0 for identical points", () => {
    expect(haversineMeters(10.73, 122.55, 10.73, 122.55)).toBeCloseTo(0, 5);
  });

  it("numCloseness returns 1 within tolerance and 0 far apart", () => {
    expect(numCloseness(100, 102, 0.05)).toBe(1);
    expect(numCloseness(100, 400, 0.05)).toBe(0);
  });

  it("textSim is high for reordered tokens", () => {
    expect(textSim("executive house jaro", "jaro executive house")).toBeGreaterThan(0.9);
  });
});
