import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth, type DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";

const DEFAULT_SESSION_COOKIE_NAME = "instalyzer_session";

export type CurrentUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  decodedToken: DecodedIdToken;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing Firebase Admin config value: ${name}`);
  }

  return value;
}

function getFirebaseAdminPrivateKey() {
  return getRequiredEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");
}

export function getFirebaseSessionCookieName() {
  return process.env.FIREBASE_AUTH_SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE_NAME;
}

export function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: getRequiredEnv("FIREBASE_ADMIN_PROJECT_ID"),
      clientEmail: getRequiredEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
      privateKey: getFirebaseAdminPrivateKey(),
    }),
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getFirebaseSessionCookieName())?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified === true,
      name: typeof decodedToken.name === "string" ? decodedToken.name : null,
      picture: typeof decodedToken.picture === "string" ? decodedToken.picture : null,
      decodedToken,
    };
  } catch {
    return null;
  }
}
