import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { createProjectForUser, listProjectsForUser } from "@/lib/persistence/project-store";

const projectSchema = z.object({
  name: z.string().trim().max(120).default(""),
  url: z.string().trim().min(4),
});

export async function GET() {
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

  try {
    const projects = await listProjectsForUser(user.id);

    return NextResponse.json({ projects });
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

export async function POST(request: Request) {
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
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        errorCode: "INVALID_REQUEST",
        errorMessage: "Project name and URL must be valid.",
      },
      { status: 400 },
    );
  }

  try {
    const project = await createProjectForUser(user.id, parsed.data);

    return NextResponse.json({ project }, { status: 201 });
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
