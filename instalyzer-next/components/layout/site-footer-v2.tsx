"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import {
  getActiveDatasetServerSnapshot,
  getLocalDatasetsServerSnapshot,
  getPreferredWorkspaceHref,
  readActiveDatasetId,
  readLocalDatasets,
  subscribeToActiveDataset,
  subscribeToLocalDatasets,
} from "@/lib/instagram/local-datasets";

type FooterLink = {
  label: string;
  href?: string;
  external?: boolean;
};

type FooterColumn = {
  heading: string;
  links?: FooterLink[];
  content?: ReactNode;
};

export function SiteFooterV2() {
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
  const workspaceHref = getPreferredWorkspaceHref(datasets, activeDatasetId);
  const footerColumns: FooterColumn[] = [
    {
      heading: "navigation",
      links: [
        { label: "workspace", href: workspaceHref },
        { label: "guide", href: "/help" },
        { label: "faq", href: "/#faq-section" },
      ],
    },
    {
      heading: "legal",
      links: [
        { label: "privacy policy", href: "/privacy" },
        { label: "terms of service", href: "/terms" },
        { label: "data deletion request", href: "/data-deletion-request" },
      ],
    },
    {
      heading: "contact support",
      content: (
        <div className="site-footer__support">
          <p className="site-footer__support-copy">
            questions, export issues, or product feedback.
          </p>
          <a href="mailto:support@instalyzer.app" className="site-footer__email">
            support@instalyzer.app
          </a>
          <p className="site-footer__copyright">Instalyzer &copy; 2026</p>
        </div>
      ),
    },
  ];

  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") {
      return;
    }

    event.preventDefault();
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer__shell">
        <div className="site-footer__brand">
          <Link
            href="/"
            className="site-footer__brand-link"
            aria-label="Go to home page"
            onClick={handleHomeClick}
          >
            <Image
              src="/assets/logo/instaylzer-logo.png"
              alt="Instalyzer logo"
              className="site-footer__logo"
              width={72}
              height={72}
            />
          </Link>
        </div>

        <div className="site-footer__grid">
          {footerColumns.map((column) => (
            <section key={column.heading} className="site-footer__column" aria-label={column.heading}>
              <h2 className="site-footer__heading">{column.heading}</h2>
              {column.links ? (
                <ul className="site-footer__list">
                  {column.links.map((link) => (
                    <li key={link.label} className="site-footer__item">
                      {link.external ? (
                        <a href={link.href} className="site-footer__link">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href || "/"} className="site-footer__link">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                column.content
              )}
            </section>
          ))}
        </div>
      </div>
    </footer>
  );
}
