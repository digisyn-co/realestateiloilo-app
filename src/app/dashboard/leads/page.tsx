import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { LEAD_STAGES } from "@/lib/enums";
import { PageTitle } from "@/components/dash/DashShell";
import { updateLeadStageAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

const STAGE_COLS = ["NEW", "CONTACTED", "VIEWING", "OFFER", "WON"] as const;

export default async function LeadsPage() {
  const user = await getSessionUser();
  if (!user?.agentId) return <PageTitle title="Leads" subtitle="Sign in as a broker." />;

  const leads = await prisma.lead.findMany({
    where: { agentId: user.agentId },
    include: { listing: { include: { property: true } }, inquiry: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageTitle title="Leads" subtitle={`${leads.length} in your pipeline`} />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {STAGE_COLS.map((stage) => {
          const col = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="border border-[#1A3550] bg-[#0D2540]">
              <div className="flex items-center justify-between border-b border-[#1A3550] px-4 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C6A15C]">{stage}</span>
                <span className="text-[12px] text-[#8AA0B4]">{col.length}</span>
              </div>
              <div className="grid gap-3 p-3">
                {col.map((l) => (
                  <div key={l.id} className="border border-[#1F3E5A] bg-[#0A1C33] p-3">
                    <div className="text-[13.5px] font-medium">{l.name}</div>
                    <div className="mt-1 text-[11.5px] text-[#8AA0B4]">{l.listing?.property.title || "General"}</div>
                    {l.contact && <div className="mt-1 text-[11.5px] text-[#8AA0B4]">{l.contact}</div>}
                    {l.note && <div className="mt-2 text-[12px] text-[#EDE7D6]/70">{l.note}</div>}
                    <div className="mt-2 text-[10px] text-[#46617A]">{timeAgo(l.updatedAt)}</div>
                    <form action={updateLeadStageAction} className="mt-2 flex gap-2">
                      <input type="hidden" name="id" value={l.id} />
                      <select name="stage" defaultValue={l.stage} className="flex-1 border border-[#274563] bg-[#0A1C33] px-2 py-1.5 text-[11.5px]">
                        {LEAD_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button className="border border-[#274563] px-2 py-1.5 text-[10.5px] font-semibold hover:border-[#C6A15C] hover:text-[#C6A15C]">Move</button>
                    </form>
                  </div>
                ))}
                {col.length === 0 && <div className="py-4 text-center text-[11.5px] text-[#46617A]">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
