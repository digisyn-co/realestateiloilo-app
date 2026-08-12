/* eslint-disable no-console */
// Development seed data for Real Estate Iloilo (brief §33).
// Fictional data only. Photos reference /public/property-images (design assets);
// the UI degrades to a warm placeholder when a file is absent.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_AREAS, areaByName } from "../src/lib/iloilo";

const prisma = new PrismaClient();

const DEV_PASSWORD = "password123";

const AMENITIES = [
  "Parking", "Swimming Pool", "Furnished", "Balcony", "Garden", "Security", "Gym",
  "Backup Power", "Water Heater", "Gated", "Corner Lot", "Pet Friendly", "Near School",
  "Near Mall", "CCTV", "Maid's Room",
];

// Deterministic jitter around an area centroid (no RNG so seeds are reproducible).
function jitter(base: number, i: number, scale = 0.008) {
  return base + ((((i * 2654435761) % 1000) / 1000 - 0.5) * scale);
}

type Seed = {
  title: string; type: string; listingType: "SALE" | "RENT"; price: number;
  area: string; barangay: string; beds?: number; baths?: number; floor?: number; lot?: number;
  parking?: number; img: string; thumbs?: string[]; verified?: boolean; drop?: number; desc: string;
  amenities: string[]; agent: number; furnishing?: string; status?: string;
};

