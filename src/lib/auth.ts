// Lightweight session auth with server-side role enforcement (brief §10, §24).
// A signed JWT in an httpOnly cookie. Passwords are bcrypt-hashed. Role checks
// happen on the server — the frontend never decides authorisation.

import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { Role, ROLES } from "./enums";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-please-32chars");
const COOKIE = process.env.SESSION_COOKIE_NAME || "rei_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  agentId?: string | null;
  developerId?: string | null;
};

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession(): void {
  cookies().delete(COOKIE);
}

async function readUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

/** The current user, or null. Safe to call in any server component / route. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const id = await readUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, include: { agent: true, developer: true } });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (ROLES.includes(user.role as Role) ? user.role : "BUYER") as Role,
    avatarUrl: user.avatarUrl,
    agentId: user.agent?.id ?? null,
    developerId: user.developer?.id ?? null,
  };
}

// Agent-style roles (market/sell). Developers have their own portal (/developer).
const AGENT_ROLES: Role[] = ["AGENT", "BROKER"];

export function isAgentRole(role: Role): boolean {
  return AGENT_ROLES.includes(role);
}
export function isDeveloperRole(role: Role): boolean {
  return role === "DEVELOPER";
}

/** Throw-style guards used by dashboard/admin routes. Return the user or null. */
export async function requireUser(): Promise<SessionUser | null> {
  return getSessionUser();
}
export async function requireRole(roles: Role[]): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}
export async function requireAgent(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !isAgentRole(user.role)) return null;
  return user;
}
export async function requireAdmin(): Promise<SessionUser | null> {
  return requireRole(["ADMIN"]);
}
/** Developer portal guard. Admins are allowed through for oversight. */
export async function requireDeveloper(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || (user.role !== "DEVELOPER" && user.role !== "ADMIN")) return null;
  return user;
}

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() }, include: { agent: true, developer: true } });
  if (!user || !user.passwordHash) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  await createSession(user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    avatarUrl: user.avatarUrl,
    agentId: user.agent?.id ?? null,
    developerId: user.developer?.id ?? null,
  };
}
