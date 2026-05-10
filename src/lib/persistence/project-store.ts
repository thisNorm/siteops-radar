import type { AnalysisStatus } from "@prisma/client";
import { normalizeUrl } from "@/lib/validators/url";
import { hasDatabaseUrl } from "./database";

type ProjectStatus = "idle" | "queued" | "running" | "succeeded" | "partial" | "failed";

export type WorkspaceProject = {
  id: string;
  name: string;
  url: string;
  competitors: {
    id: string;
    name: string;
    url: string;
  }[];
  lastStatus?: ProjectStatus;
  runs: {
    id: string;
    url: string;
    status: Exclude<ProjectStatus, "idle">;
    createdAt: string;
  }[];
};

function toProjectStatus(status: AnalysisStatus | null | undefined): ProjectStatus | undefined {
  if (!status) {
    return undefined;
  }

  return status;
}

function ensureDatabaseUrl() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL_NOT_CONFIGURED");
  }
}

export async function listProjectsForUser(userId: string): Promise<WorkspaceProject[]> {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      competitors: {
        orderBy: { createdAt: "asc" },
      },
      analysisResults: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          sourceUrl: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    url: project.sourceUrl,
    competitors: project.competitors.map((competitor) => ({
      id: competitor.id,
      name: competitor.name,
      url: competitor.sourceUrl,
    })),
    lastStatus: toProjectStatus(project.analysisResults[0]?.status) ?? "idle",
    runs: project.analysisResults.map((run) => ({
      id: run.id,
      url: run.sourceUrl,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
    })),
  }));
}

export async function createProjectForUser(userId: string, input: { name: string; url: string }) {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const normalizedUrl = normalizeUrl(input.url).replace(/\/$/, "");
  const hostname = new URL(normalizedUrl).hostname;

  const project = await prisma.project.upsert({
    where: {
      userId_normalizedUrl: {
        userId,
        normalizedUrl,
      },
    },
    update: {
      name: input.name.trim() || hostname,
      sourceUrl: normalizedUrl,
      updatedAt: new Date(),
    },
    create: {
      userId,
      name: input.name.trim() || hostname,
      sourceUrl: normalizedUrl,
      normalizedUrl,
    },
  });

  return project;
}

export async function deleteProjectForUser(userId: string, projectId: string) {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const deleted = await prisma.project.deleteMany({
    where: {
      id: projectId,
      userId,
    },
  });

  return deleted.count > 0;
}

export async function addCompetitorForProject(
  userId: string,
  projectId: string,
  input: { name: string; url: string },
) {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: { id: true },
  });

  if (!project) {
    return null;
  }

  const normalizedUrl = normalizeUrl(input.url).replace(/\/$/, "");
  const hostname = new URL(normalizedUrl).hostname;

  return prisma.competitorSite.upsert({
    where: {
      projectId_normalizedUrl: {
        projectId: project.id,
        normalizedUrl,
      },
    },
    update: {
      name: input.name.trim() || hostname,
      sourceUrl: normalizedUrl,
      updatedAt: new Date(),
    },
    create: {
      projectId: project.id,
      name: input.name.trim() || hostname,
      sourceUrl: normalizedUrl,
      normalizedUrl,
    },
  });
}

export async function deleteCompetitorForProject(userId: string, projectId: string, competitorId: string) {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const deleted = await prisma.competitorSite.deleteMany({
    where: {
      id: competitorId,
      projectId,
      project: {
        userId,
      },
    },
  });

  return deleted.count > 0;
}
