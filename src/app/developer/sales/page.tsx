import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";
import { Kpi, PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function DeveloperSales() {
  const user = await getSessionUser();
  if (!user?.developerId) return <PageTitle title="Sales" subtitle="No developer profile." />;
  const sales = await prisma.unitSale.findMany({
    where: { project: { developerId: user.developerId } },
    include: { project: true, unit: true, agent: { include: { user: true } } },
    orderBy: { soldAt: "desc" },
  });
  const total = sales.reduce((s, x) => s + x.price, 0);

  return (
    <div>
      <PageTitle title="Sales" subtitle={`${sales.length} closed`} />
      <div className="grid grid-cols-2 gap-px bg-[#183A2B] md:grid-cols-3">
        <Kpi value={sales.length} label="Units sold" tone="gold" />
        <Kpi value={formatPeso(total, { compact: true })} label="Sales value" tone="green" />
        <Kpi value={sales.filter((s) => s.agentId).length} label="Agent-assisted" />
      </div>
      <div className="mt-6">
        <Panel>
          {sales.length === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-[#95A79C]">No sales recorded yet. Mark reserved units as sold from Reservations.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-[#183A2B] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#95A79C]">
                    <th className="py-3 pr-4">Unit</th>
                    <th className="py-3 pr-4">Project</th>
                    <th className="py-3 pr-4">Buyer</th>
                    <th className="py-3 pr-4">Agent</th>
                    <th className="py-3 pr-4">Price</th>
                    <th className="py-3">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-b border-[#183A2B]">
                      <td className="py-3 pr-4 font-medium">{s.unit.unitNumber}</td>
                      <td className="py-3 pr-4 text-[#95A79C]">{s.project.name}</td>
                      <td className="py-3 pr-4 text-[#95A79C]">{s.buyerName}</td>
                      <td className="py-3 pr-4 text-[#95A79C]">{s.agent?.user.name || "Direct"}</td>
                      <td className="py-3 pr-4 tabular-nums">{formatPeso(s.price)}</td>
                      <td className="py-3 text-[#D6A84F]">{s.commissionPct != null ? `${s.commissionPct}%` : "—"}</td>
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
