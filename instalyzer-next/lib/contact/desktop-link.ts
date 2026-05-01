import { sendSupportMailboxMessage } from "@/lib/contact/support-mail";
import type { DesktopLinkDeviceRange } from "@/lib/contact/desktop-link-shared";

export type DesktopLinkRequest = {
  email: string;
  intendedUrl: string;
  deviceRange: DesktopLinkDeviceRange;
  marketingOptIn: boolean;
  source: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  requestedAt: string;
};

function buildDesktopLinkEmailBody(request: DesktopLinkRequest) {
  return [
    "Your Instalyzer desktop link is ready",
    "",
    "The Instalyzer workspace needs a desktop-sized screen.",
    "",
    "Use the link below on your laptop or desktop to continue where you left off.",
    "",
    `Open Instalyzer on desktop: ${request.intendedUrl}`,
    "",
    "If the link does not open, copy and paste it into your browser.",
    "",
    "No Instagram password required. You upload your own Instagram export.",
    "",
    "You received this email because you requested a desktop link from Instalyzer.",
  ].join("\n");
}

function getEnvValue(name: string) {
  return String(process.env[name] || "").trim();
}

function getDesktopLinkCaptureRecipients() {
  const rawRecipients =
    getEnvValue("DESKTOP_LINK_CAPTURE_TO") ||
    getEnvValue("CONTACT_SUPPORT_TO") ||
    getEnvValue("MICROSOFT_GRAPH_SENDER_USER") ||
    "support@instalyzer.app";

  return rawRecipients
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

function formatCaptureValue(value: string) {
  return value || "not provided";
}

function buildDesktopLinkCaptureEmailBody(request: DesktopLinkRequest) {
  return [
    "new desktop-link request from instalyzer.app",
    "",
    "email:",
    request.email,
    "",
    "desktop link:",
    request.intendedUrl,
    "",
    "device range:",
    request.deviceRange,
    "",
    "marketing updates opt-in:",
    request.marketingOptIn ? "yes" : "no",
    "",
    "source:",
    formatCaptureValue(request.source),
    "",
    "referrer:",
    formatCaptureValue(request.referrer),
    "",
    "utm source:",
    formatCaptureValue(request.utmSource),
    "",
    "utm medium:",
    formatCaptureValue(request.utmMedium),
    "",
    "utm campaign:",
    formatCaptureValue(request.utmCampaign),
    "",
    "---",
    `requested: ${request.requestedAt}`,
    "",
    "Consent note: if marketing updates opt-in is no, treat this as a transactional desktop-link request only.",
  ].join("\n");
}

export async function sendDesktopLinkEmail(request: DesktopLinkRequest) {
  await sendSupportMailboxMessage({
    toRecipients: [
      {
        email: request.email,
      },
    ],
    subject: "Your Instalyzer desktop link",
    body: buildDesktopLinkEmailBody(request),
    replyTo: [
      {
        email: "support@instalyzer.app",
        name: "Instalyzer",
      },
    ],
  });
}

export async function sendDesktopLinkCaptureEmail(request: DesktopLinkRequest) {
  await sendSupportMailboxMessage({
    toRecipients: getDesktopLinkCaptureRecipients(),
    subject: request.marketingOptIn
      ? "[Instalyzer Desktop Link] request with updates opt-in"
      : "[Instalyzer Desktop Link] request",
    body: buildDesktopLinkCaptureEmailBody(request),
  });
}
