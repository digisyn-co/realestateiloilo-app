import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, GitCompare, Bell, MessageCircle, LayoutDashboard, Building2, Shield, Settings, LogOut, ChevronRight, type LucideIcon } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/lib/auth-actions";
import { initials } from "@/lib/format";
import { isAgentRole, isDeveloperRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");

  const [saved, unread, notifs] = await Promise.all([
    prisma.savedProperty.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const rows1 = [
    { icon: Heart, label: "Saved homes", href: "/saved", meta: `${saved}` },
    { icon: GitCompare, label: "Compare", href: "/compare" },
    { icon: MessageCircle, label: "Messages", href: "/messages" },
    { icon: Bell, label: "Notifications", href: "/account#notifications", meta: unread ? `${unread} new` : undefined },
  ];
  const rows2 = [
    ...(isAgentRole(user.role) ? [{ icon: LayoutDashboard, label: "Broker dashboard", href: "/dashboard" }] : []),
    ...(isDeveloperRole(user.role) ? [{ icon: Building2, label: "Developer portal", href: "/developer" }] : []),
    ...(user.role === "ADMIN" ? [{ icon: Shield, label: "Admin dashboard", href: "/admin" }, { icon: Building2, label: "Developer portal", href: "/developer" }] : []),
    { icon: Settings, label: "Settings", href: "/account#settings" },
  ];

  return (
    <div className="mx-auto max-w-[560px] pt-6">
      <div className="flex items-center gap-4 rounded-xl2 bg-surface p-5 shadow-card">
        <div className="grid h-16 w-16 flex-none place-items-center rounded-full bg-ink font-sans text-[20px] font-bold text-white">
          {initials(user.name)}
        </div>
        <div className="min-w-0">
          <div className="font-serif text-[24px] leading-none text-ink">{user.name}</div>
          <div className="mt-1.5 truncate font-sans text-[13.5px] text-muted">{user.email}</div>
          <span className="mt-2 inline-block rounded-full bg-accent-soft px-2.5 py-1 font-sans text-[11.5px] font-semibold uppercase tracking-wide text-accent">
            {user.role.toLowerCase()}
          </span>
        </div>
      </div>

      <MenuGroup rows={rows1} />
      {rows2.length > 0 && <MenuGroup rows={rows2} />}

      <div id="notifications" className="mt-6">
        <h2 className="mb-3 font-serif text-[22px] text-ink">Notifications</h2>
        <div className="grid gap-px overflow-hidden rounded-2xl bg-line-2">
          {notifs.length > 0 ? (
            notifs.map((n) => (
              <Link key={n.id} href={n.href || "#"} className="flex items-start gap-3 bg-surface px-4 py-3.5">
                {!n.readAt && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-accent" />}
                <div className={n.readAt ? "opacity-70" : ""}>
                  <div className="font-sans text-[14px] font-semibold text-ink">{n.title}</div>
                  {n.body && <div className="font-sans text-[13px] text-muted">{n.body}</div>}
                </div>
              </Link>
            ))
          ) : (
            <div className="bg-surface px-4 py-6 text-center font-sans text-[13.5px] text-muted">No notifications yet.</div>
          )}
        </div>
      </div>

      <form action={logoutAction} className="mt-6">
        <button className="btn-ghost w-full !text-accent">
          <LogOut size={17} /> Sign out
        </button>
      </form>
      <p className="mt-6 text-center font-sans text-[12px] text-muted-2">Real Estate Iloilo · Version 1.0.0 · Iloilo City</p>
    </div>
  );
}

function MenuGroup({ rows }: { rows: { icon: LucideIcon; label: string; href: string; meta?: string }[] }) {
  return (
    <div className="mt-4 grid gap-px overflow-hidden rounded-2xl bg-line-2">
      {rows.map((r) => {
        const Icon = r.icon;
        return (
          <Link key={r.label} href={r.href} className="flex items-center gap-3 bg-surface px-4 py-4">
            <Icon size={18} className="text-ink-2" />
            <span className="flex-1 font-sans text-[14.5px] font-medium text-ink">{r.label}</span>
            {r.meta && <span className="font-sans text-[13px] text-muted">{r.meta}</span>}
            <ChevronRight size={17} className="text-muted-2" />
          </Link>
        );
      })}
    </div>
  );
}
