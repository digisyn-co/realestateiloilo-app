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
            <div key={stage} className="border border-[#183A2B] bg-[#0C2018]">
              <div className="flex items-center justify-between border-b border-[#183A2B] px-4 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D6A84F]">{stage}</span>
                <span className="text-[12px] text-[#95A79C]">{col.length}</span>
              </div>
              <div className="grid gap-3 p-3">
                {col.map((l) => (
                  <div key={l.id} className="border border-[#1C4635] bg-[#05120C] p-3">
                    <div className="text-[13.5px] font-medium">{l.name}</div>
                    <div className="mt-1 text-[11.5px] text-[#95A79C]">{l.listing?.property.title || "General"}</div>
                    {l.contact && <div className="mt-1 text-[11.5px] text-[#95A79C]">{l.contact}</div>}
                    {l.note && <div className="mt-2 text-[12px] text-[#F4F0E6]/70">{l.note}</div>}
                    <div className="mt-2 text-[10px] text-[#4A6353]">{timeAgo(l.updatedAt)}</div>
                    <form action={updateLeadStageAction} className="mt-2 flex gap-2">
                      <input type="hidden" name="id" value={l.id} />
                      <select name="stage" defaultValue={l.stage} className="flex-1 border border-[#245140] bg-[#05120C] px-2 py-1.5 text-[11.5px]">
                        {LEAD_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button className="border border-[#245140] px-2 py-1.5 text-[10.5px] font-semibold hover:border-[#D6A84F] hover:text-[#D6A84F]">Move</button>
                    </form>
                  </div>
                ))}
                {col.length === 0 && <div className="py-4 text-center text-[11.5px] text-[#4A6353]">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
