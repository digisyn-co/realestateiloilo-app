import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashShell, NavItem } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/browse");

  const [pendingListings, openReports, pendingImports, pendingVerify] = await Promise.all([
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.importRecord.count({ where: { status: { in: ["NEEDS_REVIEW", "DUPLICATE"] } } }),
    prisma.user.count({ where: { verificationStatus: "PENDING", role: { in: ["BROKER", "AGENT", "DEVELOPER"] } } }),
  ]);

  const nav: NavItem[] = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Accounts", badge: pendingVerify || undefined },
    { href: "/admin/approvals", label: "Approvals", badge: pendingListings || undefined },
    { href: "/admin/reports", label: "Reported", badge: openReports || undefined },
    { href: "/admin/imports", label: "Imports", badge: pendingImports || undefined },
    { href: "/admin/duplicates", label: "Duplicates" },
    { href: "/admin/audit", label: "Audit Log" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <DashShell nav={nav} kicker="Admin console" userName={user.name}>
      {children}
    </DashShell>
  );
}
