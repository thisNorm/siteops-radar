import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { deleteProjectForUser } from "@/lib/persistence/project-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
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
