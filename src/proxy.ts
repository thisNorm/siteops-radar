import NextAuth from "next-auth";
import type { NextAuthRequest } from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { appRouteSegments, getDashboardPreviewPath } from "@/lib/app-routes";
import { getDefaultAppPath, isAdminEmail } from "@/lib/auth/access";
import { routing, type Locale } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

function readLocale(pathname: string): Locale {
  const [, maybeLocale] = pathname.split("/");

  if (routing.locales.includes(maybeLocale as Locale)) {
    return maybeLocale as Locale;
  }

  return routing.defaultLocale;
}

function stripLocale(pathname: string) {
  const locale = readLocale(pathname);
  const withoutLocale = pathname.replace(new RegExp(`^/${locale}`), "");

  return withoutLocale || "/";
}

export default auth((request: NextAuthRequest & NextRequest) => {
  const locale = readLocale(request.nextUrl.pathname);
  const pathname = stripLocale(request.nextUrl.pathname);
  const isSignInPage = pathname === "/sign-in";
  const isAuthBridgePage = pathname === "/auth/sign-in";
  const isAdminRoute =
    pathname === appRouteSegments.admin || pathname.startsWith(`${appRouteSegments.admin}/`);
  const isAuthenticated = Boolean(request.auth?.user);
  const email =
    request.auth?.user && typeof request.auth.user.email === "string"
      ? request.auth.user.email
      : null;

  if (isSignInPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getDefaultAppPath(locale, email), request.url));
    }

    return intlMiddleware(request);
  }

  if (isAuthBridgePage) {
    return NextResponse.next();
  }

  if (isAdminRoute && (!isAuthenticated || !isAdminEmail(email))) {
    return NextResponse.redirect(new URL(getDashboardPreviewPath(locale), request.url));
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
