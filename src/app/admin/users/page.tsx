import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { setUserRoleAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

const VERIFY_TONE: Record<string, string> = { VERIFIED: "#7E9877", PENDING: "#C9A227", UNVERIFIED: "#8A8074", REJECTED: "#C05B4A" };

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: { agent: true, _count: { select: { listingsAsOwner: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageTitle title="Accounts" subtitle={`${users.length} users · brokers, owners, buyers and staff`} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-[#1D1B16] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#8A8074]">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Company / PRC</th>
                <th className="py-3 pr-4">Joined</th>
                <th className="py-3 pr-4">Verification</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#1D1B16] text-[13px]">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-[11.5px] text-[#8A8074]">{u.email}</div>
                  </td>
                  <td className="py-3 pr-4 text-[#8A8074]">{u.role}</td>
                  <td className="py-3 pr-4 text-[#8A8074]">{u.agent ? `${u.agent.company || "—"}${u.agent.licenseNumber ? ` · #${u.agent.licenseNumber}` : ""}` : "—"}</td>
                  <td className="py-3 pr-4 text-[#8A8074]">{timeAgo(u.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <span className="text-[11px] font-semibold uppercase" style={{ color: VERIFY_TONE[u.verificationStatus] }}>{u.verificationStatus}</span>
                  </td>
                  <td className="py-3">
                    {["BROKER", "AGENT", "DEVELOPER"].includes(u.role) && (
                      <form action={setUserRoleAction} className="flex gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        {u.verificationStatus === "VERIFIED" ? (
                          <button name="verify" value="0" className="border border-[#33302A] px-3 py-1.5 text-[10.5px] font-semibold text-[#8A8074] hover:border-[#C05B4A] hover:text-[#C05B4A]">Unverify</button>
                        ) : (
                          <button name="verify" value="1" className="border border-[#C9A227] px-3 py-1.5 text-[10.5px] font-semibold text-[#C9A227]">Verify</button>
                        )}
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
