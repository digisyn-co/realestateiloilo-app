import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { requestDeveloperVerificationAction } from "@/lib/developer-actions";

export const dynamic = "force-dynamic";

const VERIFY_TONE: Record<string, string> = { VERIFIED: "#5FA39C", PENDING: "#C6A15C", UNVERIFIED: "#8AA0B4", SUSPENDED: "#C05B4A" };

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
        {developer.description && <p className="mt-4 border-t border-[#1A3550] pt-4 text-[13.5px] leading-relaxed text-[#EDE7D6]/70">{developer.description}</p>}
        {developer.verified && (
          <Link href={`/developers/${developer.id}`} className="mt-4 inline-block text-[12px] text-[#C6A15C]">View public developer profile ↗</Link>
        )}
      </Panel>

      <div className="mt-6">
        <Panel title="Verification">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[14px]">Status: <span className="font-semibold" style={{ color: VERIFY_TONE[developer.verificationStatus] }}>{developer.verificationStatus}</span></div>
              <p className="mt-1 max-w-md text-[12.5px] text-[#8AA0B4]">
                Verified developers get a badge and rank higher in search. Company registration, authorized representative and contact are checked by an admin. Documents are never exposed publicly (brief §25).
              </p>
            </div>
            {developer.verificationStatus === "UNVERIFIED" && (
              <form action={requestDeveloperVerificationAction}>
                <button className="border border-[#C6A15C] bg-[#C6A15C] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A1C33]">Request verification</button>
              </form>
            )}
            {developer.verificationStatus === "PENDING" && <span className="text-[12px] text-[#C6A15C]">Awaiting admin review…</span>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8AA0B4]">{label}</div>
      <div className="border border-[#1F3E5A] bg-[#0A1C33] px-3.5 py-3 text-[14px]">{value}</div>
    </div>
  );
}
