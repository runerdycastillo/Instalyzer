import { MarketingInfoPage } from "@/components/marketing/marketing-info-page";

export default function TermsPage() {
  return (
    <MarketingInfoPage
      eyebrow="terms"
      title="Terms of Service"
      description="These terms govern access to Instalyzer during the current soft launch."
      sections={[
        {
          title: "Using the product",
          body: (
            <p>
              You may use Instalyzer only with exports and account data you are
              allowed to access. Do not use the product in ways that break the law,
              abuse the service, or interfere with other users.
            </p>
          ),
        },
        {
          title: "Soft-launch availability",
          body: (
            <p>
              Instalyzer is still being actively developed. Features, outputs, and
              availability may change as the product grows, especially while auth,
              billing, and deeper workspace tooling are still being added.
            </p>
          ),
        },
        {
          title: "Your data and responsibility",
          body: (
            <p>
              You remain responsible for the exports and content you upload, and for
              making sure you have the right to analyze that data with Instalyzer.
            </p>
          ),
        },
      ]}
      asideTitle="Support"
      asideBody={
        <>
          <p>Questions about these terms can be sent to:</p>
          <p>support@instalyzer.app</p>
        </>
      }
      actions={[{ href: "mailto:support@instalyzer.app", label: "contact support", external: true }]}
    />
  );
}
