"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "./db";
import { getSessionUser, requireDeveloper, requireAgent } from "./auth";
import { PROJECT_STATUS, PROJECT_TYPES, VISIBILITY, DISTRIBUTION_MODES, LEAD_OWNERSHIP } from "./enums";
import { areaByName } from "./iloilo";
import { buildImportPreview } from "./developer/inventory";
import { requestReservation, approveReservation, rejectReservation, markUnitSold } from "./developer/reservations";
import { agentHasAccess } from "./developer/access";

export type DevActionResult = { ok?: boolean; error?: string; message?: string };

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

async function ownedProject(developerId: string, projectId: string) {
  return prisma.project.findFirst({ where: { id: projectId, developerId } });
}

// ---- Projects -------------------------------------------------------------
const projectSchema = z.object({
  name: z.string().min(3),
  projectType: z.enum(PROJECT_TYPES),
  city: z.string().min(2),
  barangay: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(PROJECT_STATUS).default("SELLING"),
  visibility: z.enum(VISIBILITY).default("PUBLIC"),
  imageUrl: z.string().optional(),
});

export async function createProjectAction(_prev: DevActionResult, formData: FormData): Promise<DevActionResult> {
  const user = await requireDeveloper();
  if (!user?.developerId) return { error: "Only developers can create projects" };
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const area = areaByName(d.city);
  let slug = slugify(d.name);
  if (await prisma.project.findUnique({ where: { slug } })) slug = `${slug}-${Math.floor(Date.now() % 10000)}`;

  const project = await prisma.project.create({
    data: {
      developerId: user.developerId,
      name: d.name,
      slug,
      description: d.description,
      projectType: d.projectType,
      barangay: d.barangay,
      city: d.city,
      address: d.barangay ? `${d.barangay}, ${d.city}` : d.city,
      latitude: area?.lat,
      longitude: area?.lng,
      status: d.status,
      visibility: d.visibility,
      images: d.imageUrl ? { create: [{ url: d.imageUrl, sortOrder: 0 }] } : undefined,
    },
  });
  revalidatePath("/developer/projects");
  redirect(`/developer/projects/${project.id}`);
}

const settingsSchema = z.object({
  projectId: z.string(),
  visibility: z.enum(VISIBILITY).optional(),
  status: z.enum(PROJECT_STATUS).optional(),
  distribution: z.enum(DISTRIBUTION_MODES).optional(),
  leadOwnership: z.enum(LEAD_OWNERSHIP).optional(),
  defaultCommission: z.coerce.number().min(0).max(100).optional(),
});

export async function updateProjectSettingsAction(formData: FormData) {
  const user = await requireDeveloper();
  if (!user?.developerId) return;
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { projectId, ...rest } = parsed.data;
  if (!(await ownedProject(user.developerId, projectId))) return;
  await prisma.project.update({ where: { id: projectId }, data: rest });
  revalidatePath(`/developer/projects/${projectId}`);
}

// ---- Units ----------------------------------------------------------------
const unitSchema = z.object({
  projectId: z.string(),
  unitNumber: z.string().min(1),
  unitType: z.string().min(1),
  floor: z.coerce.number().int().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
  floorArea: z.coerce.number().optional(),
  price: z.coerce.number().positive(),
  agentPrice: z.coerce.number().optional(),
  status: z.string().default("AVAILABLE"),
  building: z.string().optional(),
});

export async function addUnitAction(_prev: DevActionResult, formData: FormData): Promise<DevActionResult> {
  const user = await requireDeveloper();
  if (!user?.developerId) return { error: "Unauthorised" };
  const parsed = unitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!(await ownedProject(user.developerId, d.projectId))) return { error: "Project not found" };

  let buildingId: string | undefined;
  if (d.building) {
    const existing = await prisma.building.findFirst({ where: { projectId: d.projectId, name: d.building } });
    const b = existing ?? (await prisma.building.create({ data: { projectId: d.projectId, name: d.building } }));
    buildingId = b.id;
  }

  try {
    await prisma.unit.create({
      data: {
        projectId: d.projectId,
        buildingId,
        unitNumber: d.unitNumber,
        unitType: d.unitType,
        floor: d.floor,
        bedrooms: d.bedrooms,
        bathrooms: d.bathrooms,
        floorArea: d.floorArea,
        price: d.price,
        agentPrice: d.agentPrice,
        status: d.status,
      },
    });
  } catch {
    return { error: `Unit ${d.unitNumber} already exists in this project` };
  }
  revalidatePath(`/developer/projects/${d.projectId}/units`);
  return { ok: true, message: `Unit ${d.unitNumber} added` };
}

