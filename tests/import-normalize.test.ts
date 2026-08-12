import { describe, it, expect } from "vitest";
import { normalize } from "@/lib/import/normalize";
import { parseCSV, parseJSON, parseXML, extractFromHtml, mapKeys } from "@/lib/import/adapters";

describe("normalize", () => {
  it("maps a raw feed record into a typed listing", () => {
    const n = normalize({
      title: "3BR House in Jaro",
      price: "4,850,000",
      propertyType: "Single Detached",
      listingType: "For Sale",
      city: "Jaro",
      bedrooms: "3",
      bathrooms: "2",
      floorArea: "140",
      sourceUrl: "https://partner.example.com/listing/1",
    });
    expect(n.price).toBe(4_850_000);
    expect(n.propertyType).toBe("HOUSE");
    expect(n.listingType).toBe("SALE");
    expect(n.city).toBe("Jaro");
    expect(n.bedrooms).toBe(3);
    expect(n.latitude).toBeTypeOf("number"); // filled from Jaro centroid
  });

  it("infers RENT from a low monthly price", () => {
    const n = normalize({ title: "Condo", price: 28000, propertyType: "condo", city: "Mandurriao" });
    expect(n.listingType).toBe("RENT");
  });

  it("records warnings for missing/ambiguous fields", () => {
    const n = normalize({ city: "Nowheresville" });
    expect(n.warnings.length).toBeGreaterThan(0);
    expect(n.warnings.join(" ")).toMatch(/price|Location|title/i);
  });

  it("defaults imported images to a rights-review state (never assumes reuse)", () => {
    const n = normalize({ title: "X", price: 1, city: "Jaro", images: [{ url: "https://x.com/a.jpg" }] });
    expect(n.images[0].rights).toBe("EXTERNAL_REF");
  });
});

describe("adapters / parsers", () => {
  it("parses CSV with aliased headers", () => {
    const rows = parseCSV("Title,Price,City,Beds\n\"House, nice\",5000000,Jaro,3");
    expect(rows[0].title).toBe("House, nice");
    expect(rows[0].bedrooms).toBe("3");
  });

  it("parses JSON arrays and {listings}", () => {
    expect(parseJSON('[{"name":"A","amount":1}]')[0].title).toBe("A");
    expect(parseJSON('{"listings":[{"headline":"B"}]}')[0].title).toBe("B");
  });

  it("parses a simple XML feed", () => {
    const xml = "<feed><listing><title>Lot in Pavia</title><price>2400000</price><city>Pavia</city></listing></feed>";
    const rows = parseXML(xml);
    expect(rows[0].title).toBe("Lot in Pavia");
    expect(rows[0].city).toBe("Pavia");
  });

  it("extracts metadata from JSON-LD + Open Graph", () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@type":"Product","name":"Jaro Home","offers":{"price":8900000,"priceCurrency":"PHP"}}</script>
      <meta property="og:image" content="https://x.com/p.jpg"></head></html>`;
    const rec = extractFromHtml(html, "https://x.com/listing/1");
    expect(rec?.title).toBe("Jaro Home");
    expect(rec?.price).toBe(8900000);
    expect(rec?.sourceUrl).toBe("https://x.com/listing/1");
  });

  it("maps assorted key aliases", () => {
    const r = mapKeys({ Ref: "9", Headline: "T", Amount: "1", Brgy: "Molo", BR: "2" });
    expect(r.sourceListingId).toBe("9");
    expect(r.title).toBe("T");
    expect(r.barangay).toBe("Molo");
    expect(r.bedrooms).toBe("2");
  });
});
