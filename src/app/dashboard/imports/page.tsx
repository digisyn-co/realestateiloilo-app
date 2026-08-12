import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { ManualUrlForm } from "@/components/dash/ManualUrlForm";
import { ImportRecordCard } from "@/components/dash/ImportRecordCard";
import { runImportAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const sources = await prisma.importSource.findMany({
    where: { OR: [{ ownerAgent: { userId: user.id } }, { ownerAgentId: null }] },
    orderBy: { createdAt: "asc" },
  });
  const records = await prisma.importRecord.findMany({
    where: { status: { in: ["NEEDS_REVIEW", "DUPLICATE", "PENDING", "SOURCE_UNAVAILABLE"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true },
  });

  return (
    <div>
      <PageTitle title="Import Listings" subtitle="Bring in listings from authorised feeds or a single URL. Nothing publishes without your review." />

      <Panel title="Import from a URL">
        <ManualUrlForm />
        <p className="mt-3 text-[12px] leading-relaxed text-[#95A79C]">
          We retrieve only the metadata a page openly exposes (Open Graph / schema.org). We never log into your account, bypass access controls, or copy images without a rights check. You confirm you're authorised to import the URL.
        </p>
      </Panel>

      <div className="mt-6">
        <Panel title="Connected sources">
          <div className="divide-y divide-[#183A2B]">
            {sources.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <div className="text-[14px] font-medium">{s.name}</div>
                  <div className="text-[11.5px] text-[#95A79C]">
                    {s.adapter} · {s.authorised ? "authorised" : "not authorised"} · {s.automated ? s.schedule?.toLowerCase() : "manual"}
                    {s.lastSyncAt && ` · last sync ${timeAgo(s.lastSyncAt)}`}
                  </div>
                </div>
                {s.authorised && s.adapter !== "MANUAL_URL" ? (
                  <form action={runImportAction}>
                    <input type="hidden" name="sourceId" value={s.id} />
                    <button className="border border-[#245140] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#D6A84F] hover:text-[#D6A84F]">Sync now</button>
                  </form>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#95A79C]">{s.adapter === "MANUAL_URL" ? "URL only" : "Locked"}</span>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 font-serif text-[24px]">Review queue <span className="text-[15px] text-[#95A79C]">· {records.length}</span></h2>
        {records.length === 0 ? (
          <div className="border border-[#183A2B] bg-[#0C2018] p-10 text-center">
            <div className="font-serif text-[22px]">No imported listings to review</div>
            <p className="mt-2 text-[13px] text-[#95A79C]">Import from a URL or sync a source to populate this queue.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {records.map((r) => (
              <ImportRecordCard key={r.id} recordId={r.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
