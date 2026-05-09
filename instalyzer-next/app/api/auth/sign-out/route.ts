import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getFirebaseSessionCookieName } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set(getFirebaseSessionCookieName(), "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({
    message: "signed out.",
  });
}
