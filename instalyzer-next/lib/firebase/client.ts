import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
};

let authInstance: Auth | null = null;

function getRequiredConfigValue(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing Firebase web config value: ${name}`);
  }

  return value;
}

function getFirebaseWebConfig(): FirebaseWebConfig {
  return {
    apiKey: getRequiredConfigValue(
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    ),
    authDomain: getRequiredConfigValue(
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    ),
    projectId: getRequiredConfigValue(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    ),
    appId: getRequiredConfigValue(
      "NEXT_PUBLIC_FIREBASE_APP_ID",
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    ),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };
}

export function getFirebaseClientApp(): FirebaseApp {
  if (getApps().length) {
    return getApp();
  }

  return initializeApp(getFirebaseWebConfig());
}

export function getFirebaseClientAuth() {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseClientApp());
  }

  return authInstance;
}

export function getGoogleAuthProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  return provider;
}
