import { HelpRoute } from "@/components/marketing/help-route";

type HelpPageProps = {
  searchParams?: Promise<{
    mode?: string | string[];
  }>;
};

export default async function HelpPage({ searchParams }: HelpPageProps) {
  const params = await searchParams;
  const mode = Array.isArray(params?.mode) ? params?.mode[0] : params?.mode;
  const initialTab = mode === "visual-guide" ? "visual-guide" : "quick-steps";

  return <HelpRoute initialTab={initialTab} />;
}
