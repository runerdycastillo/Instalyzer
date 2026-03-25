import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";

const workspaceLinks = [
  { href: "/app", label: "Overview" },
  { href: "/app/datasets", label: "Datasets" },
  { href: "/app/datasets/new", label: "Create Dataset" },
];

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="workspace-shell-frame">
      <div className="workspace-shell">
        <aside className="workspace-sidebar">
          <Link href="/" className="brand-mark brand-mark--sidebar">
            <span className="brand-mark__dot" />
            <span>Instalyzer</span>
          </Link>

          <div className="workspace-sidebar__label">Workspace routes</div>

          <nav className="workspace-nav" aria-label="Workspace">
            {workspaceLinks.map((link) => (
              <Link key={link.href} href={link.href} className="workspace-nav__link">
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="workspace-main">
          <header className="workspace-topbar">
            <div>
              <p className="workspace-topbar__eyebrow">Dataset workspace</p>
              <h1>Migration route skeleton</h1>
            </div>

            <Link href="/help" className="topbar-link">
              Export help
            </Link>
          </header>

          <div className="workspace-content">{children}</div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
