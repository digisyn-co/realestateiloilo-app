"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { loginAction, type AuthState } from "@/lib/auth-actions";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [state, action] = useFormState<AuthState, FormData>(loginAction, {});
  const next = useSearchParams().get("next") || "/browse";

  return (
    <div className="grid min-h-screen place-items-center bg-app px-5 py-10">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="mb-1 block text-center font-serif text-[30px] text-ink">
          The <span className="italic text-accent">Iloilo</span> Real Estate
        </Link>
        <p className="mb-8 text-center font-sans text-[14px] text-muted">Welcome back — sign in to save homes and message brokers.</p>

        <form action={action} className="space-y-3 rounded-xl2 bg-surface p-6 shadow-card">
          <input type="hidden" name="next" value={next} />
          <input name="email" type="email" placeholder="Email" className="field" required defaultValue="buyer@realestateiloilo.app" />
          <input name="password" type="password" placeholder="Password" className="field" required defaultValue="password123" />
          {state.error && <p className="font-sans text-[13px] text-accent">{state.error}</p>}
          <SubmitBtn />
          <div className="text-right">
            <span className="font-sans text-[13px] text-muted-2">Forgot password?</span>
          </div>
        </form>

        <p className="mt-5 text-center font-sans text-[14px] text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-accent">
            Create an account
          </Link>
        </p>
        <div className="mt-6 rounded-2xl bg-surface-warm p-4 font-sans text-[12.5px] leading-relaxed text-muted">
          <b className="text-ink-2">Demo logins</b> (password <code>password123</code>):<br />
          admin@realestateiloilo.app · carla@ilonggorealty.ph · buyer@realestateiloilo.app
        </div>
      </div>
    </div>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
