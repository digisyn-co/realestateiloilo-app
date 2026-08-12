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
            <div key={stage} className="border border-[#1D1B16] bg-[#0E0D0B]">
              <div className="flex items-center justify-between border-b border-[#1D1B16] px-4 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A227]">{stage}</span>
                <span className="text-[12px] text-[#8A8074]">{col.length}</span>
              </div>
              <div className="grid gap-3 p-3">
                {col.map((l) => (
                  <div key={l.id} className="border border-[#26231E] bg-[#0B0A08] p-3">
                    <div className="text-[13.5px] font-medium">{l.name}</div>
                    <div className="mt-1 text-[11.5px] text-[#8A8074]">{l.listing?.property.title || "General"}</div>
                    {l.contact && <div className="mt-1 text-[11.5px] text-[#8A8074]">{l.contact}</div>}
                    {l.note && <div className="mt-2 text-[12px] text-[#F4F0E6]/70">{l.note}</div>}
                    <div className="mt-2 text-[10px] text-[#4E4840]">{timeAgo(l.updatedAt)}</div>
                    <form action={updateLeadStageAction} className="mt-2 flex gap-2">
                      <input type="hidden" name="id" value={l.id} />
                      <select name="stage" defaultValue={l.stage} className="flex-1 border border-[#33302A] bg-[#0B0A08] px-2 py-1.5 text-[11.5px]">
                        {LEAD_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button className="border border-[#33302A] px-2 py-1.5 text-[10.5px] font-semibold hover:border-[#C9A227] hover:text-[#C9A227]">Move</button>
                    </form>
                  </div>
                ))}
                {col.length === 0 && <div className="py-4 text-center text-[11.5px] text-[#4E4840]">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
