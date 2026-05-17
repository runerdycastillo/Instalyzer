"use client";

import { usePathname } from "next/navigation";
import { WorkspaceLoadingState } from "@/components/workspace/dataset-workspace-route";
import { NotFollowingBackLoadingState } from "@/components/workspace/not-following-back-loading-state";

export default function WorkspaceAppLoading() {
  const pathname = usePathname();

  if (pathname?.includes("/tools/not-following-back")) {
    return <NotFollowingBackLoadingState />;
  }

  return <WorkspaceLoadingState />;
}
