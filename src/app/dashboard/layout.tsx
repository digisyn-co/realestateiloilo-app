import { redirect } from "next/navigation";
import { getSessionUser, isAgentRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashShell, NavItem } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (!isAgentRole(user.role) && user.role !== "ADMIN") redirect("/browse");

  const openLeads = user.agentId ? await prisma.lead.count({ where: { agentId: user.agentId, stage: { in: ["NEW", "CONTACTED"] } } }) : 0;

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/listings", label: "My Listings" },
    { href: "/dashboard/listings/new", label: "Add Listing" },
    { href: "/dashboard/leads", label: "Leads", badge: openLeads || undefined },
    { href: "/dashboard/viewings", label: "Viewings" },
    { href: "/dashboard/imports", label: "Import Listings" },
    { href: "/dashboard/analytics", label: "Analytics" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <DashShell nav={nav} kicker="Broker workspace" userName={user.name}>
      {children}
    </DashShell>
  );
}
