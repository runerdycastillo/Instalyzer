import { MarketingInfoPage } from "@/components/marketing/marketing-info-page";

export default function ContactPage() {
  return (
    <MarketingInfoPage
      eyebrow="contact"
      title="Get in touch with Instalyzer"
      description="Questions, support requests, and product feedback can come through our support inbox during the current soft launch."
      sections={[
        {
          title: "Email support",
          body: (
            <p>
              Use <a href="mailto:support@instalyzer.app">support@instalyzer.app</a> for
              export issues, workspace questions, and product feedback.
            </p>
          ),
        },
        {
          title: "Best place to start",
          body: (
            <p>
              If you are trying to download your Instagram export, the guide will
              usually get you unstuck faster than waiting on email.
            </p>
          ),
        },
        {
          title: "Current support flow",
          body: (
            <p>
              Support is email-first for now while account access, billing, and
              fuller workspace settings are still being rolled out.
            </p>
          ),
        },
      ]}
      asideTitle="Support Inbox"
      asideBody={
        <>
          <p>support@instalyzer.app</p>
          <p>Soft-launch support is focused on exports, parsing, and workspace issues.</p>
        </>
      }
      actions={[
        { href: "mailto:support@instalyzer.app", label: "email support", external: true },
        { href: "/help", label: "open guide" },
      ]}
    />
  );
}
