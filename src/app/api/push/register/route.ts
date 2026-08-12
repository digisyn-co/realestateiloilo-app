import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({ token: z.string().min(8), platform: z.enum(["ios", "android", "web"]) });

/**
 * Stores a native push token for the current device (brief: notifications).
 * Sending pushes still requires APNs (iOS) + FCM (Android) credentials and a
 * server-side sender — see MOBILE.md. This just records the target tokens.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getSessionUser();
  const { token, platform } = parsed.data;
  await prisma.pushDevice.upsert({
    where: { token },
    create: { token, platform, userId: user?.id ?? null },
    update: { userId: user?.id ?? null, platform },
  });
  return NextResponse.json({ ok: true });
}
