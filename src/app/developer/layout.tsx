import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashShell, NavItem } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/developer");
  if (user.role !== "DEVELOPER" && user.role !== "ADMIN") redirect("/browse");

  let pendingAccess = 0;
  let pendingReservations = 0;
  if (user.developerId) {
    [pendingAccess, pendingReservations] = await Promise.all([
      prisma.agentProjectAccess.count({ where: { project: { developerId: user.developerId }, status: "REQUESTED" } }),
      prisma.unitReservation.count({ where: { project: { developerId: user.developerId }, status: { in: ["REQUESTED", "HELD"] } } }),
    ]);
  }

  const nav: NavItem[] = [
    { href: "/developer", label: "Overview" },
    { href: "/developer/projects", label: "Projects" },
    { href: "/developer/units", label: "Units" },
    { href: "/developer/agents", label: "Agents", badge: pendingAccess || undefined },
    { href: "/developer/leads", label: "Leads" },
    { href: "/developer/reservations", label: "Reservations", badge: pendingReservations || undefined },
    { href: "/developer/sales", label: "Sales" },
    { href: "/developer/marketing", label: "Marketing Materials" },
    { href: "/developer/analytics", label: "Analytics" },
    { href: "/developer/settings", label: "Settings" },
  ];

  return (
    <DashShell nav={nav} kicker="Developer portal" userName={user.name}>
      {children}
    </DashShell>
  );
}
