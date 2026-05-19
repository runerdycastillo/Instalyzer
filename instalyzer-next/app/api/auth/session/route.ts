import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getFirebaseAdminAuth,
  getFirebaseSessionCookieName,
} from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STANDARD_SESSION_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const REMEMBERED_SESSION_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

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
  const keepSignedIn = payload.keepSignedIn === true;
  const sessionCookieMaxAgeMs = keepSignedIn
    ? REMEMBERED_SESSION_COOKIE_MAX_AGE_MS
    : STANDARD_SESSION_COOKIE_MAX_AGE_MS;
  const sessionCookieMaxAgeSeconds = sessionCookieMaxAgeMs / 1000;

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
      expiresIn: sessionCookieMaxAgeMs,
    });
    const cookieStore = await cookies();

    cookieStore.set(getFirebaseSessionCookieName(), sessionCookie, {
      httpOnly: true,
      maxAge: sessionCookieMaxAgeSeconds,
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
