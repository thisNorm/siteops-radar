import { getWorkspaceOverview } from "@/lib/workspace/overview";
import type { DashboardProjectOption } from "./dashboard-view-types";

type WorkspaceProject = Awaited<ReturnType<typeof getWorkspaceOverview>>["projects"][number];

type ProjectLike = Pick<WorkspaceProject, "id" | "name" | "url" | "lastAnalyzedAt" | "latestScores"> & {
  runs?: { id: string }[];
};

export function toDashboardProjectOptions(projects: ProjectLike[]): DashboardProjectOption[] {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    url: project.url,
    lastAnalyzedAt: project.lastAnalyzedAt,
    hasAnalysis: Boolean(project.runs?.length),
    latestScores: project.latestScores,
  }));
}
