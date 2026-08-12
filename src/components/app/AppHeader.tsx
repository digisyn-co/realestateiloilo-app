import Link from "next/link";
import { Bell, Mail, Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BrandLogo } from "@/components/BrandLogo";

// Desktop top nav + mobile brand header for the buyer app surface.
export async function AppHeader() {
  const user = await getSessionUser();
  let unread = 0;
  if (user) unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <header
      className="sticky top-0 z-40 bg-[#031A14]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-[58px] max-w-[1200px] items-center gap-3 px-4">
        <Link href="/browse" className="flex flex-none items-center" aria-label="The Iloilo Real Estate — Home">
          {/* horizontal lockup sits on the dark header seamlessly */}
          <BrandLogo variant="horizontal" className="h-8 w-auto md:h-9" />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <TopLink href="/browse">Browse</TopLink>
          <TopLink href="/map">Map</TopLink>
          <TopLink href="/saved">Saved</TopLink>
          <TopLink href="/compare">Compare</TopLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/ai"
            className="hidden items-center gap-2 rounded-full bg-[#D6A84F] px-4 py-2 font-sans text-[13px] font-semibold text-[#031A14] sm:inline-flex"
          >
            <Sparkles size={15} /> Ask AI
          </Link>
          <Link href="/account" className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <Bell size={16} className="text-[#F4F0E6]" />
            {unread > 0 && (
              <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#D6A84F] px-1 font-sans text-[10px] font-bold text-[#031A14]">
                {unread}
              </span>
            )}
          </Link>
          <Link href="/messages" className="hidden h-10 w-10 place-items-center rounded-full bg-white/10 sm:grid">
            <Mail size={15} className="text-[#F4F0E6]" />
          </Link>
          {user ? (
            <Link href="/account" className="grid h-10 w-10 place-items-center rounded-full bg-[#D6A84F] font-sans text-[13px] font-bold text-[#031A14]">
              {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </Link>
          ) : (
            <Link href="/login" className="rounded-full bg-[#D6A84F] px-4 py-2 font-sans text-[13px] font-semibold text-[#031A14]">
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
    <Link href={href} className="rounded-full px-3 py-2 font-sans text-[14px] font-medium text-[#F4F0E6]/85 hover:bg-white/10 hover:text-[#F4F0E6]">
      {children}
    </Link>
  );
}
