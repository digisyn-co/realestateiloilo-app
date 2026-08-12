import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const agent = user.agentId ? await prisma.agent.findUnique({ where: { id: user.agentId } }) : null;

  return (
    <div className="max-w-[720px]">
      <PageTitle title="Settings" subtitle="Profile, verification and notifications." />

      <Panel title="Profile">
        <div className="grid gap-4 md:grid-cols-2">
          <Row label="Full name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Mobile number" value="+63 917 •••• ••••" />
          <Row label="PRC licence number" value={agent?.licenseNumber || "—"} />
          <Row label="Brokerage" value={agent?.company || "—"} />
          <Row label="Default district" value="Jaro" />
        </div>
      </Panel>

      <div className="mt-6">
        <Panel title="Verification documents">
          <div className="grid gap-px bg-[#1D1B16]">
            {[
              ["PRC licence", agent?.verified ? "Verified" : "Pending"],
              ["Government ID", agent?.verified ? "Verified" : "Pending"],
              ["Brokerage certificate", agent?.verified ? "Verified" : "Not submitted"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between bg-[#0B0A08] px-4 py-3 text-[13.5px]">
                <span className="text-[#8A8074]">{k}</span>
                <span style={{ color: v === "Verified" ? "#7E9877" : "#C9A227" }}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Notifications">
          {["New lead alerts", "Price alerts", "Viewing alerts", "Weekly performance summary"].map((n) => (
            <label key={n} className="flex items-center justify-between border-b border-[#1D1B16] py-3 text-[14px] last:border-0">
              <span>{n}</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#C9A227]" />
            </label>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8A8074]">{label}</div>
      <div className="border border-[#26231E] bg-[#0B0A08] px-3.5 py-3 text-[14px]">{value}</div>
    </div>
  );
}
