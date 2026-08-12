import { redirect } from "next/navigation";
import { getSessionUser, isAgentRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashShell, NavItem } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (!isAgentRole(user.role) && user.role !== "ADMIN") redirect("/browse");

  // Head broker = BROKER role; sees team-management + agent-listing review.
  const isHead = user.role === "BROKER" || user.role === "ADMIN";
  let pendingReview = 0;
  if (isHead && user.agentId) {
    pendingReview = await prisma.listing.count({ where: { agent: { headBrokerId: user.agentId }, status: "PENDING_BROKER_REVIEW" } });
  }
  const openLeads = user.agentId ? await prisma.lead.count({ where: { agentId: user.agentId, stage: { in: ["NEW", "CONTACTED"] } } }) : 0;

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/listings", label: "My Listings" },
    { href: "/dashboard/listings/new", label: "Add Listing" },
    ...(isHead
      ? [
          { href: "/dashboard/team", label: "My Agents" },
          { href: "/dashboard/review", label: "Agent Listings", badge: pendingReview || undefined },
        ]
      : []),
    { href: "/dashboard/leads", label: "Leads", badge: openLeads || undefined },
    { href: "/dashboard/viewings", label: "Viewings" },
    { href: "/dashboard/imports", label: "Import Listings" },
    { href: "/dashboard/analytics", label: "Analytics" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <DashShell nav={nav} kicker={user.role === "BROKER" ? "Head broker workspace" : "Agent workspace"} userName={user.name}>
      {children}
    </DashShell>
  );
}
