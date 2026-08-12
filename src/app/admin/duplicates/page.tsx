import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { resolveDuplicateAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

type Signal = { signal: string; contribution: number };

export default async function DuplicatesPage() {
  const matches = await prisma.duplicateMatch.findMany({
    where: { resolution: "PENDING" },
    include: { record: true, listingA: { include: { property: true } } },
    orderBy: { confidence: "desc" },
  });

  return (
    <div>
      <PageTitle title="Duplicate detection" subtitle={`${matches.length} unresolved · the same property often appears from several agents and sites`} />
      {matches.length === 0 ? (
        <Panel><p className="py-6 text-center text-[13.5px] text-[#95A79C]">No duplicate listings detected.</p></Panel>
      ) : (
        <div className="grid gap-4">
          {matches.map((m) => {
            const norm = safe<{ title: string; price: number; city: string }>(m.record?.normalized);
            const signals = safe<Signal[]>(m.signals) || [];
            const tone = m.confidence >= 85 ? "#E2712B" : m.confidence >= 65 ? "#D6A84F" : "#95A79C";
            return (
              <div key={m.id} className="border border-[#183A2B] bg-[#0C2018] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-serif text-[20px]">{m.confidence}% likely duplicate</div>
                  <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: `${tone}22`, color: tone }}>
                    {m.confidence >= 85 ? "strong" : m.confidence >= 65 ? "likely" : "weak"}
                  </span>
                </div>
                <div className="mt-3 grid gap-px bg-[#183A2B] md:grid-cols-2">
                  <div className="bg-[#05120C] p-4">
                    <div className="mb-1 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#D6A84F]">Imported record</div>
                    <div className="text-[14px]">{norm?.title || "—"}</div>
                    <div className="text-[12px] text-[#95A79C]">{norm ? `${formatPeso(norm.price)} · ${norm.city}` : ""}</div>
                  </div>
                  <div className="bg-[#05120C] p-4">
                    <div className="mb-1 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#95A79C]">Existing listing</div>
                    {m.listingA ? (
                      <Link href={`/property/${m.listingA.id}`} className="text-[14px] hover:text-[#D6A84F]">
                        {m.listingA.property.title}
                      </Link>
                    ) : (
                      <span className="text-[14px]">—</span>
                    )}
                    <div className="text-[12px] text-[#95A79C]">{m.listingA ? `${formatPeso(m.listingA.price)} · ${m.listingA.property.city}` : ""}</div>
                  </div>
                </div>
                {signals.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {signals.map((s, i) => (
                      <span key={i} className="rounded-full bg-[#0E241B] px-2.5 py-1 text-[10.5px] text-[#95A79C]">
                        {s.signal}: {Math.round(s.contribution * 100)}%
                      </span>
                    ))}
                  </div>
                )}
                <form action={resolveDuplicateAction} className="mt-4 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <button name="resolution" value="MERGED" className="border border-[#D6A84F] bg-[#D6A84F] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C]">Merge</button>
                  <button name="resolution" value="SEPARATE" className="border border-[#245140] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#D6A84F] hover:text-[#D6A84F]">Create separate</button>
                  <button name="resolution" value="IGNORED" className="border border-[#245140] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#95A79C] hover:border-[#C05B4A] hover:text-[#C05B4A]">Ignore</button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function safe<T>(s: string | null | undefined): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
