import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function ViewingsPage() {
  const user = await getSessionUser();
  if (!user?.agentId) return <PageTitle title="Viewings" subtitle="Sign in as a broker." />;
  const viewings = await prisma.viewingRequest.findMany({
    where: { agentId: user.agentId },
    include: { listing: { include: { property: true } }, requester: true },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div>
      <PageTitle title="Viewing requests" subtitle={`${viewings.length} total`} />
      <Panel>
        {viewings.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[#8AA0B4]">No viewing requests yet.</p>
        ) : (
          <div className="divide-y divide-[#1A3550]">
            {viewings.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <div className="text-[14px] font-medium">{v.listing.property.title}</div>
                  <div className="text-[12px] text-[#8AA0B4]">{v.requester?.name || "Guest"} · {v.slotLabel || ""} {new Date(v.scheduledAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</div>
                </div>
                <span className="rounded-full border border-[#274563] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#C6A15C]">{v.status}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
