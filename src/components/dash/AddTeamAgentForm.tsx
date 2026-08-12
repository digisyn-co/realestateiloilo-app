"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createTeamAgentAction } from "@/lib/dashboard-actions";

export function AddTeamAgentForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createTeamAgentAction, {});

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="border border-[#D6A84F] bg-[#D6A84F] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#031A14]">
        + Add an agent
      </button>
    );
  }
  if (state.message) {
    return <div className="border border-[#2E5A40] bg-[#0B241A] p-4 text-[13.5px] text-[#6FB58F]">{state.message}</div>;
  }

  return (
    <form action={action} className="grid gap-3 border border-[#1A3550] bg-[#0A1B14] p-4 md:grid-cols-2">
      <Field label="Agent name"><input name="name" className="dfield" required /></Field>
      <Field label="Title (optional)"><input name="title" className="dfield" placeholder="Senior Agent" /></Field>
      <Field label="Email"><input name="email" type="email" className="dfield" required /></Field>
      <Field label="Mobile (optional)"><input name="phone" className="dfield" /></Field>
      <Field label="Temporary password"><input name="password" className="dfield" placeholder="8+ characters" required /></Field>
      <div className="flex items-end gap-2">
        <Submit />
        <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-[#95A79C] hover:text-[#F4F0E6]">Cancel</button>
      </div>
      {state.error && <p className="text-[13px] text-[#E2712B] md:col-span-2">{state.error}</p>}
      <p className="text-[11.5px] text-[#61796C] md:col-span-2">The agent signs in with this email + temporary password. Their listings come to you for approval before going live.</p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="border border-[#D6A84F] bg-[#D6A84F] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#031A14] disabled:opacity-60">
      {pending ? "Adding…" : "Add agent"}
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