/** Commit a validated bulk import (brief §9). Inserts only valid, non-duplicate rows. */
export async function commitUnitImportAction(_prev: DevActionResult, formData: FormData): Promise<DevActionResult> {
  const user = await requireDeveloper();
  if (!user?.developerId) return { error: "Unauthorised" };
  const projectId = String(formData.get("projectId"));
  const text = String(formData.get("data") || "");
  if (!(await ownedProject(user.developerId, projectId))) return { error: "Project not found" };

  const preview = buildImportPreview(text);
  const valid = preview.rows.filter((r) => r.errors.length === 0 && r.normalized);
  if (valid.length === 0) return { error: "No valid rows to import" };

  // resolve buildings
  const buildingNames = [...new Set(valid.map((r) => r.normalized!.building).filter(Boolean) as string[])];
  const buildingMap = new Map<string, string>();
  for (const name of buildingNames) {
    const existing = await prisma.building.findFirst({ where: { projectId, name } });
    const b = existing ?? (await prisma.building.create({ data: { projectId, name } }));
    buildingMap.set(name, b.id);
  }

  let imported = 0;
  for (const r of valid) {
    const n = r.normalized!;
    try {
      await prisma.unit.create({
        data: {
          projectId,
          buildingId: n.building ? buildingMap.get(n.building) : undefined,
          unitNumber: n.unitNumber,
          unitType: n.unitType,
          floor: n.floor,
          bedrooms: n.bedrooms,
          bathrooms: n.bathrooms,
          floorArea: n.floorArea,
          parking: n.parking,
          price: n.price,
          status: n.status,
          orientation: n.orientation,
        },
      });
      imported++;
    } catch {
      /* duplicate unitNumber in project — skip */
    }
  }
  revalidatePath(`/developer/projects/${projectId}/units`);
  return { ok: true, message: `Imported ${imported} of ${preview.total} rows (${preview.invalid} skipped for errors).` };
}

// ---- Agent access (brief §13, §14) ---------------------------------------
export async function requestAgentAccessAction(formData: FormData) {
  const user = await requireAgent();
  if (!user?.agentId) return;
  const projectId = String(formData.get("projectId"));
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { developer: true } });
  if (!project) return;
  await prisma.agentProjectAccess.upsert({
    where: { projectId_agentId: { projectId, agentId: user.agentId } },
    create: { projectId, agentId: user.agentId, status: project.distribution === "ALL_AGENTS" ? "APPROVED" : "REQUESTED", commissionPct: project.defaultCommission ?? undefined },
    update: { status: "REQUESTED" },
  });
  await prisma.notification.create({
    data: { userId: project.developer.userId, type: "AGENT_ACCESS_REQUEST", title: "Agent access request", body: `${user.name} requested access to ${project.name}.`, href: "/developer/agents" },
  });
  revalidatePath(`/project/${project.slug}`);
  revalidatePath("/developer/agents");
}

export async function resolveAgentAccessAction(formData: FormData) {
  const user = await requireDeveloper();
  if (!user?.developerId) return;
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")); // APPROVED | REJECTED | REVOKED
  const commissionPct = formData.get("commissionPct") ? Number(formData.get("commissionPct")) : undefined;
  const access = await prisma.agentProjectAccess.findUnique({ where: { id }, include: { project: true, agent: { include: { user: true } } } });
  if (!access || access.project.developerId !== user.developerId) return;
  await prisma.agentProjectAccess.update({ where: { id }, data: { status: decision, commissionPct } });
  if (decision === "APPROVED") {
    await prisma.notification.create({
      data: { userId: access.agent.userId, type: "AGENT_ACCESS_APPROVED", title: "Access approved", body: `You can now distribute ${access.project.name}.`, href: `/project/${access.project.slug}` },
    });
  }
  revalidatePath("/developer/agents");
}

// ---- Register client (brief §19) -----------------------------------------
const registerSchema = z.object({
  projectId: z.string(),
  name: z.string().min(2),
  contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  budget: z.string().optional(),
  unitTypeInterest: z.string().optional(),
});

