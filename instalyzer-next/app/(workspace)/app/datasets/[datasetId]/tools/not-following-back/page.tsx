import { RoutePlaceholder } from "@/components/layout/route-placeholder";

type ToolPageProps = {
  params: Promise<{
    datasetId: string;
  }>;
};

export default async function NotFollowingBackToolPage({ params }: ToolPageProps) {
  const { datasetId } = await params;

  return (
    <RoutePlaceholder
      route={`/app/datasets/${datasetId}/tools/not-following-back`}
      label="Tool 1: Not Following Back"
      description="This is the future native tool page that will replace the old iframe-based implementation."
      family="workspace"
      nextSteps={[
        "Extract and port the comparison logic into pure reusable modules.",
        "Rebuild list states, exports, and gating as first-class React UI.",
        "Keep the relationship-tool range guidance visible for non-all-time datasets.",
      ]}
      links={[
        { href: `/app/datasets/${datasetId}`, label: "Back to dataset workspace" },
        { href: "/help", label: "Export guidance" },
      ]}
    />
  );
}
