"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "./db";
import { requireAdmin, requireAgent, getSessionUser } from "./auth";
import { LEAD_STAGES, LISTING_TYPES, PROPERTY_TYPES } from "./enums";
import { runImportJob, publishImportRecord } from "./import/pipeline";
import { areaByName } from "./iloilo";

// ---- Broker: create listing (wizard) -------------------------------------
const listingSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  propertyType: z.enum(PROPERTY_TYPES),
  listingType: z.enum(LISTING_TYPES),
  price: z.coerce.number().positive(),
  city: z.string().min(2),
  barangay: z.string().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  floorArea: z.coerce.number().min(0).optional(),
  lotArea: z.coerce.number().min(0).optional(),
  parking: z.coerce.number().int().min(0).optional(),
  amenities: z.string().optional(), // comma-separated
  imageUrl: z.string().optional(),
});

export async function createListingAction(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const agentUser = await requireAgent();
  if (!agentUser?.agentId) return { error: "Only brokers can create listings" };
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const area = areaByName(d.city);

  const property = await prisma.property.create({
    data: {
      title: d.title,
      description: d.description,
      propertyType: d.propertyType,
      city: d.city,
      barangay: d.barangay,
      address: d.barangay ? `${d.barangay}, ${d.city}` : d.city,
      latitude: area?.lat,
      longitude: area?.lng,
      bedrooms: d.bedrooms,
      bathrooms: d.bathrooms,
      floorArea: d.floorArea,
      lotArea: d.lotArea,
      parking: d.parking,
    },
  });
  const amenityNames = (d.amenities || "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const name of amenityNames) {
    const amenity = await prisma.amenity.upsert({ where: { name }, create: { name }, update: {} });
    await prisma.propertyAmenity.create({ data: { propertyId: property.id, amenityId: amenity.id } });
  }
  await prisma.listing.create({
    data: {
      propertyId: property.id,
      agentId: agentUser.agentId,
      listingType: d.listingType,
      price: d.price,
      status: "PENDING_REVIEW", // admin approves before it goes live
      verificationStatus: "PENDING",
      importMethod: "NATIVE",
      images: d.imageUrl ? { create: [{ url: d.imageUrl, source: "ORIGINAL_UPLOAD", rightsStatus: "OWNED", sortOrder: 0 }] } : undefined,
    },
  });
  revalidatePath("/dashboard/listings");
  redirect("/dashboard/listings?created=1");
}

export async function setListingStatusAction(formData: FormData) {
  const agentUser = await requireAgent();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!agentUser?.agentId) return;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.agentId !== agentUser.agentId) return;
  await prisma.listing.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard/listings");
}

export async function updateLeadStageAction(formData: FormData) {
  const agentUser = await requireAgent();
  const id = String(formData.get("id"));
  const stage = String(formData.get("stage"));
  if (!agentUser?.agentId || !LEAD_STAGES.includes(stage as never)) return;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || lead.agentId !== agentUser.agentId) return;
  await prisma.lead.update({ where: { id }, data: { stage } });
  revalidatePath("/dashboard/leads");
}

// ---- Imports --------------------------------------------------------------
export async function runImportAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const sourceId = String(formData.get("sourceId"));
  await runImportJob({ sourceId, initiatorId: user.id, trigger: "MANUAL" });
  revalidatePath("/dashboard/imports");
  revalidatePath("/admin/imports");
}

export async function manualUrlImportAction(_prev: { error?: string; ok?: boolean }, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required" };
  const url = String(formData.get("url") || "").trim();
  if (!/^https?:\/\//.test(url)) return { error: "Enter a valid URL (https://…)" };

  // Find or create the user's manual-URL source.
  let source = await prisma.importSource.findFirst({ where: { adapter: "MANUAL_URL", ownerAgent: { userId: user.id } } });
  if (!source) {
    source = await prisma.importSource.findFirst({ where: { adapter: "MANUAL_URL", ownerAgentId: null } });
  }
  if (!source) return { error: "No manual import source configured" };

  const res = await runImportJob({ sourceId: source.id, initiatorId: user.id, trigger: "MANUAL", config: { url, authorised: true } });
  if (res.status === "FAILED") return { error: res.log[res.log.length - 1] || "Import failed — the page may require login or expose no importable metadata." };
  revalidatePath("/dashboard/imports");
  return { ok: true };
}

export async function publishRecordAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const recordId = String(formData.get("recordId"));
  const agentId = user.agentId || undefined;
  await publishImportRecord(recordId, { agentId });
  revalidatePath("/dashboard/imports");
  revalidatePath("/admin/imports");
}

export async function setRecordStatusAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const recordId = String(formData.get("recordId"));
  const status = String(formData.get("status"));
  await prisma.importRecord.update({ where: { id: recordId }, data: { status, reviewerId: user.id } });
  revalidatePath("/dashboard/imports");
  revalidatePath("/admin/imports");
}

// ---- Admin: moderation ----------------------------------------------------
export async function approveListingAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id"));
  const listing = await prisma.listing.update({
    where: { id },
    data: { status: "ACTIVE", verificationStatus: "VERIFIED", verifiedNote: "Broker-verified", publishedAt: new Date(), lastVerifiedAt: new Date() },
    include: { agent: true },
  });
  if (listing.agent) await prisma.notification.create({ data: { userId: listing.agent.userId, type: "LISTING_APPROVED", title: "Listing approved", body: "Your listing is now live and verified.", href: "/dashboard/listings" } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "APPROVE_LISTING", entity: "Listing", entityId: id } });
  revalidatePath("/admin/approvals");
}

export async function rejectListingAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id"));
  const listing = await prisma.listing.update({ where: { id }, data: { status: "REJECTED" }, include: { agent: true } });
  if (listing.agent) await prisma.notification.create({ data: { userId: listing.agent.userId, type: "LISTING_REJECTED", title: "Listing needs changes", body: "An admin sent your listing back for review.", href: "/dashboard/listings" } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "REJECT_LISTING", entity: "Listing", entityId: id } });
  revalidatePath("/admin/approvals");
}

export async function resolveReportAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id"));
  const action = String(formData.get("action")); // ACTIONED | DISMISSED
  const report = await prisma.report.update({ where: { id }, data: { status: action } });
  if (action === "ACTIONED") await prisma.listing.update({ where: { id: report.listingId }, data: { status: "ARCHIVED" } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: `REPORT_${action}`, entity: "Report", entityId: id } });
  revalidatePath("/admin/reports");
}

export async function resolveDuplicateAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id"));
  const resolution = String(formData.get("resolution")); // MERGED | SEPARATE | IGNORED
  const match = await prisma.duplicateMatch.update({ where: { id }, data: { resolution } });
  if (match.recordId) {
    const newStatus = resolution === "MERGED" ? "ARCHIVED" : resolution === "SEPARATE" ? "NEEDS_REVIEW" : "REJECTED";
    await prisma.importRecord.update({ where: { id: match.recordId }, data: { status: newStatus } });
  }
  await prisma.auditLog.create({ data: { actorId: admin.id, action: `DUPLICATE_${resolution}`, entity: "DuplicateMatch", entityId: id } });
  revalidatePath("/admin/duplicates");
}

export async function setUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id"));
  const verify = formData.get("verify") === "1";
  await prisma.user.update({ where: { id }, data: { verificationStatus: verify ? "VERIFIED" : "PENDING" } });
  await prisma.agent.updateMany({ where: { userId: id }, data: { verified: verify } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: verify ? "VERIFY_USER" : "UNVERIFY_USER", entity: "User", entityId: id } });
  revalidatePath("/admin/users");
}
