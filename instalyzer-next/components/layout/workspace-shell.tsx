"use client";

import { Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { MarketingShellMetrics } from "@/components/layout/marketing-shell-metrics";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { ResponsiveWorkspaceGate } from "@/components/layout/responsive-workspace-gate";
import { ScrollBehaviorManager } from "@/components/layout/scroll-behavior-manager";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDatasetRoute = pathname.startsWith("/app/datasets");
  const isDevRoute = pathname.startsWith("/app/dev");
  const showDevTools = process.env.NODE_ENV !== "production";

  return (
    <div className="workspace-shell-frame workspace-shell-frame--focused">
      <Suspense fallback={null}>
        <ScrollBehaviorManager />
      </Suspense>

      <MarketingShellMetrics />

      <header className="marketing-header">
        <MarketingNav />
      </header>

      <ResponsiveWorkspaceGate />

      <div
        className={`workspace-focused-shell${
          isDatasetRoute ? " workspace-focused-shell--datasets" : ""
        }`}
      >
        <main className="workspace-focused-main">{children}</main>
      </div>

      {showDevTools ? (
        <Link
          href="/app/dev/export-audit"
          className={`workspace-dev-tools-fab${isDevRoute ? " is-active" : ""}`}
          aria-label="open dev tools"
          title="dev tools"
        >
          <Wrench size={15} aria-hidden="true" />
          <span>dev</span>
        </Link>
      ) : null}

      <SiteFooterV2 />
    </div>
  );
}
