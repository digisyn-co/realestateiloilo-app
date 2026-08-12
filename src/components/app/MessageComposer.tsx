"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useEffect } from "react";
import { sendMessage, type ActionResult } from "@/lib/actions";

export function MessageComposer({ threadId }: { threadId: string }) {
  const [state, action] = useFormState<ActionResult, FormData>(sendMessage, { ok: false });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex gap-2">
      <input type="hidden" name="threadId" value={threadId} />
      <input name="body" placeholder="Write a message…" className="field flex-1" autoComplete="off" />
      <SendBtn />
    </form>
  );
}

function SendBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary flex-none !px-6 disabled:opacity-60">
      {pending ? "…" : "Send"}
    </button>
  );
}
