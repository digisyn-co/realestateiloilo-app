// Bulk unit import (brief §9). Parses CSV/JSON, normalises, and validates each
// row so the UI can show a preview with per-row errors before committing.

import { UNIT_STATUS, UNIT_TYPES, UnitStatus, UnitType } from "../enums";

export type RawUnitRow = Record<string, string>;

export type NormalizedUnit = {
  building?: string;
  unitNumber: string;
  floor?: number;
  unitType: UnitType;
  bedrooms?: number;
  bathrooms?: number;
  floorArea?: number;
  price: number;
  status: UnitStatus;
  parking?: number;
  orientation?: string;
};

export type RowResult = { index: number; raw: RawUnitRow; normalized?: NormalizedUnit; errors: string[] };
export type ImportPreview = { total: number; valid: number; invalid: number; rows: RowResult[] };

const KEY_ALIASES: Record<string, keyof NormalizedUnit> = {
  building: "building",
  unitnumber: "unitNumber",
  unit: "unitNumber",
  unitno: "unitNumber",
  floor: "floor",
  unittype: "unitType",
  type: "unitType",
  bedrooms: "bedrooms",
  beds: "bedrooms",
  br: "bedrooms",
  bathrooms: "bathrooms",
  baths: "bathrooms",
  floorarea: "floorArea",
  area: "floorArea",
  sqm: "floorArea",
  price: "price",
  status: "status",
  parking: "parking",
  orientation: "orientation",
};

function normKey(k: string): string {
  return k.toLowerCase().replace(/[\s_()-]+/g, "");
}

export function parseUnitsCsv(text: string): RawUnitRow[] {
  const rows = splitCsvRows(text.trim());
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols) => {
    const rec: RawUnitRow = {};
    header.forEach((h, i) => (rec[h.trim()] = (cols[i] ?? "").trim()));
    return rec;
  });
}

export function parseUnitsJson(text: string): RawUnitRow[] {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : Array.isArray(data.units) ? data.units : [data];
  return arr.map((r: Record<string, unknown>) => {
    const rec: RawUnitRow = {};
    for (const [k, v] of Object.entries(r)) rec[k] = v == null ? "" : String(v);
    return rec;
  });
}

export function parseUnitsFile(text: string, format: "csv" | "json" | "auto" = "auto"): RawUnitRow[] {
  const trimmed = text.trim();
  const fmt = format === "auto" ? (trimmed.startsWith("[") || trimmed.startsWith("{") ? "json" : "csv") : format;
  return fmt === "json" ? parseUnitsJson(text) : parseUnitsCsv(text);
}

function num(v: string | undefined): number | undefined {
  if (v == null || v.trim() === "") return undefined;
  const n = Number(v.replace(/[₱,\s]/g, "").replace(/m²|sqm/i, ""));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeUnitType(v?: string): UnitType | undefined {
  if (!v) return undefined;
  const s = v.toUpperCase().replace(/\s+/g, "");
  if (UNIT_TYPES.includes(s as UnitType)) return s as UnitType;
  if (/STUDIO/.test(s)) return "STUDIO";
  if (/^1|ONE/.test(s) && /BR|BED/.test(s)) return "1BR";
  if (/^2|TWO/.test(s) && /BR|BED/.test(s)) return "2BR";
  if (/^3|THREE/.test(s) && /BR|BED/.test(s)) return "3BR";
  if (/PENTHOUSE/.test(s)) return "PENTHOUSE";
  if (/LOFT/.test(s)) return "LOFT";
  if (/TOWN/.test(s)) return "TOWNHOUSE";
  if (/LOT/.test(s)) return "LOT";
  if (/COMMERCIAL|RETAIL|OFFICE/.test(s)) return "COMMERCIAL";
  return undefined;
}

function normalizeStatus(v?: string): UnitStatus {
  if (!v) return "AVAILABLE";
  const s = v.toUpperCase().replace(/\s+/g, "_");
  if (UNIT_STATUS.includes(s as UnitStatus)) return s as UnitStatus;
  if (/AVAIL/.test(s)) return "AVAILABLE";
  if (/RESERV/.test(s)) return "RESERVED";
  if (/SOLD/.test(s)) return "SOLD";
  if (/HOLD/.test(s)) return "ON_HOLD";
  if (/CONTRACT/.test(s)) return "UNDER_CONTRACT";
  return "UNAVAILABLE";
}

export function validateUnitRow(raw: RawUnitRow, index: number): RowResult {
  const errors: string[] = [];
  const mapped: Partial<NormalizedUnit> = {};
  for (const [k, v] of Object.entries(raw)) {
    const target = KEY_ALIASES[normKey(k)];
    if (target) (mapped as Record<string, unknown>)[target] = v;
  }

  const unitNumber = (mapped.unitNumber as string | undefined)?.trim();
  if (!unitNumber) errors.push("Missing Unit Number");

  const price = num(mapped.price as string | undefined);
  if (price == null) errors.push("Invalid Price");
  else if (price <= 0) errors.push("Price must be greater than zero");

  const unitType = normalizeUnitType(mapped.unitType as string | undefined);
  if (!unitType) errors.push(`Unrecognised Unit Type: ${mapped.unitType ?? "(none)"}`);

  const normalized: NormalizedUnit | undefined =
    errors.length === 0
      ? {
          building: (mapped.building as string | undefined)?.trim() || undefined,
          unitNumber: unitNumber!,
          floor: num(mapped.floor as string | undefined),
          unitType: unitType!,
          bedrooms: num(mapped.bedrooms as string | undefined),
          bathrooms: num(mapped.bathrooms as string | undefined),
          floorArea: num(mapped.floorArea as string | undefined),
          price: price!,
          status: normalizeStatus(mapped.status as string | undefined),
          parking: num(mapped.parking as string | undefined),
          orientation: (mapped.orientation as string | undefined)?.trim() || undefined,
        }
      : undefined;

  return { index, raw, normalized, errors };
}

export function buildImportPreview(text: string, format: "csv" | "json" | "auto" = "auto"): ImportPreview {
  const rows = parseUnitsFile(text, format);
  const results = rows.map((r, i) => validateUnitRow(r, i + 1));
  // duplicate unit numbers within the file are flagged too
  const seen = new Map<string, number>();
  for (const r of results) {
    const n = r.normalized?.unitNumber?.toLowerCase();
    if (!n) continue;
    if (seen.has(n)) r.errors.push(`Duplicate Unit Number in file (also row ${seen.get(n)})`);
    else seen.set(n, r.index);
  }
  const invalid = results.filter((r) => r.errors.length > 0).length;
  return { total: results.length, valid: results.length - invalid, invalid, rows: results };
}

function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
