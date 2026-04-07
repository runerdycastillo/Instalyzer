"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MarketingShellMetrics } from "@/components/layout/marketing-shell-metrics";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { SiteFooter } from "@/components/layout/site-footer";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDatasetRoute = pathname.startsWith("/app/datasets");

  return (
    <div className="workspace-shell-frame workspace-shell-frame--focused">
      <MarketingShellMetrics />

      <header className="marketing-header">
        <MarketingNav />
      </header>

      <div
        className={`workspace-focused-shell${
          isDatasetRoute ? " workspace-focused-shell--datasets" : ""
        }`}
      >
        <main className="workspace-focused-main">{children}</main>
      </div>

      <SiteFooter />
    </div>
  );
}
