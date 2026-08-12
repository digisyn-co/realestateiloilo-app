import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Kpi, PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user?.agentId) return <PageTitle title="Analytics" subtitle="Sign in as a broker." />;
  const agentId = user.agentId;

  const views = await prisma.propertyView.findMany({
    where: { listing: { agentId }, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    select: { createdAt: true, source: true },
  });
  const [saves, inquiries, viewings, total] = await Promise.all([
    prisma.savedProperty.count({ where: { listing: { agentId } } }),
    prisma.inquiry.count({ where: { listing: { agentId } } }),
    prisma.viewingRequest.count({ where: { agentId } }),
    prisma.propertyView.count({ where: { listing: { agentId } } }),
  ]);

  // views per day, last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    const count = views.filter((v) => v.createdAt.toISOString().slice(0, 10) === key).length;
    return { label: d.toLocaleDateString("en-PH", { weekday: "short" }), count };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  const conversion = total ? ((inquiries / total) * 100).toFixed(1) + "%" : "—";

  const top = await prisma.listing.findMany({
    where: { agentId },
    include: { property: true, _count: { select: { views: true, savedBy: true } } },
    orderBy: { views: { _count: "desc" } },
    take: 5,
  });

  return (
    <div>
      <PageTitle title="Analytics" subtitle="Performance across your listings." />
      <div className="grid grid-cols-2 gap-px bg-[#1A3550] md:grid-cols-4">
        <Kpi value={total.toLocaleString()} label="Total views" tone="gold" />
        <Kpi value={saves} label="Saves" />
        <Kpi value={inquiries} label="Inquiries" tone="green" />
        <Kpi value={conversion} label="Conversion rate" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Views · last 7 days">
          <div className="flex h-40 items-end gap-3">
            {days.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full bg-[#C6A15C]" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 0 }} title={`${d.count} views`} />
                </div>
                <span className="text-[10px] text-[#8AA0B4]">{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top listings">
          <div className="divide-y divide-[#1A3550]">
            {top.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                <span className="truncate pr-3">{l.property.title}</span>
                <span className="flex-none text-[#8AA0B4] tabular-nums">{l._count.views} views · {l._count.savedBy} saves</span>
              </div>
            ))}
            {top.length === 0 && <p className="py-4 text-center text-[13px] text-[#8AA0B4]">No data yet.</p>}
          </div>
        </Panel>
      </div>
      <p className="mt-4 text-[12px] text-[#8AA0B4]">Shares and viewing-request conversion are tracked in the data model and surface here as traffic grows.</p>
    </div>
  );
}
