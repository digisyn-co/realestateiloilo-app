import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { actor: true } });
  return (
    <div>
      <PageTitle title="Audit log" subtitle="Every moderation and import action is recorded (brief §24)." />
      <Panel>
        <div className="divide-y divide-[#1D1B16]">
          {logs.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[13px]">
              <div>
                <span className="text-[#C9A227]">{l.action.replace(/_/g, " ").toLowerCase()}</span>
                <span className="text-[#8A8074]"> · {l.entity}{l.entityId ? ` #${l.entityId.slice(0, 6)}` : ""}</span>
                {l.actor && <span className="text-[#8A8074]"> · by {l.actor.name}</span>}
              </div>
              <span className="text-[11px] text-[#4E4840]">{timeAgo(l.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 && <p className="py-4 text-center text-[13px] text-[#8A8074]">No audit entries yet.</p>}
        </div>
      </Panel>
    </div>
  );
}
