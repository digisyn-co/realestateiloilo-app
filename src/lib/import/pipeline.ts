// Import pipeline orchestrator (brief §13–19). Stages are independent:
//   fetch -> parse (adapter) -> normalize -> image rights -> dedupe ->
//   compliance/permission check -> Review Queue (ImportRecord)
// Nothing is auto-published (brief §14). Publishing is an explicit reviewer action.

import { prisma } from "../db";
import { getAdapter } from "./adapters";
import { normalize } from "./normalize";
import { bestDuplicate, DupCandidate } from "./dedupe";
import { AdapterConfig } from "./types";
import { NormalizedListing } from "./types";

export type ImportJobResult = {
  jobId: string;
  status: "COMPLETED" | "FAILED" | "PARTIAL";
  discovered: number;
  updated: number;
  skipped: number;
  duplicates: number;
  errors: number;
  log: string[];
};

/** Pull existing listings as duplicate candidates (kept small for local dev). */
async function loadDupCandidates(): Promise<DupCandidate[]> {
  const listings = await prisma.listing.findMany({
    where: { status: { in: ["ACTIVE", "RESERVED", "PENDING_REVIEW"] } },
    include: { property: true, images: { select: { url: true } } },
    take: 500,
  });
  return listings.map((l) => ({
    id: l.id,
    title: l.property.title,
    price: l.price,
    propertyType: l.property.propertyType,
    city: l.property.city,
    barangay: l.property.barangay,
    address: l.property.address,
    latitude: l.property.latitude,
    longitude: l.property.longitude,
    bedrooms: l.property.bedrooms,
    bathrooms: l.property.bathrooms,
    floorArea: l.property.floorArea,
    lotArea: l.property.lotArea,
    contactPhone: null,
    sourceUrl: l.sourceUrl,
    imageUrls: l.images.map((i) => i.url),
  }));
}

/** Compliance / permission gate (brief §17, §18). */
function complianceCheck(n: NormalizedListing, authorised: boolean): { ok: boolean; rightsFlag: "AUTHORISED" | "NEEDS_PERMISSION" | "UNKNOWN"; note?: string } {
  if (!authorised) return { ok: true, rightsFlag: "NEEDS_PERMISSION", note: "Source not marked authorised — held for permission review" };
  const anyExternalImages = n.images.some((i) => i.rights === "EXTERNAL_REF" || i.rights === "PENDING_PERMISSION");
  if (anyExternalImages) return { ok: true, rightsFlag: "NEEDS_PERMISSION", note: "Contains external images requiring rights confirmation" };
  return { ok: true, rightsFlag: "AUTHORISED" };
}

