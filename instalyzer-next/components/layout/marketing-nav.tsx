"use client";

import { CircleUserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type MouseEvent } from "react";
import {
  getActiveDatasetServerSnapshot,
  getLocalDatasetsServerSnapshot,
  getPreferredWorkspaceHref,
  readActiveDatasetId,
  readLocalDatasets,
  subscribeToActiveDataset,
  subscribeToLocalDatasets,
} from "@/lib/instagram/local-datasets";

export function MarketingNav() {
  const pathname = usePathname();
  const activeDatasetId = useSyncExternalStore(
    subscribeToActiveDataset,
    readActiveDatasetId,
    getActiveDatasetServerSnapshot,
  );
  const datasets = useSyncExternalStore(
    subscribeToLocalDatasets,
    readLocalDatasets,
    getLocalDatasetsServerSnapshot,
  );
  const overviewHref = getPreferredWorkspaceHref(datasets, activeDatasetId);
  const navLinks = [
    { href: overviewHref, label: "workspace" },
    { href: "/help", label: "guide" },
  ];
  const isAccountCurrent = pathname.startsWith("/account");

  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") {
      return;
    }

    event.preventDefault();
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <nav className="top-nav" aria-label="Primary">
      <div className="top-nav-brand">
        <Link
          href="/"
          className={`top-nav-logo-link${pathname === "/" ? " is-current" : ""}`}
          aria-label="Show Instalyzer home"
          onClick={handleHomeClick}
        >
          <Image
            src="/assets/logo/instaylzer-logo.png"
            alt="Instalyzer logo"
            className="top-nav-logo"
            width={88}
            height={88}
            priority
          />
          <span className="top-nav-wordmark">Instalyzer</span>
        </Link>
      </div>

      <div className="top-nav-links">
        {navLinks.map((link) => {
          const isCurrent =
            link.label === "workspace" ? pathname.startsWith("/app") : pathname.startsWith("/help");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`top-nav-link${isCurrent ? " is-current" : ""}`}
              aria-current={isCurrent ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/account"
          className={`top-nav-link top-nav-link--account${isAccountCurrent ? " is-current" : ""}`}
          aria-label="account"
          aria-current={isAccountCurrent ? "page" : undefined}
        >
          <CircleUserRound aria-hidden="true" strokeWidth={1.9} />
        </Link>
      </div>
    </nav>
  );
}
