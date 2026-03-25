"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navLinks = [
  { href: "/app", label: "overview" },
  { href: "/help", label: "help" },
];

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <nav className="top-nav" aria-label="Primary">
      <div className="top-nav-brand">
        <span className="top-nav-icon top-nav-profile" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="8" r="4" />
          </svg>
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
          const isCurrent = pathname === link.href;

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

        <ThemeToggle />
      </div>
    </nav>
  );
}
