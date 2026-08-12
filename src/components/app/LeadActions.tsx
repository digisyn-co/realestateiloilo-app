"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { Phone, MessageCircle, CalendarClock } from "lucide-react";
import { submitInquiry, requestViewing, submitReport, type ActionResult } from "@/lib/actions";
import { REPORT_REASONS } from "@/lib/enums";

const initial: ActionResult = { ok: false };

export function LeadActions({ listingId, agentName, openReport }: { listingId: string; agentName?: string; openReport?: boolean }) {
  const [tab, setTab] = useState<"none" | "message" | "viewing" | "report">(openReport ? "report" : "none");

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setTab(tab === "message" ? "none" : "message")} className="btn-primary col-span-1 flex-col gap-1 !rounded-2xl py-3 text-[13px]">
          <MessageCircle size={18} /> Message
        </button>
        <button onClick={() => setTab(tab === "viewing" ? "none" : "viewing")} className="btn-ghost col-span-1 flex-col gap-1 !rounded-2xl py-3 text-[13px]">
          <CalendarClock size={18} /> Viewing
        </button>
        <a href="tel:+639170000000" className="btn-ghost col-span-1 flex-col gap-1 !rounded-2xl py-3 text-[13px]">
          <Phone size={18} /> Call
        </a>
      </div>

      {tab === "message" && <InquiryForm listingId={listingId} channel="MESSAGE" agentName={agentName} />}
      {tab === "viewing" && <ViewingForm listingId={listingId} />}
      {tab === "report" && <ReportForm listingId={listingId} />}
    </div>
  );
}

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      {pending ? "Sending…" : label}
    </button>
  );
}

function InquiryForm({ listingId, channel, agentName }: { listingId: string; channel: string; agentName?: string }) {
  const [state, action] = useFormState(submitInquiry, initial);
  if (state.ok) return <Success message={state.message!} />;
  return (
    <form action={action} className="mt-4 space-y-3 rounded-xl2 bg-surface p-4 shadow-card">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="channel" value={channel} />
      <p className="font-sans text-[13px] text-muted">Message {agentName || "the broker"} directly.</p>
      <input name="name" placeholder="Your name" className="field" required />
      <input name="phone" placeholder="Mobile number" className="field" />
      <textarea name="message" rows={3} placeholder="Hi, is this still available? I'd like to schedule a viewing." className="field resize-none" required />
      {state.error && <p className="font-sans text-[13px] text-accent">{state.error}</p>}
      <SubmitBtn label="Send message" />
    </form>
  );
}

function ViewingForm({ listingId }: { listingId: string }) {
  const [state, action] = useFormState(requestViewing, initial);
  const slots = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];
  const [slot, setSlot] = useState(slots[1]);
  const today = new Date();
  const min = today.toISOString().slice(0, 10);
  if (state.ok) return <Success message={state.message!} />;
  return (
    <form action={action} className="mt-4 space-y-3 rounded-xl2 bg-surface p-4 shadow-card">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="slotLabel" value={slot} />
      <p className="font-sans text-[13px] text-muted">Request a viewing</p>
      <input type="date" name="scheduledAt" min={min} defaultValue={min} className="field" required />
      <div className="flex flex-wrap gap-2">
        {slots.map((s) => (
          <button type="button" key={s} onClick={() => setSlot(s)} className={`rounded-full px-3.5 py-2 font-sans text-[13px] font-semibold ${slot === s ? "bg-ink text-white" : "bg-sand text-ink-2"}`}>
            {s}
          </button>
        ))}
      </div>
      {state.error && <p className="font-sans text-[13px] text-accent">{state.error}</p>}
      <SubmitBtn label="Request this viewing" />
    </form>
  );
}

function ReportForm({ listingId }: { listingId: string }) {
  const [state, action] = useFormState(submitReport, initial);
  if (state.ok) return <Success message={state.message!} />;
  const labels: Record<string, string> = { SCAM: "Looks like a scam", DUPLICATE: "Duplicate listing", WRONG_INFO: "Wrong information", SOLD: "Already sold/rented", OFFENSIVE: "Offensive content", OTHER: "Other" };
  return (
    <form action={action} className="mt-4 space-y-3 rounded-xl2 bg-surface p-4 shadow-card">
      <input type="hidden" name="listingId" value={listingId} />
      <p className="font-sans text-[13px] font-semibold text-ink-2">Report this listing</p>
      <select name="reason" className="field" defaultValue="">
        <option value="" disabled>
          Choose a reason
        </option>
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {labels[r]}
          </option>
        ))}
      </select>
      <textarea name="detail" rows={2} placeholder="Add any details (optional)" className="field resize-none" />
      {state.error && <p className="font-sans text-[13px] text-accent">{state.error}</p>}
      <SubmitBtn label="Submit report" />
    </form>
  );
}

function Success({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl2 bg-success-soft p-5 text-center">
      <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-success text-lg text-white">✓</div>
      <p className="font-sans text-[14px] text-success">{message}</p>
    </div>
  );
}
