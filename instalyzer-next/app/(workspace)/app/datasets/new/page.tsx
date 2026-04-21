import { Suspense } from "react";
import { DatasetCreationFlow } from "@/components/workspace/dataset-creation-flow";

export default function NewDatasetPage() {
  return (
    <Suspense fallback={null}>
      <DatasetCreationFlow />
    </Suspense>
  );
}
