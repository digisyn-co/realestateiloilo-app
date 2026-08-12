"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "./db";
import { authenticate, createSession, destroySession, hashPassword } from "./auth";
import { ROLES } from "./enums";

export type AuthState = { error?: string };

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/browse");
  const user = await authenticate(email, password);
  if (!user) return { error: "Wrong email or password." };
  redirect(safeNext(next, user.role));
}

const registerSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  role: z.enum(ROLES).default("BUYER"),
  phone: z.string().optional(),
  company: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "BUYER",
    phone: formData.get("phone") || undefined,
    company: formData.get("company") || undefined,
    licenseNumber: formData.get("licenseNumber") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (existing) return { error: "An account with that email already exists." };

  const isAgent = ["AGENT", "BROKER", "DEVELOPER"].includes(d.role);
  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone,
      role: d.role,
      passwordHash: await hashPassword(d.password),
      agent: isAgent
        ? { create: { company: d.company, licenseNumber: d.licenseNumber, verified: false, contactEmail: d.email.toLowerCase() } }
        : undefined,
    },
  });
  await createSession(user.id);
  redirect(isAgent ? "/dashboard" : "/browse");
}

export async function logoutAction() {
  destroySession();
  redirect("/");
}

function safeNext(next: string, role: string): string {
  if (role === "ADMIN") return next.startsWith("/") ? next : "/admin";
  if (["AGENT", "BROKER", "DEVELOPER"].includes(role) && (next === "/browse" || next === "/")) return "/dashboard";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/browse";
}
