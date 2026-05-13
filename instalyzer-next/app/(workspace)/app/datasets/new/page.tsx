import { Suspense } from "react";
import { DatasetCreationFlow } from "@/components/workspace/dataset-creation-flow";
import NewDatasetLoading from "./loading";

export default function NewDatasetPage() {
  return (
    <Suspense fallback={<NewDatasetLoading />}>
      <DatasetCreationFlow />
    </Suspense>
  );
}
