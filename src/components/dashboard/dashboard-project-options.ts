import { getWorkspaceOverview } from "@/lib/workspace/overview";
import type { DashboardProjectOption } from "./dashboard-view-types";

type WorkspaceProject = Awaited<ReturnType<typeof getWorkspaceOverview>>["projects"][number];

type ProjectLike = Pick<
  WorkspaceProject,
  "id" | "name" | "url" | "thumbnailUrl" | "lastAnalyzedAt" | "latestScores" | "competitorCount"
> & {
  runs?: { id: string }[];
};

export function toDashboardProjectOptions(projects: ProjectLike[]): DashboardProjectOption[] {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    url: project.url,
    thumbnailUrl: project.thumbnailUrl,
    lastAnalyzedAt: project.lastAnalyzedAt,
    hasAnalysis: Boolean(project.runs?.length),
    competitorCount: project.competitorCount,
    latestScores: project.latestScores,
  }));
}
