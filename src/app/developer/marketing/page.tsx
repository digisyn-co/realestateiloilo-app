import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function DeveloperMarketing() {
  const user = await getSessionUser();
  if (!user?.developerId) return <PageTitle title="Marketing Materials" subtitle="No developer profile." />;
  const docs = await prisma.projectDocument.findMany({
    where: { project: { developerId: user.developerId } },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageTitle title="Marketing materials" subtitle="Brochures, floor plans, price lists and sales kits — set each Public or Agent-only (brief §22)." />

      <Panel title={`Library · ${docs.length}`}>
        {docs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13.5px] text-[#95A79C]">No materials uploaded yet.</p>
            <p className="mt-2 text-[12px] text-[#4A6353]">
              File uploads route through the storage adapter (see <code className="text-[#D6A84F]">.env</code> <code>STORAGE_PROVIDER</code>). Each material carries a visibility flag —
              agent-only files are never served to public users, enforced server-side.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[#183A2B] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#95A79C]">
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Project</th>
                  <th className="py-3">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-[#183A2B]">
                    <td className="py-3 pr-4 font-medium">{d.title}</td>
                    <td className="py-3 pr-4 text-[#95A79C]">{d.type.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="py-3 pr-4 text-[#95A79C]">{d.project.name}</td>
                    <td className="py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: d.visibility === "AGENT_ONLY" ? "#E2712B" : "#6FB58F" }}>
                        {d.visibility.replace("_", " ").toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
