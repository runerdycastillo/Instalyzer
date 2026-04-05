"use client";

import { CircleUserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useSyncExternalStore } from "react";
import {
  getActiveDatasetServerSnapshot,
  getLocalDatasetsServerSnapshot,
  readActiveDatasetId,
  readLocalDatasets,
  subscribeToActiveDataset,
  subscribeToLocalDatasets,
} from "@/lib/instagram/local-datasets";

export function MarketingNav() {
  const pathname = usePathname();
  const router = useRouter();
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
  const preferredDatasetId = activeDatasetId && datasets.some((dataset) => dataset.id === activeDatasetId)
    ? activeDatasetId
    : datasets[0]?.id || null;
  const overviewHref = preferredDatasetId ? `/app/datasets/${preferredDatasetId}` : "/app";
  const navLinks = [
    { href: overviewHref, label: "overview" },
    { href: "/help", label: "help" },
  ];

  return (
    <nav className="top-nav" aria-label="Primary">
      <div className="top-nav-brand">
        <span className="top-nav-icon top-nav-profile" aria-hidden="true">
          <CircleUserRound aria-hidden="true" strokeWidth={1.9} />
        </span>
      </div>

      <div className="top-nav-center">
        <Link
          href="/"
          className={`top-nav-logo-link${pathname === "/" ? " is-current" : ""}`}
          aria-label="Show home panel"
        >
          <Image
            src="/assets/logo/instaylzer-logo.png"
            alt="Instalyzer logo"
            className="top-nav-logo"
            width={96}
            height={96}
            priority
          />
        </Link>
      </div>

      <div className="top-nav-links">
        {navLinks.map((link) => {
          const isCurrent =
            link.label === "overview"
              ? pathname === overviewHref || (pathname === "/app" && !preferredDatasetId)
              : pathname === link.href;
          const handleClick =
            link.label === "overview"
              ? (event: MouseEvent<HTMLAnchorElement>) => {
                  event.preventDefault();
                  if (pathname === overviewHref) {
                    router.refresh();
                    return;
                  }
                  router.push(overviewHref);
                }
              : undefined;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`top-nav-link${isCurrent ? " is-current" : ""}`}
              aria-current={isCurrent ? "page" : undefined}
              onClick={handleClick}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
