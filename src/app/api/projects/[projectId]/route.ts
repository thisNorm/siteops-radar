import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { deleteProjectForUser, getProjectDashboardContext } from "@/lib/persistence/project-store";
import { hasDatabaseUrl } from "@/lib/persistence/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
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

  const { projectId } = await params;

  try {
    const project = await getProjectDashboardContext(user.id, projectId);

    if (!project) {
      return NextResponse.json(
        {
          errorCode: "PROJECT_NOT_FOUND",
          errorMessage: "The project could not be found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    return NextResponse.json(
      {
        errorCode: message,
        errorMessage: "Workspace storage is not configured.",
      },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
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

  const { projectId } = await params;
  const deleted = await deleteProjectForUser(user.id, projectId);

  if (!deleted) {
    return NextResponse.json(
      {
        errorCode: "PROJECT_NOT_FOUND",
        errorMessage: "The project could not be found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ deleted: true });
}
