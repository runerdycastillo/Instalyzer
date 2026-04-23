import { MarketingInfoPage } from "@/components/marketing/marketing-info-page";
import { ContactInboxEmail } from "@/components/marketing/contact-inbox-email";
import { ContactSupportForm } from "@/components/marketing/contact-support-form";
import Link from "next/link";

export default function ContactPage() {
  return (
    <MarketingInfoPage
      eyebrow="contact"
      title="Contact Us"
      description="reach out for export help, workspace questions, or product feedback."
      heroMeta={[
        "typical response time: 24-48 hours",
        "support available: monday-friday",
      ]}
      sections={[
        {
          title: "Send a support message",
          body: <ContactSupportForm />,
        },
      ]}
      asideTitle="Support Inbox"
      asideBody={
        <>
          <ContactInboxEmail />
          <p>prefer email? copy the address and send from your usual inbox.</p>
        </>
      }
      asideSecondary={
        <article className="marketing-info-page__aside-subcard">
          <span className="marketing-info-page__aside-subcard-label">best place to start</span>
          <p>
            the guide walks you through your instagram export settings and how to download it properly.
          </p>
          <Link href="/help" className="marketing-info-page__inline-link">
            open guide
          </Link>
        </article>
      }
    />
  );
}
