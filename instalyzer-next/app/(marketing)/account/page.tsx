import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function AccountPage() {
  return (
    <RoutePlaceholder
      route="/account"
      label="Account"
      description="Account access will land here once authentication, saved workspace ownership, and profile settings are ready."
      family="marketing"
      nextSteps={[
        "add sign in and sign up entry points",
        "connect account state to saved datasets and workspace ownership",
        "introduce profile and settings surfaces once auth is live",
      ]}
      links={[
        { href: "/", label: "back home" },
        { href: "/app", label: "open workspace" },
        { href: "/contact", label: "contact support" },
      ]}
    />
  );
}
