import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPeso, timeAgo } from "@/lib/format";
import { Kpi, PageTitle, Panel } from "@/components/dash/DashShell";
import { developerOverview } from "@/lib/developer/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperOverview() {
  const user = await getSessionUser();
  if (!user?.developerId) {
    return (
      <div>
        <PageTitle title="Developer Overview" subtitle="This admin account has no developer profile. Create projects from a developer login." />
        <Link href="/admin" className="text-[#C9A227]">Go to Admin →</Link>
      </div>
    );
  }
  const o = await developerOverview(user.developerId);
  const recentLeads = await prisma.projectLead.findMany({
    where: { project: { developerId: user.developerId } },
    include: { project: true, agent: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div>
      <PageTitle title={`Welcome, ${user.name.split(" ")[0]}`} subtitle="Your projects, inventory and pipeline at a glance." />
      <div className="grid grid-cols-2 gap-px bg-[#1D1B16] md:grid-cols-4">
        <Kpi value={o.projects} label="Projects" tone="gold" />
        <Kpi value={o.counts.total.toLocaleString()} label="Total units" />
        <Kpi value={o.counts.available.toLocaleString()} label="Available" tone="green" />
        <Kpi value={o.counts.reserved.toLocaleString()} label="Reserved" tone="orange" />
        <Kpi value={o.counts.sold.toLocaleString()} label="Sold" />
        <Kpi value={formatPeso(o.inventoryValue, { compact: true })} label="Inventory value" tone="gold" />
        <Kpi value={o.monthLeads.toLocaleString()} label="Monthly leads" />
        <Kpi value={o.reservations.toLocaleString()} label="Reservations" tone="orange" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Pipeline">
          <div className="grid gap-2.5">
            <Stat label="Total leads" value={o.leads} />
            <Stat label="Reservations (active)" value={o.reservations} />
            <Stat label="Sales" value={o.sales} />
            <Stat label="Conversion rate" value={o.conversion} />
            <Stat label="Available inventory value" value={formatPeso(o.availableValue, { compact: true })} />
          </div>
        </Panel>

        <Panel title="Recent leads" action={<Link href="/developer/leads" className="text-[12px] text-[#C9A227]">View all</Link>}>
          {recentLeads.length > 0 ? (
            <div className="divide-y divide-[#1D1B16]">
              {recentLeads.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-[14px] font-medium">{l.name}</div>
                    <div className="text-[12px] text-[#8A8074]">{l.project.name}{l.agent ? ` · via ${l.agent.user.name}` : " · direct"}</div>
                  </div>
                  <span className="text-[11px] text-[#4E4840]">{timeAgo(l.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13.5px] text-[#8A8074]">No leads yet.</p>
          )}
          <Link href="/developer/projects/new" className="mt-4 block border border-[#C9A227] bg-[#C9A227] px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B0A08]">+ New project</Link>
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border border-[#1D1B16] bg-[#0B0A08] px-4 py-3">
      <span className="text-[13.5px] text-[#8A8074]">{label}</span>
      <span className="font-serif text-[20px] tabular-nums text-[#C9A227]">{value}</span>
    </div>
  );
}
