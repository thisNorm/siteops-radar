import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { addCompetitorForProject } from "@/lib/persistence/project-store";

const competitorSchema = z.object({
  name: z.string().trim().max(120).default(""),
  url: z.string().trim().min(4),
});

export async function POST(
  request: Request,
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

  const body = await request.json().catch(() => null);
  const parsed = competitorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        errorCode: "INVALID_REQUEST",
        errorMessage: "Competitor name and URL must be valid.",
      },
      { status: 400 },
    );
  }

  const { projectId } = await params;

  try {
    const competitor = await addCompetitorForProject(user.id, projectId, parsed.data);

    if (!competitor) {
      return NextResponse.json(
        {
          errorCode: "PROJECT_NOT_FOUND",
          errorMessage: "The project could not be found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ competitor }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "INVALID_URL" ? 400 : 503;

    return NextResponse.json(
      {
        errorCode: message,
        errorMessage:
          message === "INVALID_URL"
            ? "A valid URL is required."
            : "Workspace storage is not configured.",
      },
      { status },
    );
  }
}