const LISTINGS: Seed[] = [
  { title: "Modern Executive House", type: "HOUSE", listingType: "SALE", price: 8_900_000, area: "Jaro", barangay: "Tabuc Suba", beds: 4, baths: 3, floor: 240, lot: 300, parking: 2, img: "a2.png", thumbs: ["a3.png", "a4.png"], verified: true, desc: "A striking contemporary home in Jaro with double-height living spaces, a chef's kitchen and a landscaped garden. Walking distance to Jaro Plaza and top schools.", amenities: ["Parking", "Garden", "Security", "Backup Power", "Near School"], agent: 0, furnishing: "SEMI_FURNISHED" },
  { title: "Modern 3-Bedroom Family Home", type: "HOUSE", listingType: "SALE", price: 4_850_000, area: "Mandurriao", barangay: "Hibao-an", beds: 3, baths: 2, floor: 140, lot: 180, parking: 1, img: "a1.png", thumbs: ["a5.png", "a6.png"], verified: true, drop: 6, desc: "Bright, efficient family home minutes from Iloilo Business Park and Festive Walk. Fully fenced with a covered carport and a compact garden.", amenities: ["Parking", "Security", "Near Mall", "Corner Lot"], agent: 1, furnishing: "UNFURNISHED" },
  { title: "Megaworld Condo — 1BR with City View", type: "CONDO", listingType: "SALE", price: 5_200_000, area: "Mandurriao", barangay: "San Rafael", beds: 1, baths: 1, floor: 38, parking: 1, img: "a7.png", verified: true, desc: "High-floor one-bedroom in Iloilo Business Park with sweeping city views, resort-style amenities and 24/7 security. Ideal for professionals or investors.", amenities: ["Parking", "Swimming Pool", "Gym", "Security", "Near Mall"], agent: 1, furnishing: "FURNISHED" },
  { title: "Condo for Rent near Festive Walk", type: "CONDO", listingType: "RENT", price: 28_000, area: "Mandurriao", barangay: "San Rafael", beds: 1, baths: 1, floor: 34, parking: 1, img: "a8.png", verified: true, desc: "Fully furnished studio-plus in the heart of the business district. Steps from Festive Walk, restaurants and offices. Inclusive of association dues.", amenities: ["Furnished", "Swimming Pool", "Gym", "Security", "Near Mall"], agent: 2, furnishing: "FURNISHED" },
  { title: "Townhouse in La Paz", type: "TOWNHOUSE", listingType: "SALE", price: 3_650_000, area: "La Paz", barangay: "Burgos-Mabini-Plaza", beds: 3, baths: 2, floor: 110, lot: 88, parking: 1, img: "a9.png", verified: true, desc: "Well-kept townhouse near La Paz Public Market and the university belt. Solid, low-maintenance and rental-ready.", amenities: ["Parking", "Security", "Near School"], agent: 0, furnishing: "UNFURNISHED" },
  { title: "Residential Lot in Pavia", type: "LOT", listingType: "SALE", price: 2_400_000, area: "Pavia", barangay: "Ungka", floor: undefined, lot: 200, img: "a10.png", verified: false, desc: "Clean-title residential lot inside a gated subdivision in Pavia, minutes from the highway and Iloilo City. Ready to build.", amenities: ["Gated", "Corner Lot"], agent: 3, status: "ACTIVE" },
  { title: "Beach House in Oton", type: "HOUSE", listingType: "SALE", price: 6_200_000, area: "Oton", barangay: "Cabanbanan", beds: 3, baths: 2, floor: 160, lot: 400, parking: 2, img: "a11.png", thumbs: ["a12.png"], verified: true, desc: "Relaxed coastal home with a large lot and sea breeze, perfect for weekends or a permanent move out of the city.", amenities: ["Parking", "Garden", "Pet Friendly"], agent: 2, furnishing: "SEMI_FURNISHED" },
  { title: "Commercial Space in City Proper", type: "COMMERCIAL", listingType: "RENT", price: 65_000, area: "City Proper", barangay: "Iznart", floor: 120, parking: 2, img: "a13.png", verified: true, desc: "Ground-floor commercial unit along a busy street in the downtown core. High foot traffic, suitable for retail, clinic or cafe.", amenities: ["Parking", "CCTV", "Near Mall"], agent: 4 },
  { title: "House and Lot in Santa Barbara", type: "HOUSE", listingType: "SALE", price: 3_950_000, area: "Santa Barbara", barangay: "Cabugao", beds: 3, baths: 2, floor: 120, lot: 150, parking: 1, img: "a14.png", verified: false, drop: 4, desc: "Brand-new house and lot in a master-planned community near the Iloilo airport. Modern finishes and flexible payment terms.", amenities: ["Parking", "Gated", "Backup Power"], agent: 3, furnishing: "UNFURNISHED" },
  { title: "Apartment for Rent in Molo", type: "APARTMENT", listingType: "RENT", price: 15_000, area: "Molo", barangay: "San Antonio", beds: 2, baths: 1, floor: 55, img: "a15.png", verified: true, desc: "Neat two-bedroom apartment near Molo Church and Plaza. Quiet, well-lit and close to schools and markets.", amenities: ["Security", "Near School", "Water Heater"], agent: 0 },
  { title: "Warehouse in Leganes", type: "WAREHOUSE", listingType: "RENT", price: 120_000, area: "Leganes", barangay: "Guihaman", floor: 800, parking: 4, img: "a16.png", verified: true, desc: "Spacious warehouse with high clearance and container access along the Leganes industrial corridor. Ready for occupancy.", amenities: ["CCTV", "Backup Power", "Gated"], agent: 4 },
  { title: "Farm Lot in Cabatuan", type: "FARM", listingType: "SALE", price: 4_100_000, area: "Cabatuan", barangay: "Tabucan", lot: 5000, img: "b1.png", verified: false, desc: "Productive agricultural land with road frontage and water access. Suited to rice, high-value crops or a rest house.", amenities: ["Corner Lot"], agent: 3 },
  { title: "Luxury House in Jaro", type: "HOUSE", listingType: "SALE", price: 14_500_000, area: "Jaro", barangay: "Sambag", beds: 5, baths: 4, floor: 380, lot: 450, parking: 3, img: "b2.png", thumbs: ["b3.png", "b4.png"], verified: true, desc: "An elegant estate home in one of Jaro's premier enclaves, with a pool, home office and staff quarters. Impeccably maintained.", amenities: ["Parking", "Swimming Pool", "Garden", "Security", "Maid's Room", "Backup Power"], agent: 0, furnishing: "FURNISHED" },
  { title: "Studio Condo for Rent — Smallville", type: "CONDO", listingType: "RENT", price: 18_500, area: "Mandurriao", barangay: "Bolilao", beds: 1, baths: 1, floor: 28, parking: 1, img: "b5.png", verified: true, desc: "Fully furnished studio in the Smallville complex, surrounded by dining and nightlife. Great for young professionals.", amenities: ["Furnished", "Security", "Near Mall", "Gym"], agent: 2, furnishing: "FURNISHED" },
  { title: "Office Space in Iloilo Business Park", type: "OFFICE", listingType: "RENT", price: 95_000, area: "Mandurriao", barangay: "San Rafael", floor: 180, parking: 3, img: "b6.png", verified: true, desc: "Fitted office space in a Grade-A building at Iloilo Business Park, with backup power and fibre-ready connectivity.", amenities: ["Parking", "Backup Power", "CCTV", "Security"], agent: 4 },
  { title: "Affordable House in Oton", type: "HOUSE", listingType: "SALE", price: 2_150_000, area: "Oton", barangay: "Trapiche", beds: 2, baths: 1, floor: 70, lot: 100, parking: 1, img: "b7.png", verified: false, desc: "Entry-level house and lot ideal for first-time buyers or OFW families. Inside a secured subdivision with wide roads.", amenities: ["Parking", "Gated"], agent: 3, furnishing: "UNFURNISHED" },
];

