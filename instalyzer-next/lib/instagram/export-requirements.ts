export const INSTAGRAM_APP_URL = "https://www.instagram.com/";

export const REQUIRED_EXPORT_SETTINGS_TEXT =
  "customize information: all available information, date range: all time, and format: json.";

export type ExportQuickTipSection = {
  title: string;
  items: string[];
  labels?: string[];
  instagramLink?: boolean;
};

export const exportQuickTipSections: readonly ExportQuickTipSection[] = [
  {
    title: "before you start",
    items: [
      "stay logged into instagram in your browser so export links open smoothly.",
      "export preparation can take minutes or hours, depending on account size.",
    ],
    instagramLink: true,
  },
  {
    title: "required export settings",
    items: ["all available information", "all time", "JSON"],
    labels: ["customize information", "date range", "format"],
    instagramLink: true,
  },
  {
    title: "common issues",
    items: [
      "no file? check email and spam.",
      "wrong format? use JSON.",
      "limited data? re-export with all available information and all time.",
    ],
    instagramLink: true,
  },
] as const;
