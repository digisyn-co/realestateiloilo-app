"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Sparkles, Heart, User } from "lucide-react";

// The 5-tab bar from AppScreens.dc.html — Ask AI is the hero centre action.
const tabs = [
  { href: "/browse", label: "Home", icon: Home, match: (p: string) => p === "/browse" || p === "/" },
  { href: "/map", label: "Explore", icon: Compass, match: (p: string) => p.startsWith("/map") },
  { href: "/ai", label: "Ask AI", icon: Sparkles, center: true, match: (p: string) => p.startsWith("/ai") },
  { href: "/saved", label: "Saved", icon: Heart, match: (p: string) => p.startsWith("/saved") || p.startsWith("/compare") },
  { href: "/account", label: "Account", icon: User, match: (p: string) => p.startsWith("/account") },
];

export function BottomTabs() {
  const pathname = usePathname() || "";
  return (
    <nav className="sticky bottom-0 z-40 mx-auto flex w-full max-w-[720px] items-end justify-around border-t border-line-2 bg-app/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      {tabs.map((t) => {
        const active = t.match(pathname);
        const Icon = t.icon;
        if (t.center) {
          return (
            <Link key={t.href} href={t.href} className="-mt-6 flex flex-col items-center gap-1" aria-label={t.label}>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-cta">
                <Icon size={22} />
              </span>
              <span className={`font-sans text-[10.5px] font-semibold ${active ? "text-accent" : "text-muted"}`}>{t.label}</span>
            </Link>
          );
        }
        return (
          <Link key={t.href} href={t.href} className="flex flex-1 flex-col items-center gap-1 py-1" aria-label={t.label}>
            <Icon size={21} className={active ? "text-accent" : "text-muted-2"} />
            <span className={`font-sans text-[10.5px] font-semibold ${active ? "text-accent" : "text-muted"}`}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
