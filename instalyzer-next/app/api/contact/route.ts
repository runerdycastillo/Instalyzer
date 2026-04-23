import { NextResponse } from "next/server";
import {
  CONTACT_SUPPORT_CONTEXT_MAX_LENGTH,
  CONTACT_SUPPORT_EMAIL_MAX_LENGTH,
  CONTACT_SUPPORT_MESSAGE_MAX_LENGTH,
  CONTACT_SUPPORT_NAME_MAX_LENGTH,
  CONTACT_SUPPORT_SUBJECT_MAX_LENGTH,
  contactSupportCategoryValues,
  normalizeContactSupportText,
  isValidContactSupportEmail,
  type ContactSupportCategory,
} from "@/lib/contact/contact-support";
import { sendSupportEmail, SupportMailConfigError } from "@/lib/contact/support-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const requestLog = new Map<string, number[]>();

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

function trimMultilineInput(value: unknown) {
  return String(value || "").trim().replace(/\r\n/g, "\n");
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
        message: "The contact form request could not be read.",
      },
      { status: 400 },
    );
  }

  if (String(payload.website || "").trim()) {
    return NextResponse.json(
      {
        message: "Your message was received.",
      },
      { status: 200 },
    );
  }

  const email = normalizeContactSupportText(payload.email).slice(0, CONTACT_SUPPORT_EMAIL_MAX_LENGTH);
  const category = normalizeContactSupportText(payload.category) as ContactSupportCategory;
  const subject = normalizeContactSupportText(payload.subject).slice(
    0,
    CONTACT_SUPPORT_SUBJECT_MAX_LENGTH,
  );
  const context = normalizeContactSupportText(payload.context).slice(
    0,
    CONTACT_SUPPORT_CONTEXT_MAX_LENGTH,
  );
  const message = trimMultilineInput(payload.message).slice(0, CONTACT_SUPPORT_MESSAGE_MAX_LENGTH);
  const userAgent = request.headers.get("user-agent") || "";
  const fallbackName = email.split("@")[0]?.trim() || "Instalyzer contact";
  const name = normalizeContactSupportText(payload.name).slice(0, CONTACT_SUPPORT_NAME_MAX_LENGTH) || fallbackName;

  if (!email || !subject || !message) {
    return NextResponse.json(
      {
        message: "Please complete the required contact fields before sending your message.",
      },
      { status: 400 },
    );
  }

  if (!contactSupportCategoryValues.has(category)) {
    return NextResponse.json(
      {
        message: "Please choose a valid support category.",
      },
      { status: 400 },
    );
  }

  if (!isValidContactSupportEmail(email)) {
    return NextResponse.json(
      {
        message: "Please enter a valid reply email address.",
      },
      { status: 400 },
    );
  }

  try {
    await sendSupportEmail({
      name,
      email,
      category,
      subject,
      message,
      context,
      submittedAt: new Date().toISOString(),
      userAgent,
      ipAddress,
    });

    return NextResponse.json({
      message: "your message was sent. we'll reply to your email soon.",
    });
  } catch (error) {
    if (error instanceof SupportMailConfigError) {
      return NextResponse.json(
        {
          message:
            "The contact form is not fully configured yet. Please use the direct support inbox listed on this page for now.",
        },
        { status: 503 },
      );
    }

    console.error("Contact form delivery failed", error);

    return NextResponse.json(
      {
        message:
          "We could not deliver your message just now. Please try again or use the direct support inbox below.",
      },
      { status: 500 },
    );
  }
}
