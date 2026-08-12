import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { requestDeveloperVerificationAction } from "@/lib/developer-actions";

export const dynamic = "force-dynamic";

const VERIFY_TONE: Record<string, string> = { VERIFIED: "#6FB58F", PENDING: "#D6A84F", UNVERIFIED: "#95A79C", SUSPENDED: "#C05B4A" };

export default async function DeveloperSettings() {
  const user = await getSessionUser();
  if (!user?.developerId) return <PageTitle title="Settings" subtitle="No developer profile." />;
  const developer = await prisma.developer.findUnique({ where: { id: user.developerId } });
  if (!developer) return <PageTitle title="Settings" subtitle="Developer profile missing." />;

  return (
    <div className="max-w-[760px]">
      <PageTitle title="Settings" subtitle="Company profile and verification." />

      <Panel title="Company profile">
        <div className="grid gap-4 md:grid-cols-2">
          <Row label="Company" value={developer.company} />
          <Row label="Website" value={developer.website || "—"} />
          <Row label="Representative" value={developer.repName || "—"} />
          <Row label="Registration no." value={developer.registrationNo || "—"} />
          <Row label="Contact email" value={developer.contactEmail || user.email} />
          <Row label="Years operating" value={developer.yearsOperating ? String(developer.yearsOperating) : "—"} />
        </div>
        {developer.description && <p className="mt-4 border-t border-[#183A2B] pt-4 text-[13.5px] leading-relaxed text-[#F4F0E6]/70">{developer.description}</p>}
        {developer.verified && (
          <Link href={`/developers/${developer.id}`} className="mt-4 inline-block text-[12px] text-[#D6A84F]">View public developer profile ↗</Link>
        )}
      </Panel>

      <div className="mt-6">
        <Panel title="Verification">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[14px]">Status: <span className="font-semibold" style={{ color: VERIFY_TONE[developer.verificationStatus] }}>{developer.verificationStatus}</span></div>
              <p className="mt-1 max-w-md text-[12.5px] text-[#95A79C]">
                Verified developers get a badge and rank higher in search. Company registration, authorized representative and contact are checked by an admin. Documents are never exposed publicly (brief §25).
              </p>
            </div>
            {developer.verificationStatus === "UNVERIFIED" && (
              <form action={requestDeveloperVerificationAction}>
                <button className="border border-[#D6A84F] bg-[#D6A84F] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C]">Request verification</button>
              </form>
            )}
            {developer.verificationStatus === "PENDING" && <span className="text-[12px] text-[#D6A84F]">Awaiting admin review…</span>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#95A79C]">{label}</div>
      <div className="border border-[#1C4635] bg-[#05120C] px-3.5 py-3 text-[14px]">{value}</div>
    </div>
  );
}