async function main() {
  console.log("Seeding Real Estate Iloilo…");
  await reset();

  const pw = await bcrypt.hash(DEV_PASSWORD, 10);

  // Amenities
  await prisma.amenity.createMany({ data: AMENITIES.map((name) => ({ name })) });
  const amenityByName = new Map((await prisma.amenity.findMany()).map((a) => [a.name, a.id]));

  // Admin + buyers
  const admin = await prisma.user.create({ data: { name: "Ava Reyes", email: "admin@realestateiloilo.app", phone: "+63 917 000 0001", role: "ADMIN", passwordHash: pw, verificationStatus: "VERIFIED", avatarUrl: "/property-images/broker.png" } });
  const buyer = await prisma.user.create({ data: { name: "Marco Tan", email: "buyer@realestateiloilo.app", phone: "+63 917 111 2233", role: "BUYER", passwordHash: pw, verificationStatus: "VERIFIED" } });
  await prisma.user.create({ data: { name: "Liza Gonzales", email: "owner@realestateiloilo.app", phone: "+63 918 555 7788", role: "OWNER", passwordHash: pw } });

  // Agents / brokers
  const agentSeeds = [
    { name: "Carla Ledesma", email: "carla@ilonggorealty.ph", company: "Ilonggo Realty & Co.", prc: "0034129", bio: "Licensed broker specialising in Jaro and Mandurriao homes for 11 years. I only list what I would buy myself — every property verified before it goes live.", role: "BROKER" },
    { name: "Jerome Salcedo", email: "jerome@bizpark-properties.ph", company: "BizPark Properties", prc: "0041887", bio: "Condo and investment specialist covering Iloilo Business Park and Smallville.", role: "BROKER" },
    { name: "Nadia Ferrer", email: "nadia@coastlinerealty.ph", company: "Coastline Realty", prc: "0038204", bio: "Helping families find homes across Molo, Oton and the coastal towns.", role: "BROKER" },
    { name: "Paolo Villanueva", email: "paolo@westvisayasland.ph", company: "West Visayas Land", prc: "0045511", bio: "Lots, farms and house-and-lot developments in Pavia, Santa Barbara and Cabatuan.", role: "BROKER" },
    { name: "Grace Uy", email: "grace@metrocommercial.ph", company: "Metro Commercial Iloilo", prc: "0039920", bio: "Commercial, office and industrial leasing across Iloilo City.", role: "BROKER" },
  ];
  const agents: Array<Awaited<ReturnType<typeof prisma.user.create>> & { agent: { id: string } | null }> = [];
  for (const a of agentSeeds) {
    const user = await prisma.user.create({
      data: {
        name: a.name, email: a.email, phone: "+63 917 222 " + (3000 + agents.length), role: a.role, passwordHash: pw,
        verificationStatus: "VERIFIED", avatarUrl: "/property-images/broker.png",
        agent: { create: { company: a.company, licenseNumber: a.prc, bio: a.bio, verified: true, contactEmail: a.email, responseTime: "about 2 hours" } },
      },
      include: { agent: true },
    });
    agents.push(user);
  }

  // Reviews
  const reviewText = [
    { authorName: "Diane M.", rating: 5, text: "Carla was upfront about everything and the listing matched the photos exactly. Closed within a month." },
    { authorName: "Rex P.", rating: 5, text: "Responsive and knowledgeable. Made buying our first home stress-free." },
    { authorName: "Ana L.", rating: 4, text: "Great experience overall, would recommend to friends looking in Jaro." },
  ];
  for (const r of reviewText) await prisma.agentReview.create({ data: { agentId: agents[0].agent!.id, ...r } });

  // Listings
  const created: { id: string; seed: Seed }[] = [];
  for (let i = 0; i < LISTINGS.length; i++) {
    const s = LISTINGS[i];
    const area = areaByName(s.area);
    const agentUser = agents[s.agent];
    const publishedAt = new Date(Date.now() - (i + 1) * 3 * 86_400_000);
    const property = await prisma.property.create({
      data: {
        title: s.title, description: s.desc, propertyType: s.type,
        address: `${s.barangay}, ${s.area}`, barangay: s.barangay, city: s.area, province: "Iloilo",
        latitude: area ? jitter(area.lat, i) : undefined, longitude: area ? jitter(area.lng, i, 0.01) : undefined,
        bedrooms: s.beds, bathrooms: s.baths, floorArea: s.floor, lotArea: s.lot, parking: s.parking,
        furnishing: s.furnishing,
        amenities: { create: s.amenities.map((n) => ({ amenity: { connect: { id: amenityByName.get(n)! } } })).filter((x) => x.amenity.connect.id) },
      },
    });
    const images = [s.img, ...(s.thumbs || [])];
    const listing = await prisma.listing.create({
      data: {
        propertyId: property.id, agentId: agentUser.agent!.id, listingType: s.listingType, price: s.price,
        priceDropPct: s.drop, status: s.status || "ACTIVE",
        verificationStatus: s.verified ? "VERIFIED" : "UNVERIFIED", verifiedNote: s.verified ? "Broker-verified" : null,
        importMethod: "NATIVE", publishedAt, sourceLastSeenAt: publishedAt, lastVerifiedAt: s.verified ? publishedAt : null,
        expiresAt: new Date(Date.now() + 60 * 86_400_000),
        images: { create: images.map((u, idx) => ({ url: `/property-images/${u}`, source: "ORIGINAL_UPLOAD", rightsStatus: "OWNED", sortOrder: idx })) },
      },
    });
    created.push({ id: listing.id, seed: s });

    // some views for analytics
    for (let v = 0; v < (LISTINGS.length - i) * 7; v++) {
      await prisma.propertyView.create({ data: { listingId: listing.id, source: v % 3 === 0 ? "app" : "web", createdAt: new Date(Date.now() - v * 3_600_000) } });
    }
  }

  // Saved + inquiries + threads
  for (const idx of [0, 2, 4]) {
    await prisma.savedProperty.create({ data: { userId: buyer.id, listingId: created[idx].id, collection: idx === 4 ? "Shortlist" : "All" } });
  }
  const inq = await prisma.inquiry.create({
    data: { listingId: created[1].id, fromUserId: buyer.id, name: buyer.name, email: buyer.email, phone: buyer.phone, message: "Hi, is this still available? Can we schedule a viewing this weekend?", channel: "MESSAGE", status: "NEW" },
  });
  await prisma.lead.create({ data: { agentId: agents[1].agent!.id, listingId: created[1].id, inquiryId: inq.id, name: buyer.name, contact: buyer.phone, stage: "NEW", note: "Weekend viewing requested" } });
  await prisma.lead.create({ data: { agentId: agents[1].agent!.id, listingId: created[2].id, name: "Ellen Sy", contact: "+63 917 888 1200", stage: "VIEWING", note: "Second viewing booked" } });
  await prisma.lead.create({ data: { agentId: agents[1].agent!.id, listingId: created[3].id, name: "Kevin Ang", contact: "+63 920 456 7788", stage: "OFFER", note: "Offer at ₱27k/mo" } });

  const thread = await prisma.thread.create({ data: { buyerId: buyer.id, agentId: agents[1].agent!.id, listingId: created[1].id } });
  await prisma.message.create({ data: { threadId: thread.id, senderId: buyer.id, body: "Hi Jerome, is the Mandurriao home still available?" } });
  await prisma.message.create({ data: { threadId: thread.id, senderId: agents[1].id, body: "Yes! Would this Saturday 10am work for a viewing?" } });

  // Reports
  await prisma.report.create({ data: { listingId: created[5].id, reporterId: buyer.id, reason: "WRONG_INFO", detail: "The lot area looks larger than the actual title.", status: "OPEN" } });

  // Notifications
  await prisma.notification.create({ data: { userId: agents[0].id, type: "INQUIRY", title: "New inquiry on Modern Executive House", body: "Marco Tan asked about a weekend viewing.", href: "/dashboard/leads" } });
  await prisma.notification.create({ data: { userId: buyer.id, type: "STATUS_CHANGED", title: "Price drop on a saved home", body: "Modern 3-Bedroom Family Home dropped 6%.", href: "/saved" } });

  await seedImports(admin.id, agents[0].agent!.id, created);

  console.log(`Seeded ${created.length} listings, ${agents.length} brokers, admin + buyers.`);
  console.log(`Login: admin@realestateiloilo.app / carla@ilonggorealty.ph / buyer@realestateiloilo.app — password: ${DEV_PASSWORD}`);
}

