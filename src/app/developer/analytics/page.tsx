import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function DeveloperAnalytics() {
  const user = await getSessionUser();
  if (!user?.developerId) return <PageTitle title="Analytics" subtitle="No developer profile." />;
  const projects = await prisma.project.findMany({ where: { developerId: user.developerId } });

  const projectRows = await Promise.all(
    projects.map(async (p) => {
      const [views, leads, viewings, reservations, sales] = await Promise.all([
        prisma.projectView.count({ where: { projectId: p.id } }),
        prisma.projectLead.count({ where: { projectId: p.id } }),
        prisma.unitReservation.count({ where: { projectId: p.id, status: { in: ["HELD", "REQUESTED"] } } }),
        prisma.unitReservation.count({ where: { projectId: p.id, status: { in: ["RESERVED", "APPROVED"] } } }),
        prisma.unitSale.count({ where: { projectId: p.id } }),
      ]);
      const conversion = views > 0 ? ((sales / views) * 100).toFixed(1) + "%" : "—";
      return { name: p.name, views, leads, viewings, reservations, sales, conversion };
    }),
  );

  // agent performance
  const projectIds = projects.map((p) => p.id);
  const [leadByAgent, salesByAgent] = await Promise.all([
    prisma.projectLead.groupBy({ by: ["agentId"], where: { projectId: { in: projectIds }, agentId: { not: null } }, _count: { agentId: true } }),
    prisma.unitSale.groupBy({ by: ["agentId"], where: { projectId: { in: projectIds }, agentId: { not: null } }, _count: { agentId: true } }),
  ]);
  const agentIds = [...new Set([...leadByAgent.map((r) => r.agentId!), ...salesByAgent.map((r) => r.agentId!)])];
  const agents = await prisma.agent.findMany({ where: { id: { in: agentIds } }, include: { user: true } });
  const agentPerf = agents
    .map((a) => ({
      name: a.user.name,
      company: a.company,
      leads: leadByAgent.find((r) => r.agentId === a.id)?._count.agentId || 0,
      sales: salesByAgent.find((r) => r.agentId === a.id)?._count.agentId || 0,
    }))
    .sort((x, y) => y.leads - x.leads);

  return (
    <div>
      <PageTitle title="Analytics" subtitle="Project and agent performance (brief §23)." />

      <Panel title="Project performance">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[#1D1B16] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#8A8074]">
                <th className="py-3 pr-4">Project</th>
                <th className="py-3 pr-4">Views</th>
                <th className="py-3 pr-4">Leads</th>
                <th className="py-3 pr-4">Viewings</th>
                <th className="py-3 pr-4">Reservations</th>
                <th className="py-3 pr-4">Sales</th>
                <th className="py-3">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {projectRows.map((r) => (
                <tr key={r.name} className="border-b border-[#1D1B16]">
                  <td className="py-3 pr-4 font-medium">{r.name}</td>
                  <td className="py-3 pr-4 tabular-nums">{r.views.toLocaleString()}</td>
                  <td className="py-3 pr-4 tabular-nums">{r.leads}</td>
                  <td className="py-3 pr-4 tabular-nums text-[#8A8074]">{r.viewings}</td>
                  <td className="py-3 pr-4 tabular-nums text-[#E2712B]">{r.reservations}</td>
                  <td className="py-3 pr-4 tabular-nums text-[#7E9877]">{r.sales}</td>
                  <td className="py-3 text-[#C9A227]">{r.conversion}</td>
                </tr>
              ))}
              {projectRows.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-[#8A8074]">No projects yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-6">
        <Panel title="Agent performance">
          {agentPerf.length === 0 ? (
            <p className="py-4 text-center text-[13.5px] text-[#8A8074]">No agent activity yet.</p>
          ) : (
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[#1D1B16] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#8A8074]">
                  <th className="py-3 pr-4">Agent</th>
                  <th className="py-3 pr-4">Agency</th>
                  <th className="py-3 pr-4">Leads</th>
                  <th className="py-3">Sales</th>
                </tr>
              </thead>
              <tbody>
                {agentPerf.map((a) => (
                  <tr key={a.name} className="border-b border-[#1D1B16]">
                    <td className="py-3 pr-4 font-medium">{a.name}</td>
                    <td className="py-3 pr-4 text-[#8A8074]">{a.company || "—"}</td>
                    <td className="py-3 pr-4 tabular-nums">{a.leads}</td>
                    <td className="py-3 tabular-nums text-[#7E9877]">{a.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
