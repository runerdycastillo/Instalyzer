import { NextResponse } from "next/server";
import {
  DESKTOP_LINK_EMAIL_MAX_LENGTH,
  DESKTOP_LINK_META_MAX_LENGTH,
  DESKTOP_LINK_URL_MAX_LENGTH,
  isValidDesktopLinkEmail,
  normalizeDesktopLinkText,
  type DesktopLinkDeviceRange,
} from "@/lib/contact/desktop-link-shared";
import { sendDesktopLinkEmail } from "@/lib/contact/desktop-link";
import { SupportMailConfigError } from "@/lib/contact/support-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestLog = new Map<string, number[]>();
const validDeviceRanges = new Set<DesktopLinkDeviceRange>(["mobile", "tablet"]);

function getClientIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "";
  }

  return request.headers.get("x-real-ip") || "";
}

function applyRateLimit(ipAddress: string) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const now = Date.now();
  const key = ipAddress || "unknown";
  const recentTimestamps = (requestLog.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(key, recentTimestamps);
    return false;
  }

  recentTimestamps.push(now);
  requestLog.set(key, recentTimestamps);
  return true;
}

function normalizeMetaValue(value: unknown) {
  return normalizeDesktopLinkText(value).slice(0, DESKTOP_LINK_META_MAX_LENGTH);
}

function normalizeIntendedUrl(value: unknown, request: Request) {
  const rawValue = String(value || "").trim().slice(0, DESKTOP_LINK_URL_MAX_LENGTH);
  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const intendedUrl = new URL(rawValue || "/app", requestOrigin);

  if (intendedUrl.origin !== requestOrigin) {
    throw new Error("Desktop link must stay on instalyzer.app.");
  }

  if (!intendedUrl.pathname.startsWith("/app")) {
    throw new Error("Desktop link must point to the Instalyzer workspace.");
  }

  return intendedUrl.toString();
}

export async function POST(request: Request) {
  const ipAddress = getClientIpAddress(request);

  if (!applyRateLimit(ipAddress)) {
    return NextResponse.json(
      {
        message: "too many tries right now. wait a few minutes and try again.",
      },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        message: "The desktop link request could not be read.",
      },
      { status: 400 },
    );
  }

  const email = normalizeDesktopLinkText(payload.email).slice(
    0,
    DESKTOP_LINK_EMAIL_MAX_LENGTH,
  );
  const deviceRange = normalizeDesktopLinkText(payload.deviceRange) as DesktopLinkDeviceRange;
  const marketingOptIn = payload.marketingOptIn === true;

  let intendedUrl: string;

  try {
    intendedUrl = normalizeIntendedUrl(payload.intendedUrl, request);
  } catch {
    return NextResponse.json(
      {
        message: "Please copy the workspace link instead.",
      },
      { status: 400 },
    );
  }

  if (!email || !isValidDesktopLinkEmail(email)) {
    return NextResponse.json(
      {
        message: "Enter a valid email address.",
      },
      { status: 400 },
    );
  }

  if (!validDeviceRanges.has(deviceRange)) {
    return NextResponse.json(
      {
        message: "The desktop link request is missing the device range.",
      },
      { status: 400 },
    );
  }

  try {
    await sendDesktopLinkEmail({
      email,
      intendedUrl,
      deviceRange,
      marketingOptIn,
      source: normalizeMetaValue(payload.source),
      referrer: normalizeMetaValue(payload.referrer),
      utmSource: normalizeMetaValue(payload.utmSource),
      utmMedium: normalizeMetaValue(payload.utmMedium),
      utmCampaign: normalizeMetaValue(payload.utmCampaign),
      requestedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "desktop link sent.",
    });
  } catch (error) {
    if (error instanceof SupportMailConfigError) {
      return NextResponse.json(
        {
          message: "Desktop link email is not configured yet. Please copy the link instead.",
        },
        { status: 503 },
      );
    }

    console.error("Desktop link delivery failed", error);

    return NextResponse.json(
      {
        message: "We could not send that link just now. Please try again or copy the link instead.",
      },
      { status: 500 },
    );
  }
}
