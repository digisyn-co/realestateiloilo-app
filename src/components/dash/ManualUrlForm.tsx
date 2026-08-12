"use client";

import { useFormState, useFormStatus } from "react-dom";
import { manualUrlImportAction } from "@/lib/dashboard-actions";

export function ManualUrlForm() {
  const [state, action] = useFormState(manualUrlImportAction, {});
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row">
      <input name="url" placeholder="Paste a listing URL (https://…)" className="dfield flex-1" />
      <SubmitBtn />
      {state.error && <p className="text-[13px] text-[#E2712B] sm:w-full">{state.error}</p>}
      {state.ok && <p className="text-[13px] text-[#7E9877] sm:w-full">Imported — see the review queue below. Only permitted metadata was retrieved; images stay flagged until rights are confirmed.</p>}
    </form>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="flex-none border border-[#C9A227] bg-[#C9A227] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B0A08] disabled:opacity-60">
      {pending ? "Fetching…" : "Import"}
    </button>
  );
}
