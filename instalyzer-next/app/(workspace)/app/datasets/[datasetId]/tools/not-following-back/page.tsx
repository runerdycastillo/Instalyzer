import { DatasetWorkspaceRoute } from "@/components/workspace/dataset-workspace-route";

type ToolPageProps = {
  params: Promise<{
    datasetId: string;
  }>;
};

export default async function NotFollowingBackToolPage({ params }: ToolPageProps) {
  const { datasetId } = await params;

  return <DatasetWorkspaceRoute datasetId={datasetId} activeToolId="not-following-back" />;
}
