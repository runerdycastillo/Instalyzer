import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Site footer">
      <Link href="/" className="site-footer-brand" aria-label="Go to home page">
        <Image
          src="/assets/logo/instaylzer-logo.png"
          alt="Instalyzer logo"
          className="site-footer-logo"
          width={72}
          height={72}
        />
      </Link>

      <p className="site-footer-copy">Instalyzer © 2026</p>

      <div className="site-footer-spacer" aria-hidden="true" />
    </footer>
  );
}