export async function runImportJob(params: {
  sourceId: string;
  config?: AdapterConfig;
  initiatorId?: string;
  trigger?: "MANUAL" | "SCHEDULED";
}): Promise<ImportJobResult> {
  const source = await prisma.importSource.findUnique({ where: { id: params.sourceId } });
  if (!source) throw new Error("Import source not found");

  const adapter = getAdapter(source.adapter);
  if (!adapter) throw new Error(`No adapter for ${source.adapter}`);

  const log: string[] = [];
  const job = await prisma.importJob.create({
    data: { sourceId: source.id, initiatorId: params.initiatorId, trigger: params.trigger || "MANUAL", status: "RUNNING", startedAt: new Date() },
  });

  const stored: AdapterConfig = source.config ? safeJson(source.config) : {};
  const config: AdapterConfig = { authorised: source.authorised, attribution: source.attribution || undefined, ...stored, ...params.config };

  // Authorisation gate for automated/remote fetching (brief §19, §20, §32).
  if (params.trigger === "SCHEDULED" && !source.automated) {
    return finish("FAILED", "Scheduled sync attempted on a source without automation enabled");
  }
  if (!adapter.isAuthorised(config)) {
    return finish("FAILED", `Source "${source.name}" is not authorised for ingestion via ${adapter.label}`);
  }

  let discovered = 0, updated = 0, skipped = 0, duplicates = 0, errors = 0;

  const fetchResult = await adapter.fetch(config);
  if (!fetchResult.ok) {
    log.push(`Fetch failed: ${fetchResult.error}`);
    return finish(fetchResult.error?.includes("HTTP") ? "FAILED" : "FAILED", fetchResult.error);
  }
  log.push(`Fetched ${fetchResult.records.length} raw record(s) via ${adapter.label}`);
  const candidates = await loadDupCandidates();

  for (const raw of fetchResult.records) {
    discovered++;
    try {
      const normalized = normalize(raw);
      // idempotency: skip if we already have a record for this source+sourceListingId
      if (normalized.sourceListingId) {
        const existing = await prisma.importRecord.findFirst({
          where: { sourceId: source.id, sourceListingId: normalized.sourceListingId },
        });
        if (existing) { skipped++; log.push(`Skipped already-seen ${normalized.sourceListingId}`); continue; }
      }

      const dup = bestDuplicate(normalized, candidates);
      let status: string = normalized.warnings.length ? "NEEDS_REVIEW" : "NEEDS_REVIEW";
      if (dup && dup.result.confidence >= 65) { status = "DUPLICATE"; duplicates++; }

      const compliance = complianceCheck(normalized, adapter.isAuthorised(config) && source.authorised);

      const record = await prisma.importRecord.create({
        data: {
          jobId: job.id,
          sourceId: source.id,
          raw: JSON.stringify(raw),
          normalized: JSON.stringify(normalized),
          sourceUrl: normalized.sourceUrl,
          sourceListingId: normalized.sourceListingId,
          status,
          dupConfidence: dup?.result.confidence,
          dupListingId: dup?.candidate.id,
          rightsFlag: compliance.rightsFlag,
          reviewNote: [compliance.note, ...normalized.warnings].filter(Boolean).join(" · ") || null,
        },
      });

      if (dup) {
        await prisma.duplicateMatch.create({
          data: {
            recordId: record.id,
            listingAId: dup.candidate.id,
            confidence: dup.result.confidence,
            signals: JSON.stringify(dup.result.signals),
          },
        });
        log.push(`Record "${normalized.title}" → ${dup.result.confidence}% match with existing ${dup.candidate.id}`);
      } else {
        log.push(`Record "${normalized.title}" queued for review`);
      }
      updated++;
    } catch (e) {
      errors++;
      log.push(`Error on a record: ${(e as Error).message}`);
    }
  }

  const status: ImportJobResult["status"] = errors && updated ? "PARTIAL" : errors && !updated ? "FAILED" : "COMPLETED";
  return finish(status);

  async function finish(status: ImportJobResult["status"] | "FAILED", error?: string): Promise<ImportJobResult> {
    if (error) log.push(error);
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status,
        discovered, updated, skipped, duplicates, errors: error ? errors + 1 : errors,
        log: JSON.stringify(log),
        finishedAt: new Date(),
      },
    });
    await prisma.importSource.update({
      where: { id: source!.id },
      data: { lastSyncAt: new Date(), nextSyncAt: nextSync(source!.schedule) },
    });
    // Notify initiator
    if (params.initiatorId) {
      await prisma.notification.create({
        data: {
          userId: params.initiatorId,
          type: status === "FAILED" ? "IMPORT_FAILED" : "IMPORT_COMPLETED",
          title: status === "FAILED" ? `Import failed: ${source!.name}` : `Import completed: ${source!.name}`,
          body: `${discovered} discovered · ${updated} queued · ${duplicates} possible duplicates`,
          href: "/dashboard/imports",
        },
      });
    }
    return { jobId: job.id, status: status === "FAILED" ? "FAILED" : status, discovered, updated, skipped, duplicates, errors, log };
  }
}

/** Publish an approved import record into a real Listing (brief §14). */
export async function publishImportRecord(recordId: string, opts: { agentId?: string; overrides?: Partial<NormalizedListing> } = {}): Promise<string> {
  const record = await prisma.importRecord.findUnique({ where: { id: recordId }, include: { source: true } });
  if (!record || !record.normalized) throw new Error("Record not found or not normalised");
  const n: NormalizedListing = { ...safeJson(record.normalized), ...opts.overrides };

  const listing = await prisma.$transaction(async (tx) => {
    const property = await tx.property.create({
      data: {
        title: n.title,
        description: n.description,
        propertyType: n.propertyType,
        address: n.address,
        barangay: n.barangay,
        city: n.city,
        province: n.province,
        latitude: n.latitude,
        longitude: n.longitude,
        bedrooms: n.bedrooms,
        bathrooms: n.bathrooms,
        floorArea: n.floorArea,
        lotArea: n.lotArea,
        parking: n.parking,
      },
    });
    const created = await tx.listing.create({
      data: {
        propertyId: property.id,
        agentId: opts.agentId,
        listingType: n.listingType,
        price: n.price,
        currency: n.currency,
        status: "PENDING_REVIEW", // still needs admin approval before going live
        verificationStatus: "PENDING",
        sourceId: record.sourceId,
        sourceUrl: n.sourceUrl,
        sourceListingId: n.sourceListingId,
        sourceName: record.source?.name,
        importMethod: record.source?.adapter,
        importJobId: record.jobId,
        importRecordId: record.id,
        sourceLastSeenAt: new Date(),
        publishedAt: null,
        images: {
          create: n.images.map((img, i) => ({
            url: img.url,
            source: "IMPORTED",
            rightsStatus: img.rights,
            sortOrder: i,
          })),
        },
      },
    });
    await tx.importRecord.update({ where: { id: record.id }, data: { status: "PUBLISHED", publishedListingId: created.id } });
    return created;
  });
  return listing.id;
}

function nextSync(schedule: string | null): Date | null {
  const now = Date.now();
  switch (schedule) {
    case "EVERY_15M": return new Date(now + 15 * 60_000);
    case "HOURLY": return new Date(now + 60 * 60_000);
    case "DAILY": return new Date(now + 24 * 60 * 60_000);
    default: return null;
  }
}
function safeJson<T = Record<string, unknown>>(s: string): T {
  try { return JSON.parse(s) as T; } catch { return {} as T; }
}
