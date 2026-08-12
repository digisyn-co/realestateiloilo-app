"use client";

import { updateProjectSettingsAction } from "@/lib/developer-actions";
import { PROJECT_STATUS, PROJECT_STATUS_LABELS, VISIBILITY, VISIBILITY_LABELS, DISTRIBUTION_MODES, DISTRIBUTION_LABELS, LEAD_OWNERSHIP } from "@/lib/enums";

type Project = { id: string; status: string; visibility: string; distribution: string; leadOwnership: string; defaultCommission: number | null };

export function ProjectSettingsForm({ project }: { project: Project }) {
  return (
    <form action={updateProjectSettingsAction} className="grid gap-4">
      <input type="hidden" name="projectId" value={project.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Status" hint="Project lifecycle (brief §5)">
          <select name="status" defaultValue={project.status} className="dfield">
            {PROJECT_STATUS.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field label="Visibility" hint="Who can see this project (brief §12)">
          <select name="visibility" defaultValue={project.visibility} className="dfield">
            {VISIBILITY.map((v) => <option key={v} value={v}>{VISIBILITY_LABELS[v]}</option>)}
          </select>
        </Field>
        <Field label="Agent distribution" hint="Who may sell it (brief §13)">
          <select name="distribution" defaultValue={project.distribution} className="dfield">
            {DISTRIBUTION_MODES.map((d) => <option key={d} value={d}>{DISTRIBUTION_LABELS[d]}</option>)}
          </select>
        </Field>
        <Field label="Lead ownership" hint="Where inquiries go (brief §18)">
          <select name="leadOwnership" defaultValue={project.leadOwnership} className="dfield">
            {LEAD_OWNERSHIP.map((o) => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>)}
          </select>
        </Field>
        <Field label="Default agent commission (%)" hint="Applied to new agent approvals">
          <input name="defaultCommission" type="number" step="0.1" min="0" max="100" defaultValue={project.defaultCommission ?? ""} className="dfield" placeholder="3" />
        </Field>
      </div>
      <button type="submit" className="justify-self-start border border-[#33302A] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#C9A227] hover:text-[#C9A227]">Save settings</button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8A8074]">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[10.5px] text-[#4E4840]">{hint}</div>}
    </div>
  );
}
