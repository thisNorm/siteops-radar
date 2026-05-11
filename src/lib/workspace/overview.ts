import { unstable_noStore as noStore } from "next/cache";
import { getCurrentSessionIdentity, requireCurrentUser } from "@/lib/auth/session";
import { hasDatabaseUrl } from "@/lib/persistence/database";
import { listProjectsForUser, type WorkspaceProject } from "@/lib/persistence/project-store";

export type WorkspaceOverview = {
  identity: Awaited<ReturnType<typeof getCurrentSessionIdentity>>;
  dbConfigured: boolean;
  projects: WorkspaceProject[];
  errorCode?: string;
};

export async function getWorkspaceOverview(): Promise<WorkspaceOverview> {
  noStore();

  const identity = await getCurrentSessionIdentity();
  const dbConfigured = hasDatabaseUrl();

  if (!identity || !dbConfigured) {
    return {
      identity,
      dbConfigured,
      projects: [],
    };
  }

  try {
    const user = await requireCurrentUser();

    if (!user) {
      return {
        identity,
        dbConfigured,
        projects: [],
      };
    }

    const projects = await listProjectsForUser(user.id);

    return {
      identity,
      dbConfigured,
      projects,
    };
  } catch (error) {
    return {
      identity,
      dbConfigured,
      projects: [],
      errorCode: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    };
  }
}
