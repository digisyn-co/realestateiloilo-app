import Link from "next/link";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { resolveReportAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = { SCAM: "Scam", DUPLICATE: "Duplicate", WRONG_INFO: "Wrong info", SOLD: "Already sold", OFFENSIVE: "Offensive", OTHER: "Other" };

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: { in: ["OPEN", "REVIEWING"] } },
    include: { listing: { include: { property: true } }, reporter: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageTitle title="Reported listings" subtitle={`${reports.length} open`} />
      {reports.length === 0 ? (
        <Panel><p className="py-6 text-center text-[13.5px] text-[#8AA0B4]">No open reports.</p></Panel>
      ) : (
        <div className="grid gap-4">
          {reports.map((r) => {
            const severe = r.reason === "SCAM" || r.reason === "OFFENSIVE";
            return (
              <div key={r.id} className="border border-[#1A3550] bg-[#0D2540] p-5" style={severe ? { borderColor: "#5A3320" } : undefined}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: severe ? "#E2712B22" : "#274563", color: severe ? "#E2712B" : "#C6A15C" }}>
                      {REASON_LABELS[r.reason]}
                    </span>
                    <Link href={`/property/${r.listingId}`} className="ml-3 font-serif text-[19px] hover:text-[#C6A15C]">{r.listing.property.title}</Link>
                  </div>
                  <span className="text-[11px] text-[#46617A]">{timeAgo(r.createdAt)}</span>
                </div>
                {r.detail && <p className="mt-2 text-[13.5px] text-[#EDE7D6]/70">“{r.detail}”</p>}
                <div className="mt-1 text-[12px] text-[#8AA0B4]">Reported by {r.reporter?.name || "a guest"}</div>
                <form action={resolveReportAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <button name="action" value="ACTIONED" className="border border-[#274563] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#E2712B] hover:border-[#E2712B]">Take down listing</button>
                  <button name="action" value="DISMISSED" className="border border-[#274563] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8AA0B4] hover:border-[#C6A15C] hover:text-[#C6A15C]">Dismiss</button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
