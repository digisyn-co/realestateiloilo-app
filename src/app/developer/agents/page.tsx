import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { resolveAgentAccessAction } from "@/lib/developer-actions";

export const dynamic = "force-dynamic";

export default async function DeveloperAgents() {
  const user = await getSessionUser();
  if (!user?.developerId) return <PageTitle title="Agents" subtitle="No developer profile." />;

  const [requests, authorized] = await Promise.all([
    prisma.agentProjectAccess.findMany({
      where: { project: { developerId: user.developerId }, status: "REQUESTED" },
      include: { project: true, agent: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agentProjectAccess.findMany({
      where: { project: { developerId: user.developerId }, status: "APPROVED" },
      include: { project: true, agent: { include: { user: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageTitle title="Agent distribution" subtitle="Control who can distribute your inventory (brief §13–15)." />

      <Panel title={`Access requests · ${requests.length}`}>
        {requests.length === 0 ? (
          <p className="py-4 text-center text-[13.5px] text-[#8AA0B4]">No pending requests.</p>
        ) : (
          <div className="grid gap-3">
            {requests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-[#1F3E5A] bg-[#0A1C33] p-4">
                <div>
                  <div className="text-[14.5px] font-medium">{r.agent.user.name}</div>
                  <div className="text-[12px] text-[#8AA0B4]">{r.agent.company || "Independent"} · requested access to {r.project.name} · {timeAgo(r.createdAt)}</div>
                </div>
                <form action={resolveAgentAccessAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input name="commissionPct" type="number" step="0.1" min="0" max="100" defaultValue={r.commissionPct ?? r.project.defaultCommission ?? 3} className="dfield w-20 py-2 text-[12px]" placeholder="%" />
                  <button name="decision" value="APPROVED" className="border border-[#C6A15C] bg-[#C6A15C] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A1C33]">Approve</button>
                  <button name="decision" value="REJECTED" className="border border-[#274563] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8AA0B4] hover:border-[#C05B4A] hover:text-[#C05B4A]">Reject</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="mt-6">
        <Panel title={`Authorized agents · ${authorized.length}`}>
          {authorized.length === 0 ? (
            <p className="py-4 text-center text-[13.5px] text-[#8AA0B4]">No authorized agents yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-[#1A3550] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#8AA0B4]">
                    <th className="py-3 pr-4">Agent</th>
                    <th className="py-3 pr-4">Agency</th>
                    <th className="py-3 pr-4">Project</th>
                    <th className="py-3 pr-4">Commission</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {authorized.map((a) => (
                    <tr key={a.id} className="border-b border-[#1A3550]">
                      <td className="py-3 pr-4 font-medium">{a.agent.user.name}</td>
                      <td className="py-3 pr-4 text-[#8AA0B4]">{a.agent.company || "—"}</td>
                      <td className="py-3 pr-4 text-[#8AA0B4]">{a.project.name}</td>
                      <td className="py-3 pr-4 text-[#C6A15C]">{a.commissionPct != null ? `${a.commissionPct}%` : "—"}</td>
                      <td className="py-3">
                        <form action={resolveAgentAccessAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <button name="decision" value="REVOKED" className="text-[11px] font-semibold text-[#8AA0B4] hover:text-[#C05B4A]">Revoke</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
