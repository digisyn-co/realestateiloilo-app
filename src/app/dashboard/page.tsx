import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";
import { Kpi, Panel, PageTitle } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const user = await getSessionUser();
  const agentId = user?.agentId;
  if (!agentId) {
    return (
      <div>
        <PageTitle title="Overview" subtitle="Admin account — visit the broker tools from a broker login, or open the Admin dashboard." />
        <Link href="/admin" className="text-[#D6A84F]">Go to Admin →</Link>
      </div>
    );
  }

  const [listings, active, views, leads, viewings, saves, closedValue] = await Promise.all([
    prisma.listing.count({ where: { agentId } }),
    prisma.listing.count({ where: { agentId, status: "ACTIVE" } }),
    prisma.propertyView.count({ where: { listing: { agentId } } }),
    prisma.lead.count({ where: { agentId, stage: { in: ["NEW", "CONTACTED", "VIEWING", "OFFER"] } } }),
    prisma.viewingRequest.count({ where: { agentId } }),
    prisma.savedProperty.count({ where: { listing: { agentId } } }),
    prisma.listing.aggregate({ where: { agentId, status: { in: ["SOLD", "RENTED"] } }, _sum: { price: true } }),
  ]);

  const weekViews = await prisma.propertyView.count({ where: { listing: { agentId }, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } });
  const enquiryRate = views > 0 ? ((leads / views) * 100).toFixed(1) + "%" : "—";

  const recentLeads = await prisma.lead.findMany({ where: { agentId }, orderBy: { createdAt: "desc" }, take: 5, include: { listing: { include: { property: true } } } });

  return (
    <div>
      <PageTitle title={`Welcome, ${user!.name.split(" ")[0]}`} subtitle="Your listings, leads and performance at a glance." />
      <div className="grid grid-cols-2 gap-px bg-[#183A2B] md:grid-cols-4">
        <Kpi value={active} label="Active listings" tone="gold" />
        <Kpi value={weekViews} label="Views this week" />
        <Kpi value={leads} label="Open leads" tone="green" />
        <Kpi value={enquiryRate} label="Enquiry rate" />
        <Kpi value={views.toLocaleString()} label="Total views" />
        <Kpi value={saves} label="Saves" />
        <Kpi value={viewings} label="Viewing requests" />
        <Kpi value={formatPeso(closedValue._sum.price || 0, { compact: true })} label="Closed value" tone="gold" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recent leads" action={<Link href="/dashboard/leads" className="text-[12px] text-[#D6A84F]">View all</Link>}>
          {recentLeads.length > 0 ? (
            <div className="divide-y divide-[#183A2B]">
              {recentLeads.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-[14px] font-medium">{l.name}</div>
                    <div className="text-[12px] text-[#95A79C]">{l.listing?.property.title || "General enquiry"}</div>
                  </div>
                  <span className="rounded-full border border-[#245140] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#D6A84F]">{l.stage}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13.5px] text-[#95A79C]">No leads yet.</p>
          )}
        </Panel>

        <Panel title="Quick actions">
          <div className="grid gap-3">
            <Link href="/dashboard/listings/new" className="block border border-[#D6A84F] bg-[#D6A84F] px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C]">
              + Add a listing
            </Link>
            <Link href="/dashboard/imports" className="block border border-[#245140] px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#F4F0E6] hover:border-[#D6A84F] hover:text-[#D6A84F]">
              Import listings
            </Link>
            <Link href="/dashboard/analytics" className="block border border-[#245140] px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#F4F0E6] hover:border-[#D6A84F] hover:text-[#D6A84F]">
              View analytics
            </Link>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-[#95A79C]">Total portfolio: {listings} listing{listings === 1 ? "" : "s"}. New listings are reviewed by an admin before they go live.</p>
        </Panel>
      </div>
    </div>
  );
}
