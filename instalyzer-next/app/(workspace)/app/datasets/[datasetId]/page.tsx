import { RoutePlaceholder } from "@/components/layout/route-placeholder";

type DatasetWorkspacePageProps = {
  params: Promise<{
    datasetId: string;
  }>;
};

export default async function DatasetWorkspacePage({
  params,
}: DatasetWorkspacePageProps) {
  const { datasetId } = await params;

  return (
    <RoutePlaceholder
      route={`/app/datasets/${datasetId}`}
      label={`Dataset workspace: ${datasetId}`}
      description="This route becomes the center of the product: profile identity, trusted overview metrics, metadata, and available tools."
      family="workspace"
      nextSteps={[
        "Render the top identity band and trusted overview metrics from the dataset schema.",
        "Add notes, metadata, and available tool cards.",
        "Keep weaker relationship metrics inside tool surfaces instead of the headline overview.",
      ]}
      links={[
        {
          href: `/app/datasets/${datasetId}/tools/not-following-back`,
          label: "Open Tool 1 route",
        },
        { href: "/app/datasets", label: "Back to datasets" },
      ]}
    />
  );
}
