import Link from "next/link";
import { Bell, Mail, Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Desktop top nav + mobile brand header for the buyer app surface.
export async function AppHeader() {
  const user = await getSessionUser();
  let unread = 0;
  if (user) unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <header className="sticky top-0 z-40 border-b border-line-2 bg-app/90 backdrop-blur">
      <div className="mx-auto flex h-[62px] max-w-[1200px] items-center gap-4 px-4">
        <Link href="/browse" className="font-serif text-[24px] leading-none text-ink">
          Real Estate <span className="italic text-accent">Iloilo</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          <TopLink href="/browse">Browse</TopLink>
          <TopLink href="/map">Map</TopLink>
          <TopLink href="/saved">Saved</TopLink>
          <TopLink href="/compare">Compare</TopLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/ai"
            className="hidden items-center gap-2 rounded-full bg-accent-soft px-4 py-2.5 font-sans text-[13px] font-semibold text-accent sm:inline-flex"
          >
            <Sparkles size={15} /> Ask AI
          </Link>
          <Link href="/account" className="relative grid h-[42px] w-[42px] place-items-center rounded-full bg-surface shadow-card">
            <Bell size={16} className="text-ink-2" />
            {unread > 0 && (
              <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 font-sans text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
          <Link href="/messages" className="grid h-[42px] w-[42px] place-items-center rounded-full bg-surface shadow-card">
            <Mail size={15} className="text-ink-2" />
          </Link>
          {user ? (
            <Link href="/account" className="grid h-[42px] w-[42px] place-items-center rounded-full bg-ink font-sans text-[13px] font-bold text-white">
              {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </Link>
          ) : (
            <Link href="/login" className="hidden rounded-full bg-ink px-4 py-2.5 font-sans text-[13px] font-semibold text-white sm:inline-flex">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function TopLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-full px-3 py-2 font-sans text-[14px] font-medium text-ink-2 hover:bg-sand">
      {children}
    </Link>
  );
}
