import { auth } from "@/auth";
import { isAdminEmail } from "./access";

const PUBLIC_WORKSPACE_EMAIL = "public@siteopsradar.local";
const PUBLIC_WORKSPACE_NAME = "Public workspace";

export async function getCurrentSessionIdentity() {
  const session = await auth();
  const sessionUser = session?.user;
  const email = sessionUser?.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  return {
    email,
    name: sessionUser?.name?.trim() || null,
    image: sessionUser?.image || null,
    isAdmin: isAdminEmail(email),
  };
}

export async function getWorkspaceIdentity() {
  const identity = await getCurrentSessionIdentity();

  if (identity) {
    return identity;
  }

  return {
    email: PUBLIC_WORKSPACE_EMAIL,
    name: PUBLIC_WORKSPACE_NAME,
    image: null,
    isAdmin: false,
  };
}

export async function requireCurrentUser() {
  const identity = await getWorkspaceIdentity();
  const userProfile = {
    email: identity.email,
    name: identity.name,
    image: identity.image,
  };

  const { prisma } = await import("@/lib/db");

  return prisma.user.upsert({
    where: { email: userProfile.email },
    update: {
      name: userProfile.name ?? undefined,
      image: userProfile.image ?? undefined,
    },
    create: userProfile,
  });
}
