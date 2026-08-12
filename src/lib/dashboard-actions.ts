"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "./db";
import { requireAdmin, requireAgent, requireHeadBroker, getSessionUser, hashPassword } from "./auth";
import { LEAD_STAGES, LISTING_TYPES, PROPERTY_TYPES } from "./enums";
import { runImportJob, publishImportRecord } from "./import/pipeline";
import { areaByName } from "./iloilo";

// ---- Brokerage: head broker manages agents (brief: team hierarchy) --------
const teamAgentSchema = z.object({
  name: z.string().min(2, "Enter the agent's name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Temporary password: 8+ characters"),
  title: z.string().optional(),
  phone: z.string().optional(),
});

/** Head broker creates a sub-account for one of their agents. */
export async function createTeamAgentAction(_prev: { error?: string; message?: string }, formData: FormData): Promise<{ error?: string; message?: string }> {
  const head = await requireHeadBroker();
  if (!head?.agentId) return { error: "Only a head broker can add agents" };
  const parsed = teamAgentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } })) {
    return { error: "An account with that email already exists" };
  }
  const brokerage = await prisma.agent.findUnique({ where: { id: head.agentId } });
  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone,
      role: "AGENT",
      passwordHash: await hashPassword(d.password),
      verificationStatus: "VERIFIED", // vouched for by their head broker
      agent: {
        create: {
          company: brokerage?.company,
          title: d.title,
          headBrokerId: head.agentId,
          verified: true,
          contactEmail: d.email.toLowerCase(),
        },
      },
    },
  });
  await prisma.notification.create({
    data: { userId: user.id, type: "AGENT_ACCOUNT_CREATED", title: "Welcome to the team", body: `${head.name} added you as an agent. Sign in to start listing.`, href: "/dashboard" },
  });
  revalidatePath("/dashboard/team");
  return { message: `${d.name} added. They can sign in with the temporary password you set.` };
}

/** Head broker approves or rejects a member agent's listing (brief: broker verifies first). */
export async function resolveAgentListingAction(formData: FormData) {
  const head = await requireHeadBroker();
  if (!head?.agentId) return;
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")); // APPROVE | REJECT
  const note = String(formData.get("note") || "") || null;
  const listing = await prisma.listing.findUnique({ where: { id }, include: { agent: true, property: true } });
  // only listings from THIS head broker's team, awaiting broker review
  if (!listing || listing.agent?.headBrokerId !== head.agentId || listing.status !== "PENDING_BROKER_REVIEW") return;

  if (decision === "APPROVE") {
    await prisma.listing.update({
      where: { id },
      data: { status: "ACTIVE", verificationStatus: "VERIFIED", verifiedNote: "Broker-verified", publishedAt: new Date(), lastVerifiedAt: new Date() },
    });
  } else {
    await prisma.listing.update({ where: { id }, data: { status: "REJECTED" } });
  }
  if (listing.agent) {
    await prisma.notification.create({
      data: {
        userId: listing.agent.userId,
        type: decision === "APPROVE" ? "LISTING_BROKER_APPROVED" : "LISTING_BROKER_REJECTED",
        title: decision === "APPROVE" ? "Listing approved by your broker" : "Listing needs changes",
        body: `${head.name} ${decision === "APPROVE" ? "approved and published" : "sent back"} "${listing.property.title}".${note ? ` Note: ${note}` : ""}`,
        href: "/dashboard/listings",
      },
    });
  }
  await prisma.auditLog.create({ data: { actorId: head.id, action: `BROKER_${decision}_LISTING`, entity: "Listing", entityId: id } });
  revalidatePath("/dashboard/review");
}

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

  // Brokerage rule: a member agent's listing must be approved by the head broker
  // first; a head broker's own listing goes straight to admin review.
  const me = await prisma.agent.findUnique({ where: { id: agentUser.agentId }, include: { headBroker: { include: { user: true } } } });
  const needsBrokerReview = !!me?.headBrokerId;

  await prisma.listing.create({
    data: {
      propertyId: property.id,
      agentId: agentUser.agentId,
      listingType: d.listingType,
      price: d.price,
      status: needsBrokerReview ? "PENDING_BROKER_REVIEW" : "PENDING_REVIEW",
      verificationStatus: "PENDING",
      importMethod: "NATIVE",
      images: d.imageUrl ? { create: [{ url: d.imageUrl, source: "ORIGINAL_UPLOAD", rightsStatus: "OWNED", sortOrder: 0 }] } : undefined,
    },
  });

  if (needsBrokerReview && me?.headBroker) {
    await prisma.notification.create({
      data: {
        userId: me.headBroker.user.id,
        type: "AGENT_LISTING_SUBMITTED",
        title: "Listing awaiting your approval",
        body: `${agentUser.name} submitted "${d.title}" for review.`,
        href: "/dashboard/review",
      },
    });
  }
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
  await prisma.developer.updateMany({ where: { userId: id }, data: { verified: verify, verificationStatus: verify ? "VERIFIED" : "PENDING" } });
  if (verify) await prisma.notification.create({ data: { userId: id, type: "DEVELOPER_VERIFIED", title: "Account verified", body: "Your account is now verified.", href: "/developer" } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: verify ? "VERIFY_USER" : "UNVERIFY_USER", entity: "User", entityId: id } });
  revalidatePath("/admin/users");
}