async function seedImports(adminId: string, agentId: string, created: { id: string; seed: Seed }[]) {
  // An authorised broker CSV feed + a manual-URL source.
  const csvSource = await prisma.importSource.create({
    data: { name: "Ilonggo Realty CSV feed", adapter: "CSV", ownerAgentId: agentId, authorised: true, automated: true, schedule: "DAILY", attribution: "Ilonggo Realty & Co.", lastSyncAt: new Date(Date.now() - 6 * 3_600_000), nextSyncAt: new Date(Date.now() + 18 * 3_600_000) },
  });
  const manualSource = await prisma.importSource.create({
    data: { name: "Manual URL imports", adapter: "MANUAL_URL", authorised: true, automated: false, schedule: "MANUAL", attribution: "Broker-submitted URLs" },
  });
  // A Meta provider-abstraction source that is NOT authorised (no API token).
  await prisma.importSource.create({
    data: { name: "Meta marketplace (unconfigured)", adapter: "META", authorised: false, automated: false, schedule: "MANUAL", attribution: "Requires approved Meta API access" },
  });

  const job = await prisma.importJob.create({
    data: { sourceId: csvSource.id, initiatorId: adminId, status: "COMPLETED", trigger: "SCHEDULED", discovered: 3, updated: 3, skipped: 0, duplicates: 1, errors: 0, startedAt: new Date(Date.now() - 6 * 3_600_000), finishedAt: new Date(Date.now() - 6 * 3_600_000 + 4000), log: JSON.stringify(["Fetched 3 raw record(s) via CSV upload / feed", "Record \"3BR House in Jaro (agent copy)\" → 88% match with existing listing", "2 record(s) queued for review"]) },
  });

  // NEEDS_REVIEW record
  const rec1Norm = { title: "Renovated Bungalow in La Paz", description: "Recently renovated 3BR bungalow near the university belt.", price: 3_800_000, currency: "PHP", listingType: "SALE", propertyType: "HOUSE", city: "La Paz", barangay: "Nabitasan", province: "Iloilo", bedrooms: 3, bathrooms: 2, floorArea: 115, lotArea: 120, images: [{ url: "https://example.com/photos/lapaz-1.jpg", rights: "EXTERNAL_REF" }], warnings: [], sourceUrl: "https://partner.example.com/listing/9921", contactPhone: "+63 917 445 9921" };
  await prisma.importRecord.create({
    data: { jobId: job.id, sourceId: csvSource.id, raw: JSON.stringify({ title: rec1Norm.title, price: "3,800,000", city: "La Paz", type: "House" }), normalized: JSON.stringify(rec1Norm), sourceUrl: rec1Norm.sourceUrl, sourceListingId: "9921", status: "NEEDS_REVIEW", rightsFlag: "NEEDS_PERMISSION", reviewNote: "Contains external images requiring rights confirmation" },
  });

  // DUPLICATE record (matches created[0] Modern Executive House in Jaro)
  const dupNorm = { title: "3BR House in Jaro (agent copy)", description: "Executive home in Jaro, 4 bedrooms, 3 baths.", price: 8_950_000, currency: "PHP", listingType: "SALE", propertyType: "HOUSE", city: "Jaro", barangay: "Tabuc Suba", province: "Iloilo", bedrooms: 4, bathrooms: 3, floorArea: 238, lotArea: 300, images: [{ url: "https://example.com/photos/jaro-dup.jpg", rights: "EXTERNAL_REF" }], warnings: [], sourceUrl: "https://partner.example.com/listing/8810", contactPhone: "+63 917 222 3000" };
  const dupRec = await prisma.importRecord.create({
    data: { jobId: job.id, sourceId: csvSource.id, raw: JSON.stringify({ title: dupNorm.title, price: "8,950,000", city: "Jaro" }), normalized: JSON.stringify(dupNorm), sourceUrl: dupNorm.sourceUrl, sourceListingId: "8810", status: "DUPLICATE", dupConfidence: 88, dupListingId: created[0].id, rightsFlag: "NEEDS_PERMISSION", reviewNote: "88% likely duplicate of an existing Jaro listing" },
  });
  await prisma.duplicateMatch.create({
    data: { recordId: dupRec.id, listingAId: created[0].id, confidence: 88, signals: JSON.stringify([{ signal: "geo", contribution: 0.16 }, { signal: "price", contribution: 0.10 }, { signal: "beds", contribution: 0.05 }, { signal: "title", contribution: 0.04 }]) },
  });

  await prisma.notification.create({ data: { userId: adminId, type: "DUPLICATE_DETECTED", title: "Possible duplicate detected", body: "An imported Jaro listing is 88% likely a duplicate.", href: "/admin/duplicates" } });
  await prisma.auditLog.create({ data: { actorId: adminId, action: "IMPORT_JOB_COMPLETED", entity: "ImportJob", entityId: job.id, meta: JSON.stringify({ discovered: 3, duplicates: 1 }) } });
}

async function reset() {
  // Order matters for FK constraints.
  const tables = [
    "duplicateMatch", "importRecord", "importJob", "importSource", "auditLog", "notification",
    "propertyView", "viewingRequest", "message", "thread", "lead", "inquiry", "report",
    "savedProperty", "listingImage", "listing", "propertyAmenity", "amenity", "property",
    "agentReview", "agent", "user",
  ] as const;
  for (const t of tables) {
    // @ts-expect-error dynamic model access
    await prisma[t].deleteMany();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
