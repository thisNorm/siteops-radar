import NextAuth from "next-auth";
import type { NextAuthRequest } from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
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
  const isPublicPage = pathname === "/" || pathname === "/dashboard";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
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

  if (isPublicPage) {
    return intlMiddleware(request);
  }

  if (!isAuthenticated) {
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminRoute && !isAdminEmail(email)) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
