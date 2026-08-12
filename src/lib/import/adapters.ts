// Marketplace adapters (brief §19). Each source implements MarketplaceAdapter and
// is independently replaceable. The importer is NOT coupled to any one vendor.
//
// IMPORTANT (brief §13, §32): no adapter performs unauthorised scraping, auth
// bypass, or CAPTCHA circumvention. Automated/remote fetches only run when the
// source is explicitly marked `authorised`. The Meta adapter is a provider
// abstraction/mock — it is only "authorised" if an approved API token is present.

import { AdapterConfig, FetchResult, MarketplaceAdapter, RawListing } from "./types";

// --- CSV --------------------------------------------------------------------
function parseCSV(text: string): RawListing[] {
  const rows = splitCsvRows(text.trim());
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols) => {
    const rec: Record<string, unknown> = {};
    header.forEach((h, i) => (rec[normalizeKey(h)] = cols[i]?.trim()));
    return mapKeys(rec);
  });
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

// --- JSON -------------------------------------------------------------------
function parseJSON(text: string): RawListing[] {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : Array.isArray(data.listings) ? data.listings : Array.isArray(data.items) ? data.items : [data];
  return arr.map((r: Record<string, unknown>) => mapKeys(r));
}

// --- XML (lightweight, for simple <listing> feeds; no external dep) ----------
function parseXML(text: string): RawListing[] {
  const items = text.match(/<(listing|property|item)\b[\s\S]*?<\/\1>/gi) || [];
  return items.map((block) => {
    const rec: Record<string, unknown> = {};
    // Strip the outer wrapper tag so we extract the inner fields, not the whole item.
    const inner = block.replace(/^<(listing|property|item)\b[^>]*>/i, "").replace(/<\/(listing|property|item)>\s*$/i, "");
    const fieldRe = /<([a-zA-Z0-9_:-]+)>([\s\S]*?)<\/\1>/g;
    let m: RegExpExecArray | null;
    while ((m = fieldRe.exec(inner))) {
      const key = normalizeKey(m[1].replace(/^.*:/, ""));
      let val = m[2].trim().replace(/^<!\[CDATA\[|\]\]>$/g, "");
      if (rec[key] === undefined) rec[key] = val;
    }
    // collect <image>..</image> into images[]
    const imgs = [...block.matchAll(/<image[^>]*>([\s\S]*?)<\/image>/gi)].map((mm) => ({ url: mm[1].trim() }));
    if (imgs.length) rec.images = imgs;
    return mapKeys(rec);
  });
}

// --- key mapping (source field name variants -> RawListing keys) ------------
function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[\s_-]+/g, "");
}
const KEY_ALIASES: Record<string, string> = {
  id: "sourceListingId", listingid: "sourceListingId", ref: "sourceListingId",
  url: "sourceUrl", link: "sourceUrl", sourceurl: "sourceUrl",
  title: "title", name: "title", headline: "title",
  description: "description", desc: "description", details: "description",
  price: "price", amount: "price", askingprice: "price",
  currency: "currency",
  listingtype: "listingType", type: "propertyType", propertytype: "propertyType",
  offer: "listingType", saleorrent: "listingType", transaction: "listingType",
  address: "address", location: "address", street: "address",
  barangay: "barangay", brgy: "barangay",
  city: "city", municipality: "city", town: "city",
  province: "province",
  lat: "latitude", latitude: "latitude", lng: "longitude", lon: "longitude", longitude: "longitude",
  bedrooms: "bedrooms", beds: "bedrooms", br: "bedrooms",
  bathrooms: "bathrooms", baths: "bathrooms", ba: "bathrooms",
  floorarea: "floorArea", floor: "floorArea", sqm: "floorArea", livingarea: "floorArea",
  lotarea: "lotArea", lot: "lotArea", landsize: "lotArea",
  parking: "parking", garage: "parking", carport: "parking",
  images: "images", photos: "images", image: "images", photo: "images",
  phone: "contactPhone", contact: "contactPhone", mobile: "contactPhone", contactphone: "contactPhone",
  agent: "contactName", broker: "contactName", contactname: "contactName",
};
function mapKeys(rec: Record<string, unknown>): RawListing {
  const out: RawListing = {};
  for (const [k, v] of Object.entries(rec)) {
    const nk = normalizeKey(k);
    const target = KEY_ALIASES[nk] || nk;
    if (target === "images" && typeof v === "string") {
      out.images = v.split(/[|,;]/).map((u) => ({ url: u.trim() })).filter((i) => i.url);
    } else {
      (out as Record<string, unknown>)[target] = v;
    }
  }
  return out;
}

// --- concrete adapters ------------------------------------------------------

async function fetchText(url: string): Promise<string> {
  const timeout = Number(process.env.IMPORT_URL_FETCH_TIMEOUT_MS || 12000);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "RealEstateIloiloImporter/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export const csvAdapter: MarketplaceAdapter = {
  key: "CSV",
  label: "CSV upload / feed",
  isAuthorised: (c) => c.authorised !== false, // broker-provided data is authorised by upload
  async fetch(config) {
    try {
      const text = config.csv ?? (config.feedUrl ? await fetchText(config.feedUrl) : "");
      return { ok: true, records: parseCSV(text), attribution: config.attribution };
    } catch (e) {
      return { ok: false, records: [], error: (e as Error).message };
    }
  },
};

export const jsonAdapter: MarketplaceAdapter = {
  key: "JSON",
  label: "JSON feed",
  isAuthorised: (c) => c.authorised !== false,
  async fetch(config) {
    try {
      const text = config.json ?? (config.feedUrl ? await fetchText(config.feedUrl) : "[]");
      return { ok: true, records: parseJSON(text), attribution: config.attribution };
    } catch (e) {
      return { ok: false, records: [], error: (e as Error).message };
    }
  },
};

