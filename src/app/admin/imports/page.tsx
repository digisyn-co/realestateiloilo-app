import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { Kpi, PageTitle, Panel } from "@/components/dash/DashShell";
import { ImportRecordCard } from "@/components/dash/ImportRecordCard";
import { runImportAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

export default async function AdminImportsPage() {
  const [sources, jobs, recordCounts, records] = await Promise.all([
    prisma.importSource.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { source: true } }),
    prisma.importRecord.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.importRecord.findMany({ where: { status: { in: ["NEEDS_REVIEW", "DUPLICATE"] } }, orderBy: { createdAt: "desc" }, take: 12, select: { id: true } }),
  ]);
  const countBy = (s: string) => recordCounts.find((r) => r.status === s)?._count.status || 0;
  const failed = jobs.filter((j) => j.status === "FAILED").length;

  return (
    <div>
      <PageTitle title="Import monitor" subtitle="Sources, sync health and the review queue across the platform." />

      <div className="grid grid-cols-2 gap-px bg-[#1D1B16] md:grid-cols-4">
        <Kpi value={sources.filter((s) => s.authorised).length} label="Authorised sources" tone="gold" />
        <Kpi value={countBy("NEEDS_REVIEW") + countBy("DUPLICATE")} label="Pending review" tone="orange" />
        <Kpi value={countBy("DUPLICATE")} label="Duplicates detected" tone="orange" />
        <Kpi value={countBy("PUBLISHED")} label="Published" tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Sources">
          <div className="divide-y divide-[#1D1B16]">
            {sources.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-[13.5px] font-medium">{s.name}</div>
                  <div className="text-[11.5px] text-[#8A8074]">
                    {s.adapter} · {s.authorised ? <span className="text-[#7E9877]">authorised</span> : <span className="text-[#E2712B]">not authorised</span>} · {s.automated ? s.schedule?.toLowerCase() : "manual"}
                    {s.lastSyncAt && ` · ${timeAgo(s.lastSyncAt)}`}
                  </div>
                </div>
                {s.authorised && s.adapter !== "MANUAL_URL" && (
                  <form action={runImportAction}>
                    <input type="hidden" name="sourceId" value={s.id} />
                    <button className="border border-[#33302A] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#C9A227] hover:text-[#C9A227]">Sync</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent jobs">
          <div className="divide-y divide-[#1D1B16]">
            {jobs.map((j) => (
              <div key={j.id} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium">{j.source.name}</span>
                  <span className="text-[11px] font-semibold uppercase" style={{ color: j.status === "FAILED" ? "#C05B4A" : j.status === "COMPLETED" ? "#7E9877" : "#C9A227" }}>{j.status}</span>
                </div>
                <div className="mt-1 text-[11.5px] text-[#8A8074]">
                  {j.discovered} discovered · {j.updated} queued · {j.duplicates} dup · {j.errors} err · {timeAgo(j.createdAt)}
                </div>
              </div>
            ))}
            {jobs.length === 0 && <p className="py-3 text-[13px] text-[#8A8074]">No jobs yet.</p>}
          </div>
          {failed > 0 && <p className="mt-3 text-[12px] text-[#E2712B]">{failed} failed sync{failed > 1 ? "s" : ""} in recent history.</p>}
        </Panel>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 font-serif text-[24px]">Review queue <span className="text-[15px] text-[#8A8074]">· {records.length}</span></h2>
        {records.length === 0 ? (
          <div className="border border-[#1D1B16] bg-[#0E0D0B] p-10 text-center">
            <div className="font-serif text-[22px]">No imported listings pending review</div>
            <p className="mt-2 text-[13px] text-[#8A8074]">Imports appear here for approval before they can go live.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {records.map((r) => (
              <ImportRecordCard key={r.id} recordId={r.id} showAdmin />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
