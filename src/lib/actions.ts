"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./db";
import { getSessionUser } from "./auth";
import { REPORT_REASONS } from "./enums";

const inquirySchema = z.object({
  listingId: z.string().min(1),
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  message: z.string().min(5, "Please add a short message"),
  channel: z.enum(["MESSAGE", "CALL", "VIEWING", "EMAIL"]).default("MESSAGE"),
});

export type ActionResult = { ok: boolean; error?: string; message?: string };

export async function submitInquiry(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser();
  const parsed = inquirySchema.safeParse({
    listingId: formData.get("listingId"),
    name: formData.get("name") || user?.name,
    email: formData.get("email") || user?.email,
    phone: formData.get("phone"),
    message: formData.get("message"),
    channel: formData.get("channel") || "MESSAGE",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: d.listingId }, include: { agent: true } });
  if (!listing) return { ok: false, error: "Listing not found" };

  const inquiry = await prisma.inquiry.create({
    data: { listingId: d.listingId, fromUserId: user?.id, name: d.name, email: d.email || null, phone: d.phone || null, message: d.message, channel: d.channel },
  });

  if (listing.agentId) {
    await prisma.lead.create({ data: { agentId: listing.agentId, listingId: listing.id, inquiryId: inquiry.id, name: d.name, contact: d.phone || d.email || null, stage: "NEW" } });
    const agent = await prisma.agent.findUnique({ where: { id: listing.agentId } });
    if (agent) await prisma.notification.create({ data: { userId: agent.userId, type: "INQUIRY", title: "New inquiry", body: `${d.name}: ${d.message.slice(0, 80)}`, href: "/dashboard/leads" } });
  }
  revalidatePath(`/property/${d.listingId}`);
  return { ok: true, message: "Your message was sent — the broker will reply shortly." };
}

const reportSchema = z.object({
  listingId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  detail: z.string().optional(),
});

export async function submitReport(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser();
  const parsed = reportSchema.safeParse({ listingId: formData.get("listingId"), reason: formData.get("reason"), detail: formData.get("detail") });
  if (!parsed.success) return { ok: false, error: "Please choose a reason" };
  await prisma.report.create({ data: { listingId: parsed.data.listingId, reporterId: user?.id, reason: parsed.data.reason, detail: parsed.data.detail || null } });
  return { ok: true, message: "Thanks — our team will review this listing." };
}

export async function sendMessage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const threadId = String(formData.get("threadId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!threadId || !body) return { ok: false, error: "Write a message" };
  const thread = await prisma.thread.findUnique({ where: { id: threadId }, include: { agent: true } });
  if (!thread) return { ok: false, error: "Thread not found" };
  const isParticipant = thread.buyerId === user.id || thread.agent?.userId === user.id;
  if (!isParticipant) return { ok: false, error: "Not your conversation" };
  await prisma.message.create({ data: { threadId, senderId: user.id, body } });
  await prisma.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
  revalidatePath("/messages");
  return { ok: true };
}

const viewingSchema = z.object({
  listingId: z.string().min(1),
  scheduledAt: z.string().min(1),
  slotLabel: z.string().optional(),
});

export async function requestViewing(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser();
  const parsed = viewingSchema.safeParse({ listingId: formData.get("listingId"), scheduledAt: formData.get("scheduledAt"), slotLabel: formData.get("slotLabel") });
  if (!parsed.success) return { ok: false, error: "Please pick a date and time" };
  const listing = await prisma.listing.findUnique({ where: { id: parsed.data.listingId } });
  if (!listing) return { ok: false, error: "Listing not found" };
  await prisma.viewingRequest.create({
    data: { listingId: listing.id, requesterId: user?.id, agentId: listing.agentId, scheduledAt: new Date(parsed.data.scheduledAt), slotLabel: parsed.data.slotLabel, status: "REQUESTED" },
  });
  if (listing.agentId) {
    const agent = await prisma.agent.findUnique({ where: { id: listing.agentId } });
    if (agent) await prisma.notification.create({ data: { userId: agent.userId, type: "VIEWING", title: "New viewing request", body: parsed.data.slotLabel || parsed.data.scheduledAt, href: "/dashboard/viewings" } });
  }
  return { ok: true, message: "Viewing requested — you'll get a confirmation soon." };
}