export const xmlAdapter: MarketplaceAdapter = {
  key: "XML",
  label: "XML feed",
  isAuthorised: (c) => c.authorised !== false,
  async fetch(config) {
    try {
      const text = config.xml ?? (config.feedUrl ? await fetchText(config.feedUrl) : "");
      return { ok: true, records: parseXML(text), attribution: config.attribution };
    } catch (e) {
      return { ok: false, records: [], error: (e as Error).message };
    }
  },
};

/** Partner/broker/developer feeds — same parsers, chosen by content-type/config. */
export const brokerFeedAdapter: MarketplaceAdapter = {
  key: "BROKER_FEED",
  label: "Broker / developer feed",
  isAuthorised: (c) => c.authorised === true, // partner feeds require an explicit agreement
  async fetch(config) {
    try {
      const text = config.feedUrl ? await fetchText(config.feedUrl) : config.json ?? config.xml ?? config.csv ?? "";
      const trimmed = text.trim();
      const records = trimmed.startsWith("<") ? parseXML(text) : trimmed.startsWith("[") || trimmed.startsWith("{") ? parseJSON(text) : parseCSV(text);
      return { ok: true, records, attribution: config.attribution };
    } catch (e) {
      return { ok: false, records: [], error: (e as Error).message };
    }
  },
};

/**
 * User-submitted single URL (brief §13C). Retrieves ONLY permitted metadata from
 * the page (Open Graph / JSON-LD / basic meta). It does not log into any account
 * and does not bypass access controls — if the page needs auth, it fails cleanly.
 */
export const manualUrlAdapter: MarketplaceAdapter = {
  key: "MANUAL_URL",
  label: "Paste a listing URL",
  isAuthorised: () => true, // the user asserts they are authorised to import this URL
  async fetch(config) {
    if (config.records) return { ok: true, records: config.records }; // test/mock injection
    if (!config.url) return { ok: false, records: [], error: "No URL provided" };
    try {
      const html = await fetchText(config.url);
      const rec = extractFromHtml(html, config.url);
      if (!rec) return { ok: false, records: [], error: "No importable metadata found on the page" };
      return { ok: true, records: [rec], attribution: `Imported from ${new URL(config.url).hostname}` };
    } catch (e) {
      return { ok: false, records: [], error: (e as Error).message };
    }
  },
};

/**
 * Meta / external marketplace adapter — PROVIDER ABSTRACTION ONLY (brief §13A, §32).
 * There is no Marketplace scraping here. It is "authorised" only when an approved
 * API token is configured; otherwise it returns an explicit unauthorised result.
 */
export const metaAdapter: MarketplaceAdapter = {
  key: "META",
  label: "Meta marketplace (official API)",
  isAuthorised: () => Boolean(process.env.META_MARKETPLACE_API_TOKEN),
  async fetch(config) {
    if (config.records) return { ok: true, records: config.records }; // mock/dev feed
    if (!process.env.META_MARKETPLACE_API_TOKEN) {
      return { ok: false, records: [], error: "Meta adapter not authorised: no approved API token configured. Unauthorised scraping is not supported." };
    }
    // Real implementation would call the approved Graph/Catalog endpoint here.
    return { ok: false, records: [], error: "Meta API integration not yet wired (add endpoint call)." };
  },
};

export function extractFromHtml(html: string, url: string): RawListing | null {
  const rec: RawListing = { sourceUrl: url };
  // JSON-LD first (schema.org Product/Place/Offer)
  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of ld) {
    try {
      const data = JSON.parse(m[1].trim());
      const nodes = Array.isArray(data) ? data : data["@graph"] || [data];
      for (const n of nodes) {
        if (n.name && !rec.title) rec.title = n.name;
        if (n.description && !rec.description) rec.description = n.description;
        const offer = n.offers || n.offer;
        if (offer?.price && !rec.price) rec.price = offer.price;
        if (offer?.priceCurrency && !rec.currency) rec.currency = offer.priceCurrency;
        const addr = n.address;
        if (addr?.addressLocality && !rec.city) rec.city = addr.addressLocality;
        if (addr?.streetAddress && !rec.address) rec.address = addr.streetAddress;
        const geo = n.geo;
        if (geo?.latitude && !rec.latitude) rec.latitude = geo.latitude;
        if (geo?.longitude && !rec.longitude) rec.longitude = geo.longitude;
        if (n.image && !rec.images) {
          const imgs = Array.isArray(n.image) ? n.image : [n.image];
          rec.images = imgs.map((u: string) => ({ url: u }));
        }
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  // Open Graph fallback
  const og = (p: string) => html.match(new RegExp(`<meta[^>]+property=["']og:${p}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1];
  if (!rec.title) rec.title = og("title") || html.match(/<title>([^<]+)<\/title>/i)?.[1];
  if (!rec.description) rec.description = og("description");
  if (!rec.images && og("image")) rec.images = [{ url: og("image")! }];
  if (!rec.title && !rec.price) return null;
  return rec;
}

export const ADAPTERS: Record<string, MarketplaceAdapter> = {
  META: metaAdapter,
  BROKER_FEED: brokerFeedAdapter,
  CSV: csvAdapter,
  JSON: jsonAdapter,
  XML: xmlAdapter,
  MANUAL_URL: manualUrlAdapter,
};

export function getAdapter(key: string): MarketplaceAdapter | undefined {
  return ADAPTERS[key];
}

export { parseCSV, parseJSON, parseXML, mapKeys };
