import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { getAuthorizedEmails, isAdminEmail, isAuthorizedEmail } from "@/lib/auth/access";

function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function isDevCredentialsEnabled() {
  return process.env.NODE_ENV !== "production";
}

function isGoogleAccessEnabled() {
  return isGoogleConfigured() && (process.env.NODE_ENV !== "production" || getAuthorizedEmails().length > 0);
}

const credentialsSchema = z.object({
  email: z.email(),
});

const providers: NextAuthConfig["providers"] = [];

if (isGoogleConfigured()) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  );
}

if (isDevCredentialsEnabled()) {
  providers.push(
    Credentials({
      name: "Local Dev Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const allowedEmail = (process.env.DEV_LOGIN_EMAIL ?? "local@siteopsradar.dev").toLowerCase();

        if (parsed.data.email.toLowerCase() !== allowedEmail) {
          return null;
        }

        return {
          id: allowedEmail,
          email: allowedEmail,
          name: process.env.DEV_LOGIN_NAME ?? "Local Operator",
          image: null,
        };
      },
    }),
  );
}

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return isDevCredentialsEnabled();
      }

      return isGoogleAccessEnabled() && isAuthorizedEmail(user.email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }

      if (user?.name) {
        token.name = user.name;
      }

      if (user?.image) {
        token.picture = user.image;
      }

      if (typeof token.email === "string") {
        token.isAdmin = isAdminEmail(token.email);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }

        if (typeof token.name === "string") {
          session.user.name = token.name;
        }

        if (typeof token.picture === "string") {
          session.user.image = token.picture;
        }

        session.user.isAdmin = Boolean(token.isAdmin);
      }

      return session;
    },
  },
};

export function getAuthProviderAvailability() {
  return {
    google: isGoogleAccessEnabled(),
    googleConfigured: isGoogleConfigured(),
    devCredentials: isDevCredentialsEnabled(),
    authorizedEmailsConfigured: getAuthorizedEmails().length > 0,
    devLoginEmail: process.env.DEV_LOGIN_EMAIL ?? "local@siteopsradar.dev",
  };
}
