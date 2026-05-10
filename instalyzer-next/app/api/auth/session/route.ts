import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getFirebaseAdminAuth,
  getFirebaseSessionCookieName,
} from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_COOKIE_MAX_AGE_MS / 1000;

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        message: "we could not finish sign-in. please try again.",
      },
      { status: 400 },
    );
  }

  const idToken = typeof payload.idToken === "string" ? payload.idToken.trim() : "";

  if (!idToken) {
    return NextResponse.json(
      {
        message: "we could not finish sign-in. please try again.",
      },
      { status: 400 },
    );
  }

  try {
    await getFirebaseAdminAuth().verifyIdToken(idToken);

    const sessionCookie = await getFirebaseAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE_MS,
    });
    const cookieStore = await cookies();

    cookieStore.set(getFirebaseSessionCookieName(), sessionCookie, {
      httpOnly: true,
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({
      message: "signed in.",
    });
  } catch (error) {
    console.error("Firebase session creation failed", error);

    return NextResponse.json(
      {
        message: "we could not finish sign-in. please try again.",
      },
      { status: 401 },
    );
  }
}
