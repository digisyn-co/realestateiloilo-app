// Duplicate detection (brief §15). A weighted, multi-signal confidence score.
// Same property may appear across brokers / sites / agents; we score a candidate
// against existing listings and surface Merge / Separate / Ignore decisions.
// High-value matches are NEVER auto-merged (brief §15) — this only scores.

import { NormalizedListing } from "./types";

export type DupCandidate = {
  id: string;
  title: string;
  price: number;
  propertyType: string;
  city: string;
  barangay?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floorArea?: number | null;
  lotArea?: number | null;
  contactPhone?: string | null;
  sourceUrl?: string | null;
  imageUrls?: string[];
};

export type SignalScore = { signal: string; weight: number; score: number; contribution: number; note?: string };

export type DupResult = {
  confidence: number; // 0..100
  signals: SignalScore[];
  verdict: "STRONG" | "LIKELY" | "WEAK" | "NONE";
};

// Signal weights sum to 1. Tune via admin "duplicate detection sensitivity".
const WEIGHTS = {
  sourceUrl: 0.14,
  phone: 0.13,
  geo: 0.16,
  address: 0.12,
  price: 0.11,
  floorArea: 0.08,
  lotArea: 0.06,
  beds: 0.05,
  baths: 0.04,
  type: 0.05,
  title: 0.06,
};

export function scoreDuplicate(a: NormalizedListing, b: DupCandidate): DupResult {
  const signals: SignalScore[] = [];
  const add = (signal: string, weight: number, score: number, note?: string) => {
    signals.push({ signal, weight, score, contribution: weight * score, note });
  };

  // Exact source URL → almost certainly the same underlying listing.
  add("sourceUrl", WEIGHTS.sourceUrl, a.sourceUrl && b.sourceUrl ? (normUrl(a.sourceUrl) === normUrl(b.sourceUrl) ? 1 : 0) : 0);

  // Phone number match.
  add("phone", WEIGHTS.phone, phoneMatch(a.contactPhone, b.contactPhone));

  // Geospatial proximity (within ~120m ≈ same building/lot).
  add("geo", WEIGHTS.geo, geoScore(a.latitude, a.longitude, b.latitude ?? undefined, b.longitude ?? undefined));

  // Address / barangay text similarity.
  add("address", WEIGHTS.address, textSim(joinAddr(a.address, a.barangay, a.city), joinAddr(b.address, b.barangay, b.city)));

  // Price closeness.
  add("price", WEIGHTS.price, numCloseness(a.price, b.price, 0.05));

  // Areas.
  add("floorArea", WEIGHTS.floorArea, numCloseness(a.floorArea, b.floorArea ?? undefined, 0.05));
  add("lotArea", WEIGHTS.lotArea, numCloseness(a.lotArea, b.lotArea ?? undefined, 0.05));

  // Beds / baths exact.
  add("beds", WEIGHTS.beds, exactNum(a.bedrooms, b.bedrooms ?? undefined));
  add("baths", WEIGHTS.baths, exactNum(a.bathrooms, b.bathrooms ?? undefined));

  // Property type.
  add("type", WEIGHTS.type, a.propertyType && b.propertyType ? (a.propertyType === b.propertyType ? 1 : 0) : 0);

  // Title similarity (token Jaccard).
  add("title", WEIGHTS.title, textSim(a.title, b.title));

  const confidence = Math.round(signals.reduce((s, x) => s + x.contribution, 0) * 100);
  const verdict = confidence >= 85 ? "STRONG" : confidence >= 65 ? "LIKELY" : confidence >= 40 ? "WEAK" : "NONE";
  return { confidence, signals, verdict };
}

/** Best duplicate across a set of candidates. */
export function bestDuplicate(a: NormalizedListing, candidates: DupCandidate[]): { candidate: DupCandidate; result: DupResult } | null {
  let best: { candidate: DupCandidate; result: DupResult } | null = null;
  for (const c of candidates) {
    const result = scoreDuplicate(a, c);
    if (!best || result.confidence > best.result.confidence) best = { candidate: c, result };
  }
  return best && best.result.confidence >= 40 ? best : null;
}

// --- signal helpers --------------------------------------------------------

function normUrl(u: string): string {
  return u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/[?#].*$/, "");
}

export function normPhone(p?: string | null): string {
  if (!p) return "";
  let d = p.replace(/\D/g, "");
  if (d.startsWith("0")) d = "63" + d.slice(1); // PH local → +63
  if (d.length === 10 && d.startsWith("9")) d = "63" + d;
  return d.slice(-11);
}
function phoneMatch(a?: string | null, b?: string | null): number {
  const na = normPhone(a);
  const nb = normPhone(b);
  return na && nb && na === nb ? 1 : 0;
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function geoScore(lat1?: number, lng1?: number, lat2?: number, lng2?: number): number {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0;
  const m = haversineMeters(lat1, lng1, lat2, lng2);
  if (m <= 40) return 1;
  if (m >= 500) return 0;
  return 1 - (m - 40) / 460;
}

export function numCloseness(a?: number, b?: number, tol = 0.05): number {
  if (a == null || b == null || a === 0 || b === 0) return 0;
  const diff = Math.abs(a - b) / Math.max(a, b);
  if (diff <= tol) return 1;
  if (diff >= tol * 6) return 0;
  return 1 - (diff - tol) / (tol * 5);
}
function exactNum(a?: number, b?: number): number {
  if (a == null || b == null) return 0;
  return a === b ? 1 : 0;
}

export function textSim(a?: string, b?: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach((t) => tb.has(t) && inter++);
  return inter / (ta.size + tb.size - inter); // Jaccard
}
function tokens(s?: string): Set<string> {
  if (!s) return new Set();
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}
function joinAddr(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
