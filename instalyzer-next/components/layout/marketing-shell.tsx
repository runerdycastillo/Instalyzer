import type { ReactNode } from "react";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { ScrollBehaviorManager } from "@/components/layout/scroll-behavior-manager";
import { SiteFooter } from "@/components/layout/site-footer";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-shell">
      <ScrollBehaviorManager />

      <header className="marketing-header">
        <MarketingNav />
      </header>

      <main className="marketing-main">
        <div className="page-frame">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
