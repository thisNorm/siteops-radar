"use client";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  FileText,
  Gauge,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";
import { LocaleSwitcher } from "./locale-switcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const nav = [
    { label: t("nav.dashboard"), icon: Gauge, href: "/dashboard" },
    { label: t("nav.projects"), icon: Activity, href: "/projects" },
    { label: t("nav.competitors"), icon: BarChart3, href: "/competitors" },
    { label: t("nav.reports"), icon: FileText, href: "/reports" },
    { label: t("nav.settings"), icon: Settings, href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border/70 bg-sidebar/90 px-5 py-6 backdrop-blur xl:block">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-blue-100 to-violet-100 text-primary shadow-sm ring-1 ring-black/5">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-lg font-semibold">{t("app.name")}</div>
            <div className="text-xs text-muted-foreground">{t("app.tagline")}</div>
          </div>
        </div>
        <Separator className="my-6" />
        <nav className="space-y-1.5">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-linear-to-r from-violet-100 to-indigo-50 text-primary shadow-sm ring-1 ring-violet-200/70"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {active ? <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-primary/70" /> : null}
            </Link>
            );
          })}
        </nav>
        <div className="absolute right-5 bottom-28 left-5 rounded-3xl border border-violet-200/70 bg-linear-to-br from-violet-50 via-white to-blue-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <Badge className="bg-violet-500 text-white hover:bg-violet-500">Pro Plan</Badge>
          </div>
          <p className="mt-3 text-sm font-medium">5 / 10 sites in workspace</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Upgrade when you are ready for scheduled audits and team workspaces.
          </p>
          <div className="mt-4 rounded-2xl bg-white/80 px-3 py-2 text-center text-sm font-medium text-primary ring-1 ring-violet-200/70">
            Upgrade plan
          </div>
        </div>
        <div className="absolute right-5 bottom-5 left-5 flex items-center gap-3 rounded-3xl border bg-background/90 px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-white">
            J
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">John Doe</div>
            <div className="truncate text-xs text-muted-foreground">john@example.com</div>
          </div>
        </div>
      </aside>
      <div className="xl:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/75 px-4 backdrop-blur md:px-8">
          <div className="min-w-0">
            <div className="text-sm font-semibold xl:hidden">{t("app.name")}</div>
            <div className="hidden text-sm text-muted-foreground xl:block">
              {t("app.description")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeSwitcher />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1520px] px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