export async function registerClientAction(_prev: DevActionResult, formData: FormData): Promise<DevActionResult> {
  const user = await requireAgent();
  if (!user?.agentId) return { error: "Only agents can register clients" };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const project = await prisma.project.findUnique({ where: { id: d.projectId }, include: { developer: true } });
  if (!project) return { error: "Project not found" };
  if (!(await agentHasAccess(user.agentId, d.projectId))) return { error: "You are not authorised for this project" };

  const ownership = project.leadOwnership; // DEVELOPER | AGENT | SHARED
  await prisma.projectLead.create({
    data: {
      projectId: d.projectId,
      agentId: user.agentId,
      name: d.name,
      contact: d.contact,
      email: d.email || undefined,
      budget: d.budget,
      unitTypeInterest: d.unitTypeInterest,
      source: "AGENT",
      ownership,
      status: "NEW",
    },
  });
  if (ownership !== "AGENT") {
    await prisma.notification.create({
      data: { userId: project.developer.userId, type: "NEW_PROJECT_LEAD", title: "New registered client", body: `${user.name} registered ${d.name} for ${project.name}.`, href: "/developer/leads" },
    });
  }
  revalidatePath("/developer/leads");
  return { ok: true, message: `${d.name} registered under your name for ${project.name}.` };
}

/** Public inquiry on a project → developer lead (brief §18). */
export async function projectInquiryAction(_prev: DevActionResult, formData: FormData): Promise<DevActionResult> {
  const user = await getSessionUser();
  const projectId = String(formData.get("projectId"));
  const name = String(formData.get("name") || user?.name || "");
  const contact = String(formData.get("contact") || "");
  const unitTypeInterest = String(formData.get("unitTypeInterest") || "") || undefined;
  if (name.length < 2) return { error: "Please enter your name" };
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { developer: true } });
  if (!project) return { error: "Project not found" };
  await prisma.projectLead.create({
    data: { projectId, buyerUserId: user?.id, name, contact, unitTypeInterest, source: "PUBLIC", ownership: "DEVELOPER", status: "NEW" },
  });
  await prisma.notification.create({
    data: { userId: project.developer.userId, type: "NEW_PROJECT_LEAD", title: "New project inquiry", body: `${name} inquired about ${project.name}.`, href: "/developer/leads" },
  });
  return { ok: true, message: "Your inquiry was sent to the developer." };
}

// ---- Reservations (brief §20, §21) ---------------------------------------
export async function requestReservationAction(_prev: DevActionResult, formData: FormData): Promise<DevActionResult> {
  const user = await getSessionUser();
  const unitId = String(formData.get("unitId"));
  const buyerName = String(formData.get("buyerName") || user?.name || "");
  const buyerContact = String(formData.get("buyerContact") || "") || undefined;
  if (buyerName.length < 2) return { error: "Please enter the buyer's name" };
  const result = await requestReservation({ unitId, agentId: user?.agentId ?? null, buyerUserId: user?.id ?? null, buyerName, buyerContact });
  if (!result.ok) return { error: result.error };
  const unit = await prisma.unit.findUnique({ where: { id: unitId }, include: { project: true } });
  revalidatePath("/developer/reservations");
  if (unit) revalidatePath(`/project/${unit.project.slug}`);
  return { ok: true, message: "Unit held. The developer will confirm your reservation." };
}

export async function resolveReservationAction(formData: FormData) {
  const user = await requireDeveloper();
  if (!user?.developerId) return;
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision"));
  const reservation = await prisma.unitReservation.findUnique({ where: { id }, include: { project: true } });
  if (!reservation || reservation.project.developerId !== user.developerId) return;
  if (decision === "APPROVE") await approveReservation(id);
  else if (decision === "REJECT") await rejectReservation(id);
  else if (decision === "SOLD") await markUnitSold(reservation.unitId);
  revalidatePath("/developer/reservations");
}

// ---- Developer verification (brief §25) ----------------------------------
export async function requestDeveloperVerificationAction(formData: FormData) {
  const user = await requireDeveloper();
  if (!user?.developerId) return;
  await prisma.developer.update({ where: { id: user.developerId }, data: { verificationStatus: "PENDING" } });
  await prisma.user.update({ where: { id: user.id }, data: { verificationStatus: "PENDING" } });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, type: "DEVELOPER_VERIFIED" as const, title: "Developer verification requested", body: `${user.name} requested developer verification.`, href: "/admin/users" })),
  });
  revalidatePath("/developer/settings");
}
