import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { deleteCompetitorForProject } from "@/lib/persistence/project-store";
import { hasDatabaseUrl } from "@/lib/persistence/database";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; competitorId: string }> },
) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      {
        errorCode: "DATABASE_NOT_CONFIGURED",
        errorMessage: "Workspace storage is not configured.",
      },
      { status: 503 },
    );
  }

  const user = await requireCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        errorCode: "UNAUTHORIZED",
        errorMessage: "Sign in is required.",
      },
      { status: 401 },
    );
  }

  const { projectId, competitorId } = await params;
  const deleted = await deleteCompetitorForProject(user.id, projectId, competitorId);

  if (!deleted) {
    return NextResponse.json(
      {
        errorCode: "COMPETITOR_NOT_FOUND",
        errorMessage: "The competitor could not be found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ deleted: true });
}
