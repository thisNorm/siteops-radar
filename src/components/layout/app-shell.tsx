"use client";

import {
  Activity,
  Bell,
  FileText,
  Gauge,
  LogIn,
  Settings,
  Shield,
  LogOut,
  Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { Separator } from "@/components/ui/separator";
import { Link, usePathname } from "@/i18n/navigation";
import {
  type AppRouteSegment,
  appRouteSegments,
  getAdminPath,
  getDashboardPreviewPath,
  getDashboardSitesPath,
  getLocalizedAppPath,
  getSignInPath,
} from "@/lib/app-routes";
import { buildSignInPath } from "@/lib/auth/access";
import { cn } from "@/lib/utils";
import { AppShellWorkspaceCard } from "./app-shell-workspace-card";
import { ThemeSwitcher } from "./theme-switcher";
import { LocaleSwitcher } from "./locale-switcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const dashboardHref = isAuthenticated
    ? appRouteSegments.dashboardSites
    : appRouteSegments.dashboardPreview;
  const dashboardCallbackPath = isAuthenticated ? getDashboardSitesPath(locale) : getDashboardPreviewPath(locale);
  const nav: { label: string; icon: LucideIcon; href: AppRouteSegment; requiresAuth: boolean }[] = [
    { label: t("nav.dashboard"), icon: Gauge, href: dashboardHref, requiresAuth: false },
    ...(session?.user?.isAdmin
      ? [{ label: t("nav.admin"), icon: Shield, href: appRouteSegments.admin, requiresAuth: true }]
      : []),
    { label: t("nav.projects"), icon: Activity, href: appRouteSegments.projects, requiresAuth: true },
    { label: t("nav.reports"), icon: FileText, href: appRouteSegments.reports, requiresAuth: true },
    { label: isAuthenticated ? t("nav.alerts") : t("auth.signIn"), icon: Bell, href: appRouteSegments.settings, requiresAuth: true },
    { label: t("nav.settings"), icon: Settings, href: appRouteSegments.settings, requiresAuth: true },
  ];
  const initials = (session?.user?.name ?? session?.user?.email ?? "S").charAt(0).toUpperCase();
  const adminSignInPath = buildSignInPath(locale, getAdminPath(locale));

  function handleSignOut() {
    void signOut({ redirectTo: getSignInPath(locale) });
  }

  function handleSignIn(callbackPath = dashboardCallbackPath) {
    window.location.assign(buildSignInPath(locale, callbackPath));
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-[232px] border-r border-border/70 bg-sidebar/95 px-4 py-7 xl:block">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-200/70">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">{t("app.name")}</div>
          </div>
        </div>
        <Separator className="my-7" />
        <nav className="space-y-2">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const locked = item.requiresAuth && !isAuthenticated;
            const callbackPath = getLocalizedAppPath(locale, item.href);
            const signInHref = buildSignInPath(locale, callbackPath);

            return (
              locked ? (
                <a
                  key={item.label}
                  href={signInHref}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors",
                    "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  <Badge variant="outline" className="ml-auto gap-1 rounded-md px-1.5">
                    <Lock className="h-3 w-3" />
                    {t("auth.signIn")}
                  </Badge>
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-violet-50 text-primary ring-1 ring-violet-100"
                      : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  {item.label === t("nav.reports") ? <Badge className="ml-auto rounded-md bg-violet-100 px-1.5 text-violet-700 hover:bg-violet-100">AI</Badge> : null}
                </Link>
              )
            );
          })}
        </nav>
        <AppShellWorkspaceCard
          isAuthenticated={isAuthenticated}
          isAdmin={Boolean(session?.user?.isAdmin)}
        />
        <div className="absolute right-4 bottom-5 left-4 rounded-lg border bg-background/90 px-3 py-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate text-sm font-medium">
                    <span className="truncate">{session?.user?.name ?? t("shell.userFallback")}</span>
                    {session?.user?.isAdmin ? <Badge variant="outline">{t("shell.adminBadge")}</Badge> : null}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{session?.user?.email ?? "-"}</div>
                </div>
              </div>
              <Button className="mt-3 w-full" variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                {t("auth.signOut")}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("auth.freeModeTitle")}</div>
                <p className="text-xs leading-5 text-muted-foreground">{t("auth.freeModeDescription")}</p>
              </div>
              <Button className="mt-3 w-full" size="sm" onClick={() => handleSignIn()}>
                <LogIn className="h-4 w-4" />
                {t("auth.signIn")}
              </Button>
            </>
          )}
        </div>
      </aside>
      <div className="xl:pl-[232px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="min-w-0">
            <div className="text-sm font-semibold xl:hidden">{t("app.name")}</div>
            <div className="hidden text-sm text-muted-foreground xl:block">
              {t("app.description")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("auth.signOut")}</span>
              </Button>
            ) : (
              <a href={adminSignInPath}>
                <Button variant="outline" size="sm">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("auth.signIn")}</span>
                </Button>
              </a>
            )}
            <LocaleSwitcher />
            <ThemeSwitcher />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1520px] px-5 py-7 md:px-10">{children}</main>
      </div>
    </div>
  );
}
