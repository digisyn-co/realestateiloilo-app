import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { resolveReservationAction } from "@/lib/developer-actions";
import { releaseExpiredHolds } from "@/lib/developer/reservations";

export const dynamic = "force-dynamic";

const TONE: Record<string, string> = {
  HELD: "#C9A227", REQUESTED: "#C9A227", RESERVED: "#7E9877", APPROVED: "#7E9877", REJECTED: "#C05B4A", CANCELLED: "#8A8074", EXPIRED: "#8A8074", SOLD: "#8A8074",
};

export default async function DeveloperReservations() {
  const user = await getSessionUser();
  if (!user?.developerId) return <PageTitle title="Reservations" subtitle="No developer profile." />;
  // opportunistically clear expired holds before listing (brief §21)
  await releaseExpiredHolds();

  const reservations = await prisma.unitReservation.findMany({
    where: { project: { developerId: user.developerId } },
    include: { unit: true, project: true, agent: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageTitle title="Reservations" subtitle="Approve holds before they expire. Inventory locking prevents double-booking (brief §21)." />
      <Panel>
        {reservations.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[#8A8074]">No reservations yet.</p>
        ) : (
          <div className="grid gap-3">
            {reservations.map((r) => {
              const held = r.status === "HELD" || r.status === "REQUESTED";
              const expiresIn = r.holdExpiresAt ? Math.max(0, Math.round((r.holdExpiresAt.getTime() - Date.now()) / 3600000)) : null;
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-[#26231E] bg-[#0B0A08] p-4">
                  <div>
                    <div className="text-[14.5px] font-medium">
                      Unit {r.unit.unitNumber} · {r.project.name}
                    </div>
                    <div className="text-[12px] text-[#8A8074]">
                      {r.buyerName}{r.agent ? ` · via ${r.agent.user.name}` : " · direct"} · {timeAgo(r.createdAt)}
                      {held && expiresIn != null && <span className="text-[#C9A227]"> · hold expires in {expiresIn}h</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TONE[r.status] }}>{r.status}</span>
                    {held && (
                      <form action={resolveReservationAction} className="flex gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <button name="decision" value="APPROVE" className="border border-[#C9A227] bg-[#C9A227] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B0A08]">Approve</button>
                        <button name="decision" value="REJECT" className="border border-[#33302A] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8074] hover:border-[#C05B4A] hover:text-[#C05B4A]">Reject</button>
                      </form>
                    )}
                    {(r.status === "RESERVED" || r.status === "APPROVED") && (
                      <form action={resolveReservationAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button name="decision" value="SOLD" className="border border-[#33302A] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#7E9877] hover:text-[#7E9877]">Mark sold</button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
