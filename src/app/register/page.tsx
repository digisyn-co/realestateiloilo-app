"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useState } from "react";
import { registerAction, type AuthState } from "@/lib/auth-actions";

export default function RegisterPage() {
  const [state, action] = useFormState<AuthState, FormData>(registerAction, {});
  const [role, setRole] = useState("BUYER");
  const isBroker = role === "BROKER";
  const isDeveloper = role === "DEVELOPER";
  const showCompany = isBroker || isDeveloper;

  return (
    <div className="grid min-h-screen place-items-center bg-app px-5 py-10">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="mb-1 block text-center font-serif text-[30px] text-ink">
          Real Estate <span className="italic text-accent">Iloilo</span>
        </Link>
        <p className="mb-8 text-center font-sans text-[14px] text-muted">Create your account.</p>

        <form action={action} className="space-y-3 rounded-xl2 bg-surface p-6 shadow-card">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "BUYER", label: "Buyer / Renter" },
              { v: "OWNER", label: "Owner" },
              { v: "BROKER", label: "Broker" },
              { v: "DEVELOPER", label: "Developer" },
            ].map((r) => (
              <button
                type="button"
                key={r.v}
                onClick={() => setRole(r.v)}
                className={`rounded-xl px-2 py-3 font-sans text-[12.5px] font-semibold ${role === r.v ? "bg-ink text-white" : "bg-sand text-ink-2"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="role" value={role} />
          <input name="name" placeholder="Full name" className="field" required />
          <input name="email" type="email" placeholder="Email" className="field" required />
          <input name="phone" placeholder="Mobile number (optional)" className="field" />
          <input name="password" type="password" placeholder="Password (8+ characters)" className="field" required />
          {showCompany && (
            <>
              <input name="company" placeholder={isDeveloper ? "Development company" : "Brokerage / company"} className="field" />
              {isBroker && <input name="licenseNumber" placeholder="PRC licence number" className="field" />}
              <p className="font-sans text-[12px] text-muted">
                {isDeveloper
                  ? "Developer accounts get a portal to manage projects, units and agent distribution. Verification (with a badge) follows admin approval."
                  : "Broker accounts are reviewed before verification. You can list right away; the verified badge follows approval."}
              </p>
            </>
          )}
          {state.error && <p className="font-sans text-[13px] text-accent">{state.error}</p>}
          <SubmitBtn />
        </form>

        <p className="mt-5 text-center font-sans text-[14px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      {pending ? "Creating…" : "Create account"}
    </button>
  );
}
