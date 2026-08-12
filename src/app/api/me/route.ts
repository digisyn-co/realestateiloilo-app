import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// Minimal identity endpoint so the client can associate the OneSignal device
// with the logged-in user (OneSignal.login) without making the whole app dynamic.
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ userId: user?.id ?? null, role: user?.role ?? null });
}
