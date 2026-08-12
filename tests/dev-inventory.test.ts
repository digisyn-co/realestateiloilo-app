import { describe, it, expect } from "vitest";
import { buildImportPreview, parseUnitsCsv, validateUnitRow } from "@/lib/developer/inventory";

const CSV = `Building,Unit Number,Floor,Unit Type,Bedrooms,Bathrooms,Floor Area,Price,Status,Parking,Orientation
Tower A,A-101,1,Studio,0,1,28,4200000,Available,0,East
Tower A,A-102,1,Studio,0,1,28,4300000,Reserved,0,East
Tower A,A-201,2,1BR,1,1,42,6800000,Sold,1,North
Tower A,,3,2BR,2,2,65,9400000,Available,1,West
Tower A,A-302,3,2BR,2,2,65,notaprice,Available,1,West`;

describe("bulk unit import (brief §9)", () => {
  it("parses CSV headers into rows", () => {
    const rows = parseUnitsCsv(CSV);
    expect(rows.length).toBe(5);
    expect(rows[0]["Unit Number"]).toBe("A-101");
  });

  it("validates and normalises a good row", () => {
    const r = validateUnitRow({ "Unit Number": "A-101", "Unit Type": "1BR", Price: "6,800,000", Status: "Available" }, 1);
    expect(r.errors).toHaveLength(0);
    expect(r.normalized?.unitType).toBe("1BR");
    expect(r.normalized?.price).toBe(6_800_000);
    expect(r.normalized?.status).toBe("AVAILABLE");
  });

  it("flags missing unit number and invalid price", () => {
    const preview = buildImportPreview(CSV);
    expect(preview.total).toBe(5);
    expect(preview.valid).toBe(3);
    expect(preview.invalid).toBe(2);
    const missing = preview.rows.find((r) => r.index === 4);
    expect(missing?.errors.join(" ")).toMatch(/Missing Unit Number/);
    const badPrice = preview.rows.find((r) => r.index === 5);
    expect(badPrice?.errors.join(" ")).toMatch(/Invalid Price/);
  });

  it("detects duplicate unit numbers within the file", () => {
    const dup = `Unit Number,Unit Type,Price\nA-1,1BR,5000000\nA-1,1BR,5100000`;
    const preview = buildImportPreview(dup);
    expect(preview.invalid).toBe(1);
    expect(preview.rows[1].errors.join(" ")).toMatch(/Duplicate Unit Number/);
  });

  it("parses JSON input", () => {
    const json = JSON.stringify([{ unitNumber: "B-1", type: "2BR", price: 9400000, status: "available" }]);
    const preview = buildImportPreview(json);
    expect(preview.valid).toBe(1);
    expect(preview.rows[0].normalized?.unitType).toBe("2BR");
  });
});
