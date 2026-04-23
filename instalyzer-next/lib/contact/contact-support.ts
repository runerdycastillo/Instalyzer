export const contactSupportCategoryOptions = [
  { value: "export-issue", label: "export issue" },
  { value: "workspace-help", label: "workspace or tool help" },
  { value: "bug-report", label: "bug report" },
  { value: "product-feedback", label: "product feedback" },
  { value: "account-question", label: "account or access question" },
  { value: "other", label: "other" },
] as const;

export type ContactSupportCategory = (typeof contactSupportCategoryOptions)[number]["value"];

export const CONTACT_SUPPORT_NAME_MAX_LENGTH = 80;
export const CONTACT_SUPPORT_EMAIL_MAX_LENGTH = 160;
export const CONTACT_SUPPORT_SUBJECT_MAX_LENGTH = 140;
export const CONTACT_SUPPORT_CONTEXT_MAX_LENGTH = 160;
export const CONTACT_SUPPORT_MESSAGE_MAX_LENGTH = 2000;

export const contactSupportCategoryValues = new Set<ContactSupportCategory>(
  contactSupportCategoryOptions.map((option) => option.value),
);

export function normalizeContactSupportText(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function isValidContactSupportEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
