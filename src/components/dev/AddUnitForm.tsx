"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addUnitAction, type DevActionResult } from "@/lib/developer-actions";
import { UNIT_TYPES, UNIT_STATUS, UNIT_STATUS_LABELS } from "@/lib/enums";

export function AddUnitForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<DevActionResult, FormData>(addUnitAction, {});

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="border border-[#245140] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#D6A84F] hover:text-[#D6A84F]">
        + Add a unit
      </button>
    );
  }

  return (
    <form action={action} className="grid gap-3 border border-[#183A2B] bg-[#05120C] p-4 md:grid-cols-3">
      <input type="hidden" name="projectId" value={projectId} />
      <Field label="Building"><input name="building" className="dfield" placeholder="Tower A" /></Field>
      <Field label="Unit number"><input name="unitNumber" className="dfield" placeholder="A-101" required /></Field>
      <Field label="Type">
        <select name="unitType" className="dfield" defaultValue="1BR">{UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
      </Field>
      <Field label="Floor"><input name="floor" inputMode="numeric" className="dfield" /></Field>
      <Field label="Floor area (sqm)"><input name="floorArea" inputMode="numeric" className="dfield" /></Field>
      <Field label="Bedrooms"><input name="bedrooms" inputMode="numeric" className="dfield" /></Field>
      <Field label="Public price (₱)"><input name="price" inputMode="numeric" className="dfield" required /></Field>
      <Field label="Agent price (₱, optional)"><input name="agentPrice" inputMode="numeric" className="dfield" /></Field>
      <Field label="Status">
        <select name="status" className="dfield" defaultValue="AVAILABLE">{UNIT_STATUS.map((s) => <option key={s} value={s}>{UNIT_STATUS_LABELS[s]}</option>)}</select>
      </Field>
      {state.error && <p className="text-[13px] text-[#E2712B] md:col-span-3">{state.error}</p>}
      {state.ok && <p className="text-[13px] text-[#6FB58F] md:col-span-3">{state.message}</p>}
      <div className="flex gap-2 md:col-span-3">
        <SubmitBtn />
        <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-[#95A79C] hover:text-[#F4F0E6]">Close</button>
      </div>
    </form>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="border border-[#D6A84F] bg-[#D6A84F] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C] disabled:opacity-60">
      {pending ? "Adding…" : "Add unit"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#95A79C]">{label}</div>
      {children}
    </div>
  );
}
