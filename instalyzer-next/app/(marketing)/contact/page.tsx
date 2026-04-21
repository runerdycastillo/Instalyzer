import { MarketingInfoPage } from "@/components/marketing/marketing-info-page";
import { ContactInboxEmail } from "@/components/marketing/contact-inbox-email";
import Link from "next/link";

export default function ContactPage() {
  return (
    <MarketingInfoPage
      eyebrow="contact"
      title="Contact Us"
      description="questions, support requests, and product feedback can come through our support inbox during the current soft launch."
      heroMeta={[
        "typical response time: 24-48 hours",
        "support available monday-friday",
      ]}
      sections={[
        {
          title: "Best place to start",
          body: (
            <>
              <p>
                The guide is usually faster for export setup, upload issues, and
                understanding tool results.
              </p>
              <Link href="/help" className="marketing-info-page__inline-link">
                open guide
              </Link>
            </>
          ),
        },
        {
          title: "What to include in your email",
          body: (
            <>
              <p>A few details help us troubleshoot faster.</p>
              <ul className="marketing-info-page__checklist">
                <li>what happened</li>
                <li>tool or page being used</li>
                <li>screenshot if possible</li>
                <li>browser or device</li>
                <li>whether it involved an export upload</li>
                <li>export ZIP or JSON if you are comfortable sharing it</li>
              </ul>
            </>
          ),
        },
      ]}
      asideTitle="Support Inbox"
      asideBody={
        <>
          <ContactInboxEmail />
          <p>best for export issues, parsing questions, and workspace help.</p>
          <p>copy the address and email us from gmail, outlook, or any inbox you already use.</p>
        </>
      }
      actions={[
        { href: "/help", label: "Open guide", variant: "secondary" },
      ]}
    />
  );
}
