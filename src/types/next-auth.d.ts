import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJwt } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      isAdmin?: boolean;
    };
  }

  interface User {
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJwt {
    isAdmin?: boolean;
  }
}
