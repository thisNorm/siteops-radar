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
  getSignInPath,
} from "@/lib/app-routes";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";
import { LocaleSwitcher } from "./locale-switcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const nav: { label: string; icon: LucideIcon; href: AppRouteSegment }[] = [
    { label: t("nav.dashboard"), icon: Gauge, href: appRouteSegments.dashboard },
    ...(session?.user?.isAdmin
      ? [{ label: t("nav.admin"), icon: Shield, href: appRouteSegments.admin }]
      : []),
    { label: t("nav.projects"), icon: Activity, href: appRouteSegments.projects },
    { label: t("nav.reports"), icon: FileText, href: appRouteSegments.reports },
    { label: t("nav.alerts"), icon: Bell, href: appRouteSegments.settings },
    { label: t("nav.settings"), icon: Settings, href: appRouteSegments.settings },
  ];
  const initials = (session?.user?.name ?? session?.user?.email ?? "S").charAt(0).toUpperCase();
  const signInPath = getSignInPath(locale);

  function handleSignOut() {
    void signOut({ redirectTo: getSignInPath(locale) });
  }

  function handleSignIn() {
    window.location.assign(signInPath);
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

            return (
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
            );
          })}
        </nav>
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
              <a href={signInPath}>
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
