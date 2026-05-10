import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { deleteCompetitorForProject } from "@/lib/persistence/project-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; competitorId: string }> },
) {
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
