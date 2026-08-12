import { PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-[720px]">
      <PageTitle title="Platform settings" subtitle="Moderation thresholds and staff controls." />

      <Panel title="Moderation">
        <Toggle label="Auto-approve threshold" value="Verified brokers only" />
        <Range label="Duplicate detection sensitivity" value={65} note="Records scoring at or above this are flagged as duplicates." />
        <Toggle label="Automatic photo screening" checked />
        <Range label="Takedown grace period" value={24} unit="h" />
      </Panel>

      <div className="mt-6">
        <Panel title="Staff & security">
          {["Require 2FA for all staff", "Role permissions", "Verification queue alerts", "Daily digest", "High-severity report alerts"].map((n, i) => (
            <label key={n} className="flex items-center justify-between border-b border-[#183A2B] py-3 text-[14px] last:border-0">
              <span>{n}</span>
              <input type="checkbox" defaultChecked={i < 3} className="h-4 w-4 accent-[#D6A84F]" />
            </label>
          ))}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Import automation">
          <p className="text-[13px] leading-relaxed text-[#95A79C]">
            Scheduled imports run only for sources explicitly marked <span className="text-[#6FB58F]">authorised</span> and <span className="text-[#6FB58F]">automated</span>.
            Set <code className="text-[#D6A84F]">IMPORTS_AUTOMATION_ENABLED=true</code> and configure a job queue (see <code>.env.example</code>) to enable background scheduling.
            The platform never scrapes sources that have not granted access.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Toggle({ label, value, checked }: { label: string; value?: string; checked?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[#183A2B] py-3 text-[14px] last:border-0">
      <span>{label}</span>
      {value ? <span className="text-[13px] text-[#D6A84F]">{value}</span> : <input type="checkbox" defaultChecked={checked} className="h-4 w-4 accent-[#D6A84F]" />}
    </div>
  );
}

function Range({ label, value, unit = "%", note }: { label: string; value: number; unit?: string; note?: string }) {
  return (
    <div className="border-b border-[#183A2B] py-3 last:border-0">
      <div className="flex items-center justify-between text-[14px]">
        <span>{label}</span>
        <span className="text-[#D6A84F] tabular-nums">{value}{unit}</span>
      </div>
      <input type="range" min={0} max={unit === "h" ? 72 : 100} defaultValue={value} className="mt-2 w-full accent-[#D6A84F]" />
      {note && <p className="mt-1 text-[11.5px] text-[#95A79C]">{note}</p>}
    </div>
  );
}
