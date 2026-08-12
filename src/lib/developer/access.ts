// Server-side access control for the developer ecosystem (brief §12, §16, §17, §33).
// Agent-only information (agent price, commission, sales kits) is NEVER exposed to
// public users — every gate here runs on the server.

import { prisma } from "../db";
import type { SessionUser } from "../auth";

export type Viewer = SessionUser | null;

/** Does this viewer have approved agent access to a project? */
export async function agentHasAccess(agentId: string | null | undefined, projectId: string): Promise<boolean> {
  if (!agentId) return false;
  const access = await prisma.agentProjectAccess.findUnique({
    where: { projectId_agentId: { projectId, agentId } },
  });
  return access?.status === "APPROVED";
}

/** Is the viewer the developer that owns this project? */
export function isProjectOwner(viewer: Viewer, project: { developer: { userId: string } }): boolean {
  return !!viewer && viewer.id === project.developer.userId;
}

/**
 * Whether the viewer may see agent-only information (agent price, commission,
 * agent-only docs, register-client, reserve). True for: the owning developer,
 * an admin, or an agent with APPROVED access to the project.
 */
export async function canSeeAgentInfo(
  viewer: Viewer,
  project: { id: string; developer: { userId: string } },
): Promise<boolean> {
  if (!viewer) return false;
  if (viewer.role === "ADMIN") return true;
  if (viewer.id === project.developer.userId) return true;
  if ((viewer.role === "AGENT" || viewer.role === "BROKER") && viewer.agentId) {
    return agentHasAccess(viewer.agentId, project.id);
  }
  return false;
}

/** Whether the viewer may view a project at all, given its visibility (brief §12). */
export async function canViewProject(
  viewer: Viewer,
  project: { id: string; visibility: string; developer: { userId: string } },
): Promise<boolean> {
  if (project.visibility === "PUBLIC") return true;
  if (!viewer) return false;
  if (viewer.role === "ADMIN") return true;
  if (viewer.id === project.developer.userId) return true;
  if (project.visibility === "AGENTS_ONLY") {
    return (viewer.role === "AGENT" || viewer.role === "BROKER") && (viewer.agentId ? true : false);
  }
  // PRIVATE — only owner/admin/explicitly-granted agents
  if (project.visibility === "PRIVATE") {
    return canSeeAgentInfo(viewer, project);
  }
  return false;
}

/** Prisma `where` fragment limiting a project query to what a viewer may list. */
export function visibleProjectsWhere(viewer: Viewer): import("@prisma/client").Prisma.ProjectWhereInput {
  if (viewer?.role === "ADMIN") return {};
  const or: import("@prisma/client").Prisma.ProjectWhereInput[] = [{ visibility: "PUBLIC" }];
  if (viewer) {
    or.push({ developer: { userId: viewer.id } });
    if ((viewer.role === "AGENT" || viewer.role === "BROKER") && viewer.agentId) {
      or.push({ visibility: "AGENTS_ONLY" });
      or.push({ agentAccess: { some: { agentId: viewer.agentId, status: "APPROVED" } } });
    }
  }
  return { OR: or };
}
