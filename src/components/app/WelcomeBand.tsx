import Link from "next/link";
import { Home, KeyRound, Building2, ArrowRight } from "lucide-react";

/**
 * Premium welcome band (shown on the default browse view). Communicates the brand
 * promise — real estate made easy for everyone — with a clear path for each
 * audience: buyers, agents/brokers, and developers.
 */
const PATHS = [
  { icon: Home, label: "Buy or rent", sub: "Search, save, message — free.", href: "/browse", who: "For buyers" },
  { icon: KeyRound, label: "List a property", sub: "Publish in minutes, verified.", href: "/register", who: "For agents & brokers" },
  { icon: Building2, label: "Sell a project", sub: "Manage units & agents in one place.", href: "/register", who: "For developers" },
];

export function WelcomeBand() {
  return (
    <section className="mt-4 overflow-hidden rounded-xl2 bg-ink text-[#F4F0E6] shadow-cta">
      <div className="relative px-5 py-6 sm:px-7 sm:py-7">
        {/* subtle gold hairline flourish */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D6A84F]/60 to-transparent" />
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D6A84F]">
          Real estate made easy in Iloilo
        </div>
        <h2 className="mt-2 max-w-md font-serif text-[24px] leading-tight sm:text-[28px]">
          Whether you're buying, listing, or building — it's <span className="italic text-[#F3D38A]">effortless</span> here.
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.label}
                href={p.href}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition-colors hover:border-[#D6A84F]/50 hover:bg-white/[0.07]"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[#D6A84F]/15 text-[#D6A84F]">
                  <Icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#D6A84F]/80">{p.who}</span>
                  <span className="block font-sans text-[14.5px] font-semibold text-[#F4F0E6]">{p.label}</span>
                  <span className="block truncate font-sans text-[12px] text-[#F4F0E6]/55">{p.sub}</span>
                </span>
                <ArrowRight size={16} className="flex-none text-[#F4F0E6]/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#D6A84F]" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
