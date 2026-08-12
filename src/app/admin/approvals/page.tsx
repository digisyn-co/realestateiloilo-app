import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPeso, timeAgo } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { approveListingAction, rejectListingAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const listings = await prisma.listing.findMany({
    where: { status: "PENDING_REVIEW" },
    include: { property: true, agent: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageTitle title="Listing approvals" subtitle={`${listings.length} awaiting review`} />
      {listings.length === 0 ? (
        <Panel><p className="py-6 text-center text-[13.5px] text-[#95A79C]">Nothing to approve — the queue is clear.</p></Panel>
      ) : (
        <div className="grid gap-4">
          {listings.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-4 border border-[#183A2B] bg-[#0C2018] p-5">
              <div className="min-w-0">
                <Link href={`/property/${l.id}`} className="font-serif text-[20px] hover:text-[#D6A84F]">{l.property.title}</Link>
                <div className="mt-1 text-[12.5px] text-[#95A79C]">
                  {formatPeso(l.price)} · {l.property.propertyType} · {l.property.city} · {l.agent?.user.name || "Owner"} · {timeAgo(l.createdAt)}
                </div>
              </div>
              <div className="flex gap-2">
                <form action={approveListingAction}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="border border-[#D6A84F] bg-[#D6A84F] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C]">Approve</button>
                </form>
                <form action={rejectListingAction}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="border border-[#245140] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#95A79C] hover:border-[#C05B4A] hover:text-[#C05B4A]">Reject</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
