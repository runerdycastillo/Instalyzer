import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function NewDatasetPage() {
  return (
    <RoutePlaceholder
      route="/app/datasets/new"
      label="Create dataset"
      description="This route replaces the static modal-first flow with a real page for upload, review, and dataset setup."
      family="workspace"
      nextSteps={[
        "Rebuild upload, review, and setup as route-native sections.",
        "Extract the parser logic from the static scripts into reusable modules.",
        "Keep the current visual language, but replace the DOM-heavy state model.",
      ]}
      links={[
        { href: "/help", label: "Open export help" },
        { href: "/app/datasets", label: "Back to datasets" },
      ]}
    />
  );
}
