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
