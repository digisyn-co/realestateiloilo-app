import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function DeveloperLeads() {
  const user = await getSessionUser();
  if (!user?.developerId) return <PageTitle title="Leads" subtitle="No developer profile." />;
  const leads = await prisma.projectLead.findMany({
    where: { project: { developerId: user.developerId } },
    include: { project: true, agent: { include: { user: true } }, unit: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageTitle title="Leads" subtitle={`${leads.length} across your projects · ownership shown per lead (brief §18)`} />
      <Panel>
        {leads.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[#95A79C]">No leads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[#183A2B] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#95A79C]">
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Project</th>
                  <th className="py-3 pr-4">Source</th>
                  <th className="py-3 pr-4">Agent</th>
                  <th className="py-3 pr-4">Ownership</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-[#183A2B]">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-[11.5px] text-[#95A79C]">{l.contact || l.email || ""}{l.budget ? ` · ${l.budget}` : ""}</div>
                    </td>
                    <td className="py-3 pr-4 text-[#95A79C]">{l.project.name}</td>
                    <td className="py-3 pr-4 text-[#95A79C]">{l.source}</td>
                    <td className="py-3 pr-4 text-[#95A79C]">{l.agent?.user.name || "—"}</td>
                    <td className="py-3 pr-4"><span className="text-[11px] font-semibold uppercase tracking-wide text-[#D6A84F]">{l.ownership}</span></td>
                    <td className="py-3 pr-4 text-[#95A79C]">{l.status}</td>
                    <td className="py-3 text-[11px] text-[#4A6353]">{timeAgo(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
