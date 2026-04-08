import {
  ChartColumnBig,
  Clock,
  Eye,
  FileText,
  GitCompareArrows,
  MessageSquareText,
  TrendingUp,
  UserMinus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type SoftLaunchToolId =
  | "not-following-back"
  | "export-overview"
  | "relationship-view"
  | "audience-insights"
  | "reach-summary"
  | "content-interactions"
  | "story-insights"
  | "posting-guidance"
  | "growth-summary";

export type SoftLaunchTool = {
  id: SoftLaunchToolId;
  title: string;
  availability: "available now" | "coming soon";
  homeCopy: string;
  workspaceDescription: string;
  workspaceHelper: string;
  workspaceAction?: string;
  featured?: boolean;
  icon: LucideIcon;
  pillClassName: "is-free" | "is-basic" | "is-premium";
  showInWorkspaceModal?: boolean;
};

export const softLaunchTools: readonly SoftLaunchTool[] = [
  {
    id: "not-following-back",
    title: "not following back",
    availability: "available now",
    homeCopy: "Find accounts that do not follow you back.",
    workspaceDescription: "find accounts that do not follow you back.",
    workspaceHelper: "ready to use in this workspace",
    workspaceAction: "open workspace",
    featured: true,
    icon: UserMinus,
    pillClassName: "is-free",
    showInWorkspaceModal: true,
  },
  {
    id: "export-overview",
    title: "export overview",
    availability: "coming soon",
    homeCopy: "Quick summary of your dataset and export health.",
    workspaceDescription: "quick summary of your dataset and export health.",
    workspaceHelper: "planned for an upcoming release",
    icon: FileText,
    pillClassName: "is-basic",
  },
  {
    id: "relationship-view",
    title: "relationship view",
    availability: "coming soon",
    homeCopy: "Compare followers, following, and mutuals.",
    workspaceDescription: "compare followers, following, and mutuals.",
    workspaceHelper: "planned for an upcoming release",
    icon: GitCompareArrows,
    pillClassName: "is-basic",
  },
  {
    id: "audience-insights",
    title: "audience insights",
    availability: "coming soon",
    homeCopy: "Track audience movement and follower trends.",
    workspaceDescription: "track audience movement and follower trends.",
    workspaceHelper: "planned for an upcoming release",
    icon: UsersRound,
    pillClassName: "is-basic",
    showInWorkspaceModal: true,
  },
  {
    id: "reach-summary",
    title: "reach summary",
    availability: "coming soon",
    homeCopy: "Understand visibility, profile visits, and impressions.",
    workspaceDescription: "understand visibility, profile visits, and impressions.",
    workspaceHelper: "planned for an upcoming release",
    icon: Eye,
    pillClassName: "is-basic",
    showInWorkspaceModal: true,
  },
  {
    id: "content-interactions",
    title: "content interactions",
    availability: "coming soon",
    homeCopy: "See engagement across likes, comments, saves, and shares.",
    workspaceDescription: "see engagement across likes, comments, saves, and shares.",
    workspaceHelper: "planned for an upcoming release",
    icon: ChartColumnBig,
    pillClassName: "is-basic",
    showInWorkspaceModal: true,
  },
  {
    id: "story-insights",
    title: "story insights",
    availability: "coming soon",
    homeCopy: "Break down story replies and engagement signals.",
    workspaceDescription: "break down story replies and engagement signals.",
    workspaceHelper: "planned for an upcoming release",
    icon: MessageSquareText,
    pillClassName: "is-basic",
  },
  {
    id: "posting-guidance",
    title: "posting guidance",
    availability: "coming soon",
    homeCopy: "Surface timing and activity pattern insights.",
    workspaceDescription: "surface timing and activity pattern insights.",
    workspaceHelper: "planned for an upcoming release",
    icon: Clock,
    pillClassName: "is-basic",
  },
  {
    id: "growth-summary",
    title: "growth summary",
    availability: "coming soon",
    homeCopy: "Track follower growth and account momentum.",
    workspaceDescription: "track follower growth and account momentum.",
    workspaceHelper: "planned for an upcoming release",
    icon: TrendingUp,
    pillClassName: "is-basic",
  },
] as const;

export const homeShowcaseTools = softLaunchTools;

export const workspaceModalTools = softLaunchTools.filter((tool) => tool.showInWorkspaceModal);

export const resultsPreviewPills = workspaceModalTools.map((tool) => ({
  label: `${tool.title} ${tool.availability}`,
  className: tool.pillClassName,
}));

export function getSoftLaunchToolIcon(toolId: string): LucideIcon {
  return softLaunchTools.find((tool) => tool.id === toolId)?.icon || FileText;
}
