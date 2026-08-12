import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPeso, timeAgo } from "@/lib/format";
import { Kpi, PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [live, brokers, inVerification, openReports, flagged, imports, users, duplicates, mrrRows, audit] = await Promise.all([
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.agent.count({ where: { verified: true } }),
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.report.count({ where: { status: "OPEN", reason: { in: ["SCAM", "OFFENSIVE"] } } }),
    prisma.importRecord.count({ where: { status: { in: ["NEEDS_REVIEW", "DUPLICATE"] } } }),
    prisma.user.count(),
    prisma.duplicateMatch.count({ where: { resolution: "PENDING" } }),
    prisma.agent.count({ where: { verified: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: true } }),
  ]);
  // Illustrative MRR from verified brokers (₱2,490 avg plan)
  const mrr = mrrRows * 2490;

  return (
    <div>
      <PageTitle title="Platform overview" subtitle="Health of the marketplace at a glance." />
      <div className="grid grid-cols-2 gap-px bg-[#1D1B16] md:grid-cols-4">
        <Kpi value={live.toLocaleString()} label="Live listings" tone="gold" />
        <Kpi value={brokers} label="Active brokers" />
        <Kpi value={inVerification} label="In verification" tone="orange" />
        <Kpi value={openReports} label="Open reports" tone={openReports ? "orange" : undefined} />
        <Kpi value={flagged} label="Flagged now" tone={flagged ? "orange" : undefined} />
        <Kpi value={imports} label="Imports to review" tone="gold" />
        <Kpi value={users.toLocaleString()} label="Total accounts" />
        <Kpi value={formatPeso(mrr, { compact: true })} label="Est. MRR" tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Needs attention">
          <div className="grid gap-2.5">
            <Attn href="/admin/approvals" label="Listings awaiting approval" n={inVerification} />
            <Attn href="/admin/reports" label="Open reports" n={openReports} />
            <Attn href="/admin/imports" label="Imported listings to review" n={imports} />
            <Attn href="/admin/duplicates" label="Unresolved duplicates" n={duplicates} />
          </div>
        </Panel>

        <Panel title="Recent audit log" action={<Link href="/admin/audit" className="text-[12px] text-[#C9A227]">View all</Link>}>
          <div className="divide-y divide-[#1D1B16]">
            {audit.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 text-[13px]">
                <span>
                  <span className="text-[#C9A227]">{a.action.replace(/_/g, " ").toLowerCase()}</span>{" "}
                  <span className="text-[#8A8074]">· {a.entity}</span>
                </span>
                <span className="text-[11px] text-[#4E4840]">{timeAgo(a.createdAt)}</span>
              </div>
            ))}
            {audit.length === 0 && <p className="py-3 text-[13px] text-[#8A8074]">No activity yet.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Attn({ href, label, n }: { href: string; label: string; n: number }) {
  return (
    <Link href={href} className="flex items-center justify-between border border-[#1D1B16] bg-[#0B0A08] px-4 py-3 hover:border-[#C9A227]">
      <span className="text-[13.5px]">{label}</span>
      <span className="font-serif text-[20px] tabular-nums" style={{ color: n ? "#C9A227" : "#4E4840" }}>{n}</span>
    </Link>
  );
}
