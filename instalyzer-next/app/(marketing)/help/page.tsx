import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function HelpPage() {
  return (
    <RoutePlaceholder
      route="/help"
      label="Export guide"
      description="This placeholder marks the future home of the polished quick guide and visual guide flow from the static export-help page."
      family="marketing"
      nextSteps={[
        "Port the two-mode quick guide and visual guide structure.",
        "Bring over the screenshot flow assets and CTA behavior.",
        "Rebuild the create/upload entry point with cleaner route-based state.",
      ]}
      links={[
        { href: "/", label: "Back to home" },
        { href: "/app/datasets/new", label: "Jump to dataset creation route" },
      ]}
    />
  );
}
