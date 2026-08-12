// Reservation workflow + server-side inventory locking (brief §20, §21).
// The lock is an ATOMIC conditional update: `updateMany` where status=AVAILABLE.
// Only one caller can flip AVAILABLE -> ON_HOLD, so two agents can never claim
// the same unit simultaneously. Holds expire after RESERVATION_HOLD_HOURS.

import { prisma } from "../db";
import { RESERVATION_HOLD_HOURS } from "../enums";

export type ReserveInput = {
  unitId: string;
  agentId?: string | null;
  buyerUserId?: string | null;
  buyerName: string;
  buyerContact?: string;
  note?: string;
};

export type ReserveResult = { ok: boolean; reservationId?: string; error?: string; holdExpiresAt?: Date };

/** Place a temporary hold and create a reservation request. Atomic + race-safe. */
export async function requestReservation(input: ReserveInput): Promise<ReserveResult> {
  const unit = await prisma.unit.findUnique({ where: { id: input.unitId }, include: { project: true } });
  if (!unit) return { ok: false, error: "Unit not found" };

  // Opportunistically release this unit if its hold already expired.
  await releaseExpiredHolds(input.unitId);

  const holdExpiresAt = new Date(Date.now() + RESERVATION_HOLD_HOURS * 3600_000);

  // ATOMIC LOCK: flip AVAILABLE -> ON_HOLD only if still available.
  const locked = await prisma.unit.updateMany({
    where: { id: input.unitId, status: "AVAILABLE" },
    data: { status: "ON_HOLD", holdAgentId: input.agentId ?? null, holdExpiresAt },
  });
  if (locked.count === 0) {
    return { ok: false, error: "This unit is no longer available — someone reserved it first." };
  }

  const reservation = await prisma.unitReservation.create({
    data: {
      unitId: input.unitId,
      projectId: unit.projectId,
      agentId: input.agentId ?? undefined,
      buyerUserId: input.buyerUserId ?? undefined,
      buyerName: input.buyerName,
      buyerContact: input.buyerContact,
      status: "HELD",
      holdExpiresAt,
      note: input.note,
    },
  });

  // Notify the developer.
  const dev = await prisma.developer.findFirst({ where: { projects: { some: { id: unit.projectId } } }, select: { userId: true } });
  if (dev) {
    await prisma.notification.create({
      data: {
        userId: dev.userId,
        type: "RESERVATION_REQUEST",
        title: `Reservation request · ${unit.project.name}`,
        body: `Unit ${unit.unitNumber} held for ${input.buyerName}. Approve within ${RESERVATION_HOLD_HOURS}h.`,
        href: "/developer/reservations",
      },
    });
  }
  return { ok: true, reservationId: reservation.id, holdExpiresAt };
}

/** Developer approves a held reservation → unit RESERVED. */
export async function approveReservation(reservationId: string): Promise<ReserveResult> {
  const r = await prisma.unitReservation.findUnique({ where: { id: reservationId }, include: { unit: true, agent: true } });
  if (!r) return { ok: false, error: "Reservation not found" };
  await prisma.$transaction([
    prisma.unit.update({ where: { id: r.unitId }, data: { status: "RESERVED", holdExpiresAt: null } }),
    prisma.unitReservation.update({ where: { id: reservationId }, data: { status: "RESERVED" } }),
    // reject any other pending holds on the same unit
    prisma.unitReservation.updateMany({
      where: { unitId: r.unitId, id: { not: reservationId }, status: { in: ["REQUESTED", "HELD"] } },
      data: { status: "REJECTED" },
    }),
  ]);
  if (r.agent) {
    await prisma.notification.create({
      data: { userId: r.agent.userId, type: "RESERVATION_APPROVED", title: "Reservation approved", body: `Unit ${r.unit.unitNumber} is reserved.`, href: "/dashboard" },
    });
  }
  return { ok: true, reservationId };
}

/** Developer rejects a hold → unit back to AVAILABLE. */
export async function rejectReservation(reservationId: string): Promise<ReserveResult> {
  const r = await prisma.unitReservation.findUnique({ where: { id: reservationId }, include: { unit: true, agent: true } });
  if (!r) return { ok: false, error: "Reservation not found" };
  await prisma.$transaction([
    prisma.unitReservation.update({ where: { id: reservationId }, data: { status: "REJECTED" } }),
    // only free the unit if it is still held by this reservation
    prisma.unit.updateMany({ where: { id: r.unitId, status: "ON_HOLD" }, data: { status: "AVAILABLE", holdAgentId: null, holdExpiresAt: null } }),
  ]);
  if (r.agent) {
    await prisma.notification.create({
      data: { userId: r.agent.userId, type: "RESERVATION_REJECTED", title: "Reservation declined", body: `Unit ${r.unit.unitNumber} was released.`, href: "/dashboard" },
    });
  }
  return { ok: true, reservationId };
}

/** Mark a reserved unit as sold (records commission from the agent's access). */
export async function markUnitSold(unitId: string): Promise<ReserveResult> {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) return { ok: false, error: "Unit not found" };
  const active = await prisma.unitReservation.findFirst({
    where: { unitId, status: { in: ["RESERVED", "APPROVED"] } },
    orderBy: { updatedAt: "desc" },
    include: { agent: true },
  });
  const commission = active?.agentId
    ? (await prisma.agentProjectAccess.findUnique({ where: { projectId_agentId: { projectId: unit.projectId, agentId: active.agentId } } }))?.commissionPct
    : undefined;

  await prisma.$transaction([
    prisma.unit.update({ where: { id: unitId }, data: { status: "SOLD", holdExpiresAt: null } }),
    prisma.unitSale.upsert({
      where: { unitId },
      create: { unitId, projectId: unit.projectId, agentId: active?.agentId ?? undefined, buyerName: active?.buyerName || "Direct buyer", price: unit.price, commissionPct: commission ?? undefined },
      update: {},
    }),
    ...(active ? [prisma.unitReservation.update({ where: { id: active.id }, data: { status: "SOLD" } })] : []),
  ]);
  return { ok: true };
}

/**
 * Release expired temporary holds (brief §21). Scope to one unit when given,
 * otherwise sweep all. Called opportunistically on reservation requests and can
 * be wired to a scheduled job (see .env QUEUE_DRIVER) for background cleanup.
 */
export async function releaseExpiredHolds(unitId?: string): Promise<number> {
  const now = new Date();
  const where = { status: "ON_HOLD" as const, holdExpiresAt: { lt: now }, ...(unitId ? { id: unitId } : {}) };
  const expiredUnits = await prisma.unit.findMany({ where, select: { id: true } });
  if (expiredUnits.length === 0) return 0;
  const ids = expiredUnits.map((u) => u.id);
  await prisma.$transaction([
    prisma.unit.updateMany({ where: { id: { in: ids } }, data: { status: "AVAILABLE", holdAgentId: null, holdExpiresAt: null } }),
    prisma.unitReservation.updateMany({ where: { unitId: { in: ids }, status: { in: ["REQUESTED", "HELD"] } }, data: { status: "EXPIRED" } }),
  ]);
  return ids.length;
}
