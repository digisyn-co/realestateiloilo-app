"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";

export type NavItem = { href: string; label: string; badge?: number };

// Dark, gold-accented shell for the Broker + Admin dashboards
// (Broker/Admin Dashboard.dc.html — bg #0A1C33, accent #C6A15C).
export function DashShell({
  nav,
  kicker,
  userName,
  children,
}: {
  nav: NavItem[];
  kicker: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A1C33] font-sans text-[#EDE7D6]">
      {/* mobile top bar */}
      <div className="flex items-center gap-3 border-b border-[#1A3550] px-4 py-3 md:hidden">
        <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-lg bg-[#10283F]">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className="font-serif text-[20px]">
          The <span className="italic text-[#C6A15C]">Iloilo</span> Real Estate
        </div>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className={`${open ? "block" : "hidden"} fixed inset-x-0 top-[57px] z-40 border-b border-[#1A3550] bg-[#0A1C33] md:static md:block md:w-[240px] md:flex-none md:border-b-0 md:border-r`}>
          <div className="hidden px-6 py-6 md:block">
            <div className="font-serif text-[22px] leading-none">
              The <span className="italic text-[#C6A15C]">Iloilo</span> Real Estate
            </div>
            <div className="mt-2 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#8AA0B4]">{kicker}</div>
          </div>
          <nav className="flex flex-col gap-0.5 p-3">
            {nav.map((n) => {
              const active = pathname === n.href || (n.href !== nav[0].href && pathname.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[13.5px] font-medium ${
                    active ? "bg-[#10283F] text-[#C6A15C]" : "text-[#EDE7D6]/70 hover:bg-[#0C2138] hover:text-[#EDE7D6]"
                  }`}
                >
                  <span>{n.label}</span>
                  {n.badge ? <span className="rounded-full bg-[#C6A15C] px-1.5 py-0.5 text-[10px] font-bold text-[#0A1C33]">{n.badge}</span> : null}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-[#1A3550] p-3">
            <div className="px-3 py-2 text-[12px] text-[#8AA0B4]">{userName}</div>
            <form action={logoutAction}>
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#EDE7D6]/70 hover:bg-[#0C2138]">
                <LogOut size={15} /> Sign out
              </button>
            </form>
            <Link href="/" className="mt-1 block px-3 py-2 text-[12px] text-[#8AA0B4] hover:text-[#C6A15C]">
              ← Back to site
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

// shared dark UI atoms
export function Kpi({ value, label, tone }: { value: React.ReactNode; label: string; tone?: "gold" | "green" | "orange" }) {
  const color = tone === "green" ? "#5FA39C" : tone === "orange" ? "#E2712B" : tone === "gold" ? "#C6A15C" : "#EDE7D6";
  return (
    <div className="border border-[#1A3550] bg-[#0D2540] p-5">
      <div className="font-serif text-[30px] leading-none tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="mt-2.5 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#8AA0B4]">{label}</div>
    </div>
  );
}

export function Panel({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-[#1A3550] bg-[#0D2540]">
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-[#1A3550] px-5 py-4">
          {title && <h2 className="font-serif text-[20px]">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-serif text-[clamp(28px,4vw,40px)] leading-none tracking-[-.02em]">{title}</h1>
      {subtitle && <p className="mt-2 text-[13.5px] text-[#8AA0B4]">{subtitle}</p>}
    </div>
  );
}
