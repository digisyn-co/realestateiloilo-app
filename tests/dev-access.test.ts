import { describe, it, expect } from "vitest";
import { toUnitView } from "@/lib/developer/queries";
import { scoreProjectMatch, bestProjectMatch } from "@/lib/developer/matching";

// A minimal Unit row (only fields toUnitView reads).
const unit = {
  id: "u1",
  unitNumber: "A-301",
  building: { name: "Tower A" },
  floor: 3,
  unitType: "2BR",
  bedrooms: 2,
  bathrooms: 2,
  floorArea: 65,
  parking: 1,
  price: 9_400_000,
  agentPrice: 9_100_000,
  status: "AVAILABLE",
  orientation: "West",
  view: null,
} as never;

describe("agent-only pricing gating (brief §16, §17)", () => {
  it("NEVER exposes agent price to a public viewer", () => {
    const view = toUnitView(unit, false);
    expect(view.agentPrice).toBeUndefined();
    expect(view.agentPriceLabel).toBeUndefined();
    // public price is always present
    expect(view.priceLabel).toBe("₱9,400,000");
  });

  it("exposes agent price only when the server allows it", () => {
    const view = toUnitView(unit, true);
    expect(view.agentPrice).toBe(9_100_000);
    expect(view.agentPriceLabel).toBe("₱9,100,000");
  });
});

describe("import → project matching (brief §29)", () => {
  const project = { id: "p1", name: "The Grand Iloilo Residences", city: "Mandurriao", developerName: "Iloilo Prime Developments" };

  it("scores a strong match when the project name appears in the title", () => {
    const score = scoreProjectMatch({ title: "2BR Condo — The Grand Iloilo Residences", city: "Mandurriao" }, project);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("scores low for an unrelated listing", () => {
    const score = scoreProjectMatch({ title: "House and lot in Oton", city: "Oton" }, project);
    expect(score).toBeLessThan(55);
  });

  it("bestProjectMatch returns null below the floor", () => {
    const best = bestProjectMatch({ title: "Random house", city: "Jaro" }, [project], 55);
    expect(best).toBeNull();
  });
});
