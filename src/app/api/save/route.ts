import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({ listingId: z.string().min(1), save: z.boolean() });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { listingId, save } = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (save) {
    await prisma.savedProperty.upsert({
      where: { userId_listingId: { userId: user.id, listingId } },
      create: { userId: user.id, listingId },
      update: {},
    });
  } else {
    await prisma.savedProperty.deleteMany({ where: { userId: user.id, listingId } });
  }
  return NextResponse.json({ saved: save });
}
