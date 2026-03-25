import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function DatasetsPage() {
  return (
    <RoutePlaceholder
      route="/app/datasets"
      label="Datasets index"
      description="This route will list reusable Instagram datasets and become the main jumping-off point for workspace activity."
      family="workspace"
      nextSteps={[
        "Build dataset cards and empty states.",
        "Add temporary local mock data behind a storage boundary.",
        "Link each dataset into its workspace route.",
      ]}
      links={[
        { href: "/app/datasets/new", label: "Create a dataset" },
        { href: "/app/datasets/demo-dataset", label: "Open sample dataset route" },
      ]}
    />
  );
}
