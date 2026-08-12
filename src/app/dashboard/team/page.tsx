import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { AddTeamAgentForm } from "@/components/dash/AddTeamAgentForm";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getSessionUser();
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") return <PageTitle title="My Agents" subtitle="Only head brokers manage a team." />;
  if (!user.agentId) return <PageTitle title="My Agents" subtitle="No brokerage profile." />;

  const members = await prisma.agent.findMany({
    where: { headBrokerId: user.agentId },
    include: {
      user: true,
      _count: { select: { listings: true } },
      listings: { select: { status: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle title="My Agents" subtitle={`${members.length} agent${members.length === 1 ? "" : "s"} report to you. Their listings need your approval before going live.`} />
        <div className="mb-2"><AddTeamAgentForm /></div>
      </div>

      <Panel>
        {members.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[#95A79C]">No agents yet. Add your first agent — only you can create their account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[#1A3550] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#95A79C]">
                  <th className="py-3 pr-4">Agent</th>
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Listings</th>
                  <th className="py-3 pr-4">Live</th>
                  <th className="py-3 pr-4">Awaiting you</th>
                  <th className="py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const live = m.listings.filter((l) => l.status === "ACTIVE").length;
                  const pending = m.listings.filter((l) => l.status === "PENDING_BROKER_REVIEW").length;
                  return (
                    <tr key={m.id} className="border-b border-[#1A3550]">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{m.user.name}</div>
                        <div className="text-[11.5px] text-[#95A79C]">{m.user.email}</div>
                      </td>
                      <td className="py-3 pr-4 text-[#95A79C]">{m.title || "Agent"}</td>
                      <td className="py-3 pr-4 tabular-nums">{m._count.listings}</td>
                      <td className="py-3 pr-4 tabular-nums text-[#6FB58F]">{live}</td>
                      <td className="py-3 pr-4 tabular-nums" style={{ color: pending ? "#D6A84F" : "#95A79C" }}>{pending}</td>
                      <td className="py-3 text-[11px] text-[#61796C]">{timeAgo(m.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="mt-4 text-[12px] text-[#61796C]">Head brokers are the only accounts that can create agent sub-accounts.</p>
    </div>
  );
}
