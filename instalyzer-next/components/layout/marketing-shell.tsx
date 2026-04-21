import { Suspense, type ReactNode } from "react";
import { MarketingShellMetrics } from "@/components/layout/marketing-shell-metrics";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { ScrollBehaviorManager } from "@/components/layout/scroll-behavior-manager";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-shell">
      <Suspense fallback={null}>
        <ScrollBehaviorManager />
      </Suspense>
      <MarketingShellMetrics />

      <header className="marketing-header">
        <MarketingNav />
      </header>

      <main className="marketing-main">
        <div className="page-frame">{children}</div>
      </main>

      <SiteFooterV2 />
    </div>
  );
}
