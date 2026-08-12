// Natural-language search (brief §6). A deterministic local parser turns a plain
// sentence like "3-bedroom house under ₱5M near Mandurriao with parking" into
// structured filters. When AI_PROVIDER=anthropic and a key is set, an LLM can be
// layered on top (see parseWithAI) — but the local parser is always the fallback
// so search works with zero external dependencies.

import { PROPERTY_TYPES, PropertyType, ListingType } from "./enums";
import { matchAreasInText } from "./iloilo";

export type ParsedQuery = {
  text: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  areas: string[]; // area names
  amenities: string[];
  criteria: { label: string; kind: "type" | "budget" | "location" | "beds" | "baths" | "amenity" | "listing" }[];
};

const TYPE_WORDS: [RegExp, PropertyType][] = [
  [/\btown\s?house(s)?\b/, "TOWNHOUSE"],
  [/\bcondo(minium)?s?\b/, "CONDO"],
  [/\bapartment(s)?|\bapt\b/, "APARTMENT"],
  [/\bwarehouse(s)?\b/, "WAREHOUSE"],
  [/\boffice(s)?\b/, "OFFICE"],
  [/\bcommercial\b/, "COMMERCIAL"],
  [/\bindustrial\b/, "INDUSTRIAL"],
  [/\bresort(s)?\b/, "RESORT"],
  [/\bfarm(s)?|\bland\b|\bagricultural\b/, "FARM"],
  [/\bbuilding(s)?\b/, "BUILDING"],
  [/\blot(s)?\b/, "LOT"],
  [/\bhouse(s)?|\bhome(s)?|\bbungalow\b/, "HOUSE"],
];

const AMENITY_WORDS = [
  "parking",
  "garage",
  "pool",
  "swimming pool",
  "furnished",
  "balcony",
  "garden",
  "security",
  "gym",
  "pet friendly",
  "near school",
  "near mall",
  "corner lot",
  "gated",
];

/** Parse a peso amount like "5M", "₱5,000,000", "5 million", "30k", "30,000". */
export function parsePeso(raw: string): number | undefined {
  const s = raw.toLowerCase().replace(/[₱,\s]/g, "");
  let m = s.match(/^(\d+(?:\.\d+)?)(m|million)$/);
  if (m) return Math.round(parseFloat(m[1]) * 1_000_000);
  m = s.match(/^(\d+(?:\.\d+)?)(k|thousand)$/);
  if (m) return Math.round(parseFloat(m[1]) * 1_000);
  m = s.match(/^(\d{4,})$/);
  if (m) return parseInt(m[1], 10);
  return undefined;
}

export function parseQuery(text: string): ParsedQuery {
  const q = text.toLowerCase();
  const parsed: ParsedQuery = { text, areas: [], amenities: [], criteria: [] };

  // Listing type
  if (/\bfor rent\b|\bto rent\b|\brental?\b|\blease\b|\/month|per month|monthly/.test(q)) {
    parsed.listingType = "RENT";
    parsed.criteria.push({ label: "For rent", kind: "listing" });
  } else if (/\bfor sale\b|\bto buy\b|\bbuy(ing)?\b|\bfor purchase\b/.test(q)) {
    parsed.listingType = "SALE";
    parsed.criteria.push({ label: "For sale", kind: "listing" });
  }

  // Property type (first match wins)
  for (const [re, type] of TYPE_WORDS) {
    if (re.test(q)) {
      parsed.propertyType = type;
      parsed.criteria.push({ label: labelForType(type), kind: "type" });
      break;
    }
  }

  // Budget: "under/below ₱5M", "over ₱2M", "between ₱2M and ₱5M", "₱30,000/month"
  const amountRe = /(?:₱\s?)?(\d[\d.,]*\s?(?:m|million|k|thousand)?)/gi;
  const between = q.match(/between\s+(.+?)\s+and\s+(.+?)(?:\b|$)/);
  if (between) {
    const lo = parsePeso(between[1]);
    const hi = parsePeso(between[2]);
    if (lo) parsed.minPrice = lo;
    if (hi) parsed.maxPrice = hi;
  } else {
    const under = q.match(/(?:under|below|less than|up to|max(?:imum)?|budget of|around)\s+([₱\d.,]+\s?(?:m|million|k|thousand)?)/);
    if (under) parsed.maxPrice = parsePeso(under[1]);
    const over = q.match(/(?:over|above|more than|min(?:imum)?|starting (?:at|from)|from)\s+([₱\d.,]+\s?(?:m|million|k|thousand)?)/);
    if (over) parsed.minPrice = parsePeso(over[1]);
    // bare "₱30,000/month" implies a rent max
    if (!parsed.maxPrice && !parsed.minPrice) {
      const bare = q.match(/₱\s?(\d[\d.,]*\s?(?:m|million|k|thousand)?)/);
      if (bare) parsed.maxPrice = parsePeso(bare[1]);
    }
  }
  amountRe.lastIndex = 0;
  if (parsed.maxPrice) parsed.criteria.push({ label: `Under ${compact(parsed.maxPrice)}`, kind: "budget" });
  if (parsed.minPrice) parsed.criteria.push({ label: `Over ${compact(parsed.minPrice)}`, kind: "budget" });

  // Bedrooms / bathrooms
  const beds = q.match(/(\d+)\s*-?\s*(?:bed(?:room)?s?|br\b|bedroom)/);
  if (beds) {
    parsed.bedrooms = parseInt(beds[1], 10);
    parsed.criteria.push({ label: `${parsed.bedrooms}+ beds`, kind: "beds" });
  }
  const baths = q.match(/(\d+)\s*-?\s*(?:bath(?:room)?s?|ba\b|toilet)/);
  if (baths) {
    parsed.bathrooms = parseInt(baths[1], 10);
    parsed.criteria.push({ label: `${parsed.bathrooms}+ baths`, kind: "baths" });
  }

  // Location(s)
  const areas = matchAreasInText(q);
  for (const a of areas) {
    parsed.areas.push(a.name);
    parsed.criteria.push({ label: a.name, kind: "location" });
  }

  // Amenities
  for (const am of AMENITY_WORDS) {
    if (q.includes(am)) {
      const norm = am === "garage" ? "parking" : am;
      if (!parsed.amenities.includes(norm)) {
        parsed.amenities.push(norm);
        parsed.criteria.push({ label: capitalize(norm), kind: "amenity" });
      }
    }
  }

  return parsed;
}

function labelForType(t: PropertyType): string {
  return capitalize(t.toLowerCase().replace("_", " "));
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function compact(n: number): string {
  if (n >= 1_000_000) return "₱" + (n / 1_000_000).toString().replace(/\.0$/, "") + "M";
  if (n >= 1_000) return "₱" + (n / 1_000).toString().replace(/\.0$/, "") + "K";
  return "₱" + n.toLocaleString("en-PH");
}

export const PROPERTY_TYPE_SET = new Set<string>(PROPERTY_TYPES);
