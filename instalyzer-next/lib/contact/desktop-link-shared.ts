import { isValidContactSupportEmail } from "@/lib/contact/contact-support";

export type DesktopLinkDeviceRange = "mobile" | "tablet";

export const DESKTOP_LINK_EMAIL_MAX_LENGTH = 160;
export const DESKTOP_LINK_URL_MAX_LENGTH = 2000;
export const DESKTOP_LINK_META_MAX_LENGTH = 180;

export function normalizeDesktopLinkText(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function isValidDesktopLinkEmail(value: string) {
  return isValidContactSupportEmail(value);
}
