"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProjectAction, type DevActionResult } from "@/lib/developer-actions";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS, PROJECT_STATUS, PROJECT_STATUS_LABELS, VISIBILITY, VISIBILITY_LABELS } from "@/lib/enums";
import { ALL_AREAS } from "@/lib/iloilo";

export function CreateProjectForm() {
  const [state, action] = useFormState<DevActionResult, FormData>(createProjectAction, {});
  return (
    <form action={action} className="grid gap-4 border border-[#1A3550] bg-[#0D2540] p-6">
      <Field label="Project name"><input name="name" className="dfield" placeholder="The Grand Iloilo Residences" required /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Project type">
          <select name="projectType" className="dfield" defaultValue="CONDO">
            {PROJECT_TYPES.map((t) => <option key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="District / town">
          <select name="city" className="dfield" defaultValue="Mandurriao">
            {ALL_AREAS.map((a) => <option key={a.slug} value={a.name}>{a.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Barangay (optional)"><input name="barangay" className="dfield" /></Field>
      <Field label="Description"><textarea name="description" rows={4} className="dfield resize-none" placeholder="Describe the development…" /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Status">
          <select name="status" className="dfield" defaultValue="SELLING">
            {PROJECT_STATUS.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field label="Visibility">
          <select name="visibility" className="dfield" defaultValue="PUBLIC">
            {VISIBILITY.map((v) => <option key={v} value={v}>{VISIBILITY_LABELS[v]}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Cover image URL (optional)"><input name="imageUrl" className="dfield" placeholder="/property-images/b2.png or https://…" /></Field>
      {state.error && <p className="text-[13px] text-[#E2712B]">{state.error}</p>}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="justify-self-start border border-[#C6A15C] bg-[#C6A15C] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A1C33] disabled:opacity-60">
      {pending ? "Creating…" : "Create project"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8AA0B4]">{label}</div>
      {children}
    </div>
  );
}
