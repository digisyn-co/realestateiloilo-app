import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";
import { Kpi, PageTitle, Panel } from "@/components/dash/DashShell";
import { unitCountsFor } from "@/lib/developer/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperUnits() {
  const user = await getSessionUser();
  if (!user?.developerId) return <PageTitle title="Units" subtitle="No developer profile." />;
  const projects = await prisma.project.findMany({ where: { developerId: user.developerId }, orderBy: { name: "asc" } });
  const projectIds = projects.map((p) => p.id);
  const [counts, value] = await Promise.all([
    unitCountsFor({ projectId: { in: projectIds } }),
    prisma.unit.aggregate({ where: { projectId: { in: projectIds } }, _sum: { price: true } }),
  ]);
  const perProject = await Promise.all(
    projects.map(async (p) => ({ project: p, counts: await unitCountsFor({ projectId: p.id }) })),
  );

  return (
    <div>
      <PageTitle title="Unit inventory" subtitle="Inventory across all your projects." />
      <div className="grid grid-cols-2 gap-px bg-[#183A2B] md:grid-cols-4">
        <Kpi value={counts.total.toLocaleString()} label="Total units" tone="gold" />
        <Kpi value={counts.available.toLocaleString()} label="Available" tone="green" />
        <Kpi value={counts.reserved.toLocaleString()} label="Reserved" tone="orange" />
        <Kpi value={counts.sold.toLocaleString()} label="Sold" />
      </div>

      <div className="mt-6">
        <Panel title="By project">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[#183A2B] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#95A79C]">
                  <th className="py-3 pr-4">Project</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Available</th>
                  <th className="py-3 pr-4">Reserved</th>
                  <th className="py-3 pr-4">Sold</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody>
                {perProject.map(({ project, counts: c }) => (
                  <tr key={project.id} className="border-b border-[#183A2B]">
                    <td className="py-3 pr-4 font-medium">{project.name}</td>
                    <td className="py-3 pr-4 tabular-nums">{c.total}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#6FB58F]">{c.available}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#E2712B]">{c.reserved}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#95A79C]">{c.sold}</td>
                    <td className="py-3"><Link href={`/developer/projects/${project.id}/units`} className="text-[12px] text-[#D6A84F]">Manage →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-[#95A79C]">Total inventory value: {formatPeso(value._sum.price || 0)}</p>
        </Panel>
      </div>
    </div>
  );
}
