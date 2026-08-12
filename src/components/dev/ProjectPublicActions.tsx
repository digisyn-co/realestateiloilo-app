"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { projectInquiryAction, registerClientAction, requestReservationAction, type DevActionResult } from "@/lib/developer-actions";

const initial: DevActionResult = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      {pending ? "Sending…" : label}
    </button>
  );
}

function Success({ message }: { message: string }) {
  return (
    <div className="rounded-xl2 bg-success-soft p-5 text-center">
      <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-success text-lg text-white">✓</div>
      <p className="font-sans text-[14px] text-success">{message}</p>
    </div>
  );
}

/** Public buyer inquiry → developer lead (brief §10, §18). */
export function ProjectInquiryForm({ projectId, unitTypes }: { projectId: string; unitTypes: string[] }) {
  const [state, action] = useFormState(projectInquiryAction, initial);
  if (state.ok) return <Success message={state.message!} />;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input name="name" placeholder="Your name" className="field" required />
      <input name="contact" placeholder="Mobile or email" className="field" />
      {unitTypes.length > 0 && (
        <select name="unitTypeInterest" className="field" defaultValue="">
          <option value="">Any unit type</option>
          {unitTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      {state.error && <p className="font-sans text-[13px] text-accent">{state.error}</p>}
      <Submit label="Contact developer" />
    </form>
  );
}

/** Authorized-agent register-client (brief §19). */
export function RegisterClientForm({ projectId, unitTypes }: { projectId: string; unitTypes: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(registerClientAction, initial);
  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-ghost w-full">Register a client</button>;
  }
  if (state.ok) return <Success message={state.message!} />;
  return (
    <form action={action} className="space-y-3 rounded-xl2 bg-surface p-4 shadow-card">
      <input type="hidden" name="projectId" value={projectId} />
      <p className="font-sans text-[13px] font-semibold text-ink-2">Register client (agent)</p>
      <input name="name" placeholder="Client name" className="field" required />
      <input name="contact" placeholder="Contact number" className="field" />
      <input name="email" placeholder="Email (optional)" className="field" />
      <div className="flex gap-2">
        <input name="budget" placeholder="Budget (e.g. ₱6M–₱8M)" className="field" />
        <select name="unitTypeInterest" className="field" defaultValue="">
          <option value="">Unit type</option>
          {unitTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {state.error && <p className="font-sans text-[13px] text-accent">{state.error}</p>}
      <Submit label="Register client" />
    </form>
  );
}

/** Reserve a specific unit (agent or buyer). Server enforces inventory lock. */
export function ReserveButton({ unitId, unitNumber }: { unitId: string; unitNumber: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(requestReservationAction, initial);
  if (state.ok) return <span className="font-sans text-[12px] font-semibold text-success">✓ Held</span>;
  if (state.error) return <span className="font-sans text-[12px] text-accent">{state.error}</span>;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg bg-accent-soft px-3 py-1.5 font-sans text-[12px] font-semibold text-accent">
        Reserve
      </button>
    );
  }
  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="unitId" value={unitId} />
      <input name="buyerName" placeholder={`Buyer for ${unitNumber}`} className="rounded-lg border border-line px-2 py-1.5 font-sans text-[12px] outline-none" required />
      <SubmitSmall />
    </form>
  );
}
function SubmitSmall() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-lg bg-accent px-3 py-1.5 font-sans text-[12px] font-semibold text-white disabled:opacity-60">
      {pending ? "…" : "Hold"}
    </button>
  );
}
