"use client";

import { usePathname } from "next/navigation";
import { DatasetCreationLoadingState } from "@/components/workspace/dataset-creation-loading-state";
import { WorkspaceLoadingState } from "@/components/workspace/dataset-workspace-route";
import { DatasetsIndexLoadingState } from "@/components/workspace/datasets-index-route";
import { NotFollowingBackLoadingState } from "@/components/workspace/not-following-back-loading-state";

export default function DatasetsLoading() {
  const pathname = usePathname();

  if (pathname?.includes("/tools/not-following-back")) {
    return <NotFollowingBackLoadingState />;
  }

  if (pathname === "/app/datasets") {
    return <DatasetsIndexLoadingState />;
  }

  if (pathname?.startsWith("/app/datasets/new")) {
    return <DatasetCreationLoadingState />;
  }

  return <WorkspaceLoadingState />;
}
